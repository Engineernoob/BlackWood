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

  const { reply_draft_id } = await request.json().catch(() => ({}));
  if (!reply_draft_id) return json({ error: "Missing reply_draft_id" }, 400);

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

  const { data: draft, error } = await supabase
    .from("reply_drafts")
    .select("*, email_threads(*, prospects(*))")
    .eq("id", reply_draft_id)
    .single();

  if (error || !draft) return json({ error: "Reply draft not found", details: error }, 404);
  if (draft.requires_approval && draft.status !== "approved") {
    return json({ error: "Reply requires approval before sending" }, 409);
  }

  const thread = draft.email_threads;
  const prospect = thread?.prospects;
  if (!prospect?.email) return json({ error: "Prospect email missing" }, 400);

  const { data: sent, error: sendError } = await resend.emails.send({
    from: fromEmail,
    to: [prospect.email],
    subject: "Re: Private coordination support",
    text: draft.body,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;white-space:pre-line;color:#111">${draft.body}</div>`,
    ...(replyTo ? { replyTo } : {}),
  });

  if (sendError) {
    console.error("[send-reply-email] Resend error", { reply_draft_id, sendError });
    return json({ error: "Unable to send reply", details: sendError }, 502);
  }

  const now = new Date().toISOString();
  await supabase.from("email_messages").insert({
    thread_id: draft.thread_id,
    prospect_id: thread.prospect_id,
    direction: "outbound",
    from_email: fromEmail,
    to_email: prospect.email,
    subject: "Re: Private coordination support",
    body: draft.body,
    resend_email_id: sent?.id,
    classification: { source: "send-reply-email", approved: draft.status === "approved" },
  });

  await supabase
    .from("reply_drafts")
    .update({ status: draft.requires_approval ? "sent" : "auto_sent" })
    .eq("id", draft.id);

  await supabase
    .from("email_threads")
    .update({
      last_message_at: now,
      status: draft.requires_approval ? "open" : "auto_replied",
      requires_approval: false,
    })
    .eq("id", draft.thread_id);

  console.info("[send-reply-email] Sent", { reply_draft_id, resend_id: sent?.id });
  return json({ ok: true, resend_email_id: sent?.id });
});
