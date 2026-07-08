// D1 data access. All queries scoped by owner_ig_id so one app user never sees
// another's tracked list.

export async function listAccounts(env, ownerId) {
  const { results } = await env.DB.prepare(
    `SELECT a.*,
            s.followers_count AS followers_count,
            s.media_count     AS media_count,
            s.captured_at     AS last_captured
       FROM accounts a
       LEFT JOIN snapshots s ON s.id = (
         SELECT id FROM snapshots WHERE account_id = a.id ORDER BY captured_at DESC LIMIT 1
       )
      WHERE a.owner_ig_id = ?
      ORDER BY s.followers_count DESC NULLS LAST, a.username`
  )
    .bind(ownerId)
    .all();
  return results || [];
}

export async function getAccount(env, ownerId, id) {
  return await env.DB.prepare(
    `SELECT * FROM accounts WHERE id = ? AND owner_ig_id = ?`
  )
    .bind(id, ownerId)
    .first();
}

export async function getAccountByUsername(env, ownerId, username) {
  return await env.DB.prepare(
    `SELECT * FROM accounts WHERE owner_ig_id = ? AND username = ?`
  )
    .bind(ownerId, username)
    .first();
}

// Insert or update the account profile; returns the account id.
export async function upsertAccount(env, ownerId, profile, now) {
  const existing = await getAccountByUsername(env, ownerId, profile.username);
  if (existing) {
    await env.DB.prepare(
      `UPDATE accounts SET name=?, biography=?, website=?, profile_picture_url=? WHERE id=?`
    )
      .bind(profile.name, profile.biography, profile.website, profile.profile_picture_url, existing.id)
      .run();
    return existing.id;
  }
  const res = await env.DB.prepare(
    `INSERT INTO accounts (owner_ig_id, username, name, biography, website, profile_picture_url, added_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      ownerId,
      profile.username,
      profile.name,
      profile.biography,
      profile.website,
      profile.profile_picture_url,
      now
    )
    .run();
  return res.meta.last_row_id;
}

export async function addSnapshot(env, accountId, profile, now) {
  await env.DB.prepare(
    `INSERT INTO snapshots (account_id, followers_count, media_count, captured_at) VALUES (?, ?, ?, ?)`
  )
    .bind(accountId, profile.followers_count, profile.media_count, now)
    .run();
}

export async function upsertMedia(env, accountId, items, now) {
  const stmt = env.DB.prepare(
    `INSERT INTO media (id, account_id, caption, media_type, media_product_type, permalink,
                        thumbnail_url, timestamp, like_count, comments_count, captured_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       like_count=excluded.like_count,
       comments_count=excluded.comments_count,
       caption=excluded.caption,
       thumbnail_url=excluded.thumbnail_url,
       captured_at=excluded.captured_at`
  );
  const batch = items.map((m) =>
    stmt.bind(
      m.id,
      accountId,
      m.caption || null,
      m.media_type || null,
      m.media_product_type || null,
      m.permalink || null,
      m.thumbnail_url || null,
      m.timestamp || null,
      m.like_count ?? null,
      m.comments_count ?? null,
      now
    )
  );
  if (batch.length) await env.DB.batch(batch);
}

export async function getSnapshots(env, accountId) {
  const { results } = await env.DB.prepare(
    `SELECT followers_count, media_count, captured_at FROM snapshots
      WHERE account_id = ? ORDER BY captured_at`
  )
    .bind(accountId)
    .all();
  return results || [];
}

export async function getMedia(env, accountId) {
  const { results } = await env.DB.prepare(
    `SELECT * FROM media WHERE account_id = ? ORDER BY timestamp DESC`
  )
    .bind(accountId)
    .all();
  return results || [];
}

export async function deleteAccount(env, ownerId, id) {
  const acct = await getAccount(env, ownerId, id);
  if (!acct) return;
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM media WHERE account_id = ?`).bind(id),
    env.DB.prepare(`DELETE FROM snapshots WHERE account_id = ?`).bind(id),
    env.DB.prepare(`DELETE FROM accounts WHERE id = ? AND owner_ig_id = ?`).bind(id, ownerId),
  ]);
}

// Data-deletion: wipe everything for one app user (used by /data-deletion flow).
export async function deleteAllForOwner(env, ownerId) {
  const { results } = await env.DB.prepare(
    `SELECT id FROM accounts WHERE owner_ig_id = ?`
  )
    .bind(ownerId)
    .all();
  const ids = (results || []).map((r) => r.id);
  const stmts = [];
  for (const id of ids) {
    stmts.push(env.DB.prepare(`DELETE FROM media WHERE account_id = ?`).bind(id));
    stmts.push(env.DB.prepare(`DELETE FROM snapshots WHERE account_id = ?`).bind(id));
  }
  stmts.push(env.DB.prepare(`DELETE FROM accounts WHERE owner_ig_id = ?`).bind(ownerId));
  if (stmts.length) await env.DB.batch(stmts);
  return ids.length;
}
