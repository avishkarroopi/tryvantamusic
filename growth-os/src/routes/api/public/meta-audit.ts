// Temporary audit endpoint — safe: returns only IDs, statuses, and boolean flags.
// No tokens are ever returned.
import { createFileRoute } from "@tanstack/react-router";

const V = "v21.0";

async function gj(url: string) {
  const r = await fetch(url);
  const t = await r.text();
  let b: unknown = null;
  try { b = JSON.parse(t); } catch { b = t; }
  return { status: r.status, body: b };
}

export const Route = createFileRoute("/api/public/meta-audit")({
  server: {
    handlers: {
      GET: async () => {
        const env = process.env;
        const tok = env.WHATSAPP_ACCESS_TOKEN ?? "";
        const fbTok = env.FACEBOOK_PAGE_ACCESS_TOKEN ?? "";
        const mkTok = env.MARKETING_API_TOKEN ?? "";
        const igTok = env.INSTAGRAM_ACCESS_TOKEN ?? "";
        const appId = env.META_APP_ID ?? "";
        const appSecret = env.META_APP_SECRET ?? "";
        const app = `${appId}|${appSecret}`;
        const pageId = env.FACEBOOK_PAGE_ID ?? "";
        const waPhoneId = env.WHATSAPP_PHONE_NUMBER_ID ?? "";
        const wabaId = env.WHATSAPP_BUSINESS_ACCOUNT_ID ?? "";
        const igBiz = env.INSTAGRAM_BUSINESS_ACCOUNT_ID ?? "";
        const adAcct = env.AD_ACCOUNT_ID ?? "";

        const debug = await gj(`https://graph.facebook.com/${V}/debug_token?input_token=${tok}&access_token=${app}`);
        const fbDebug = await gj(`https://graph.facebook.com/${V}/debug_token?input_token=${fbTok}&access_token=${app}`);
        const mkDebug = await gj(`https://graph.facebook.com/${V}/debug_token?input_token=${mkTok}&access_token=${app}`);
        const page = pageId ? await gj(`https://graph.facebook.com/${V}/${pageId}?fields=id,name,instagram_business_account&access_token=${tok}`) : null;
        const waPhone = waPhoneId ? await gj(`https://graph.facebook.com/${V}/${waPhoneId}?fields=id,display_phone_number,verified_name,quality_rating&access_token=${tok}`) : null;
        const waba = wabaId ? await gj(`https://graph.facebook.com/${V}/${wabaId}?fields=id,name,message_template_namespace&access_token=${tok}`) : null;
        const templates = wabaId ? await gj(`https://graph.facebook.com/${V}/${wabaId}/message_templates?limit=3&access_token=${tok}`) : null;
        const ig = igBiz ? await gj(`https://graph.facebook.com/${V}/${igBiz}?fields=id,username,followers_count&access_token=${tok}`) : null;
        const igViaIgToken = igTok ? await gj(`https://graph.instagram.com/me?fields=id,user_id,username&access_token=${igTok}`) : null;
        const adAccounts = await gj(`https://graph.facebook.com/${V}/me/adaccounts?fields=id,name,account_status&access_token=${mkTok}`);
        const adAcctDetail = adAcct ? await gj(`https://graph.facebook.com/${V}/${adAcct.startsWith("act_") ? adAcct : "act_" + adAcct}?fields=id,name,account_status,currency,timezone_name&access_token=${mkTok}`) : null;

        return Response.json({
          env_present: {
            WHATSAPP_ACCESS_TOKEN: !!tok,
            FACEBOOK_PAGE_ACCESS_TOKEN: !!fbTok,
            MARKETING_API_TOKEN: !!mkTok,
            INSTAGRAM_ACCESS_TOKEN: !!igTok,
            META_APP_ID: !!appId,
            META_APP_SECRET: !!appSecret,
            FACEBOOK_PAGE_ID: pageId || null,
            WHATSAPP_PHONE_NUMBER_ID: waPhoneId || null,
            WHATSAPP_BUSINESS_ACCOUNT_ID: wabaId || null,
            INSTAGRAM_BUSINESS_ACCOUNT_ID: igBiz || null,
            AD_ACCOUNT_ID: adAcct || null,
            token_prefix_match_su: tok.slice(0, 20) === fbTok.slice(0, 20) && tok.slice(0, 20) === mkTok.slice(0, 20),
          },
          wa_token_debug: debug,
          fb_token_debug: fbDebug,
          mk_token_debug: mkDebug,
          page, waPhone, waba, templates, ig, igViaIgToken,
          adAccounts, adAcctDetail,
        });
      },
    },
  },
});
