// Client-safe: OAuth scope constants for the Google Integration Framework.
// Kept in a plain .ts (not .server.ts) so both the browser UI and server code
// can render / request the same list without duplication.

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/business.manage",
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/adwords",
] as const;

export type GoogleScope = (typeof GOOGLE_SCOPES)[number];

export const GOOGLE_SCOPE_LABELS: Record<string, string> = {
  "openid": "Sign-in identity",
  "email": "Email address",
  "profile": "Basic profile",
  "https://www.googleapis.com/auth/business.manage": "Google Business Profile",
  "https://www.googleapis.com/auth/analytics.readonly": "Google Analytics (read)",
  "https://www.googleapis.com/auth/webmasters.readonly": "Search Console (read)",
  "https://www.googleapis.com/auth/gmail.readonly": "Gmail (read)",
  "https://www.googleapis.com/auth/adwords": "Google Ads",
};

export type GoogleResourceType =
  | "gbp_account"
  | "gbp_location"
  | "ga4_property"
  | "gsc_site"
  | "gmail_address"
  | "ads_customer";

export const RESOURCE_LABELS: Record<GoogleResourceType, string> = {
  gbp_account: "Business Profile account",
  gbp_location: "Business Profile location",
  ga4_property: "Analytics 4 property",
  gsc_site: "Search Console site",
  gmail_address: "Gmail address",
  ads_customer: "Google Ads customer",
};
