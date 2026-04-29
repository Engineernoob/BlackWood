import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const { draft_id } = await request.json().catch(() => ({}));
  if (!draft_id) return json({ error: "Missing draft_id" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail =
    Deno.env.get("RESEND_OUTREACH_FROM_EMAIL") ||
    Deno.env.get("RESEND_FROM_EMAIL") ||
    "Blackwood Private Office <access@blackwoodprivate.xyz>";
  const replyTo = Deno.env.get("RESEND_REPLY_TO_EMAIL");

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return json({ error: "Missing function configuration" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const resend = new Resend(resendApiKey);

  const { data: draft, error: draftError } = await supabase
    .from("outreach_drafts")
    .select("*, prospects(*)")
    .eq("id", draft_id)
    .single();

  if (draftError || !draft) return json({ error: "Draft not found", details: draftError }, 404);
  if (draft.status !== "approved") {
    return json({ error: "First-touch outreach must be approved before sending" }, 409);
  }
  if (!draft.prospects?.email) return json({ error: "Prospect email missing" }, 400);

  const { data: sent, error: sendError } = await resend.emails.send({
    from: fromEmail,
    to: [draft.prospects.email],
    subject: draft.subject,
    text: draft.body,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;white-space:pre-line;color:#111">${draft.body}</div>`,
    ...(replyTo ? { replyTo } : {}),
  });

  if (sendError) {
    await supabase.from("outreach_drafts").update({ status: "failed" }).eq("id", draft.id);
    console.error("[send-outreach-email] Resend error", { draft_id, sendError });
    return json({ error: "Unable to send outreach", details: sendError }, 502);
  }

  const now = new Date().toISOString();
  const { data: thread } = await supabase
    .from("email_threads")
    .insert({
      prospect_id: draft.prospect_id,
      last_message_at: now,
      status: "open",
      requires_approval: true,
    })
    .select("id")
    .single();

  await supabase.from("email_messages").insert({
    thread_id: thread?.id || null,
    prospect_id: draft.prospect_id,
    direction: "outbound",
    from_email: fromEmail,
    to_email: draft.prospects.email,
    subject: draft.subject,
    body: draft.body,
    resend_email_id: sent?.id,
    classification: { source: "send-outreach-email", first_touch: true },
  });

  await supabase
    .from("outreach_drafts")
    .update({
      status: "sent",
      resend_email_id: sent?.id,
      sent_at: now,
    })
    .eq("id", draft.id);

  await supabase.from("prospects").update({ status: "contacted" }).eq("id", draft.prospect_id);

  console.info("[send-outreach-email] Sent", { draft_id, prospect_id: draft.prospect_id, resend_id: sent?.id });
  return json({ ok: true, resend_email_id: sent?.id });
});
