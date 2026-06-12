// WHC fork brand tokens — 2026-06-12. Replaces the upstream OpenCut brand
// values with internal-tool identifiers. SITE_URL is updated post-deploy when
// we know the actual Vercel/Cloudflare hostname.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://white-haven-editor.vercel.app";

export const SITE_INFO = {
  title: "WHC Editor",
  description:
    "Internal video editor for White Haven team. Trim, stitch, caption, ship.",
  url: SITE_URL,
  openGraphImage: "/wordmark.png",
  twitterImage: "/wordmark.png",
  favicon: "/favicon.ico",
};

export const DEFAULT_LOGO_URL = "/wordmark.png";
