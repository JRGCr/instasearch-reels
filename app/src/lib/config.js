// Central config for the InstaSearch web app (Cloudflare Worker).
// Keep the Graph version in sync with ../../../discover_reels.py (GRAPH const).

export const GRAPH_VERSION = "v21.0";
export const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;
export const OAUTH_DIALOG = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;

// Scopes for Facebook Login. business_discovery needs instagram_basic +
// pages_read_engagement + instagram_manage_insights (the Advanced-Access one).
// pages_show_list + business_management let us resolve the user's Page -> IG account.
// These are ADDITIVE to the shared app's publishing scopes — we never remove any.
export const SCOPES = [
  "instagram_basic",
  "pages_show_list",
  "pages_read_engagement",
  "instagram_manage_insights",
  "business_management",
];

// The permission whose Advanced Access this whole app exists to earn.
export const CRITICAL_SCOPE = "instagram_manage_insights";

// Media fields pulled per competitor post (mirrors discover_reels.py MEDIA_FIELDS).
export const MEDIA_FIELDS =
  "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count,thumbnail_url,media_url";

export const SESSION_COOKIE = "isid";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const PRODUCT_NAME = "InstaSearch";
export const PRODUCT_TAGLINE =
  "Internal competitive-intelligence tool for the CodeSamur.ai social team";
export const PRODUCT_OWNER = "CodeSamur.ai";
export const CONTACT_EMAIL = "support@codesamur.ai";
