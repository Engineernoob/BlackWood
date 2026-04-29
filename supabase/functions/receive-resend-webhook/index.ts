import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

function includesAny(value = "", terms: string[] = []) {
  const lower = value.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function classify(subject = "", body = "") {
  const text = `${subject} ${body}`;

  if (includesAny(text, ["unsubscribe", "do not contact", "remove me"])) {
    return { intent: "unsubscribe / do not contact", sentiment: "negative", urgency: "high", requiresApproval: true, reason: "Must honor do-not-contact." };
  }
  if (includesAny(text, ["pricing", "price", "cost", "fee"])) {
    return { intent: "pricing question", sentiment: "neutral", urgency: "medium", requiresApproval: true, reason: "Pricing requires human approval." };
  }
  if (includesAny(text, ["meeting", "call", "schedule", "calendar"])) {
    return { intent: "meeting request", sentiment: "positive", urgency: "high", requiresApproval: true, reason: "High-value meeting request." };
  }
  if (includesAny(text, ["more info", "overview", "send details", "learn more"])) {
    return { intent: "asks for more info", sentiment: "positive", urgency: "medium", requiresApproval: false, reason: "Safe informational reply." };
  }
  if (includesAny(text, ["not interested", "no thanks", "not a fit"])) {
    return { intent: "not interested", sentiment: "neutral", urgency: "low", requiresApproval: false, reason: "Polite decline." };
  }
  if (includesAny(text, ["concern", "angry", "misleading", "legal", "financial"])) {
    return { intent: "objection", sentiment: "negative", urgency: "high", requiresApproval: true, reason: "Sensitive or objection-bearing reply." };
  }
  return { intent: "interested", sentiment: "positive", urgency: "medium", requiresApproval: true, reason: "Positive reply needs operator review." };
}

function writeReply(classification: ReturnType<typeof classify>) {
  const signature = "— Blackwood Private Office\nClient Relations\n\nDiscretion. Control. Execution.";

  if (classification.intent === "not interested") {
    return `Understood. Thank you for letting us know.\n\n${signature}`;
  }
  if (classification.intent === "asks for more info") {
    return `Thank you for the note.\n\nBlackwood works privately with founders and principals who need a discreet operating layer across communications, scheduling, travel, advisors, and decision workflows.\n\nWe can send a short overview if helpful.\n\n${signature}`;
  }
  if (classification.intent === "meeting request") {
    return `Thank you. A private call would be appropriate.\n\nWe will follow up with a discreet scheduling option.\n\n${signature}`;
  }
  if (classification.intent === "unsubscribe / do not contact") {
    return `Understood. We will not contact you again.\n\n${signature}`;
  }
  return `Thank you for the reply.\n\nWe will review internally and follow up privately if aligned.\n\n${signature}`;
}

function extractEmail(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return extractEmail(value[0]);
  if (typeof value === "object" && value !== null) {
    const obj = value as { email?: string; address?: string };
    return obj.email || obj.address || "";
  }
  return "";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  const providedSecret = request.headers.get("x-blackwood-webhook-secret");
  if (webhookSecret && providedSecret !== webhookSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Missing function configuration" }, 500);

  const payload = await request.json().catch(() => ({}));
  const data = payload.data || payload;
  const fromEmail = extractEmail(data.from || data.from_email);
  const toEmail = extractEmail(data.to || data.to_email);
  const subject = data.subject || "Inbound reply";
  const body = data.text || data.html || data.body || "";
  const resendEmailId = data.email_id || data.id || payload.id;
  const classification = classify(subject, body);
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: prospect } = await supabase
    .from("prospects")
    .select("*")
    .eq("email", fromEmail)
    .maybeSingle();

  const now = new Date().toISOString();
  const { data: thread } = await supabase
    .from("email_threads")
    .insert({
      prospect_id: prospect?.id || null,
      last_message_at: now,
      status: classification.requiresApproval ? "awaiting_approval" : "open",
      sentiment: classification.sentiment,
      intent: classification.intent,
      requires_approval: classification.requiresApproval,
    })
    .select("id")
    .single();

  await supabase.from("email_messages").insert({
    thread_id: thread?.id || null,
    prospect_id: prospect?.id || null,
    direction: "inbound",
    from_email: fromEmail,
    to_email: toEmail,
    subject,
    body,
    resend_email_id: resendEmailId,
    classification,
  });

  await supabase.from("reply_drafts").insert({
    thread_id: thread?.id || null,
    body: writeReply(classification),
    status: classification.requiresApproval ? "draft" : "approved",
    requires_approval: classification.requiresApproval,
  });

  if (prospect?.id && classification.intent === "unsubscribe / do not contact") {
    await supabase.from("prospects").update({ status: "do_not_contact" }).eq("id", prospect.id);
  }

  console.info("[receive-resend-webhook] Stored inbound reply", {
    prospect_id: prospect?.id,
    thread_id: thread?.id,
    intent: classification.intent,
    requires_approval: classification.requiresApproval,
  });

  return json({ ok: true, thread_id: thread?.id, classification });
});
