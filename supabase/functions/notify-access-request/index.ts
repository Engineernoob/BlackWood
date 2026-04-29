import { Resend } from "resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AccessRequestNotification = {
  full_name?: string;
  role?: string;
  organization?: string | null;
  email?: string;
  scope?: string | null;
  note?: string | null;
  score?: number;
  priority?: string;
  created_at?: string;
};

function clean(value: unknown, fallback = "Not provided") {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }

  return String(value);
}

function escapeHtml(value: unknown) {
  return clean(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTimestamp(value?: string) {
  if (!value) return new Date().toISOString();

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();

  return parsed.toISOString();
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405, headers: corsHeaders },
    );
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const operatorEmail = Deno.env.get("BLACKWOOD_OPERATOR_EMAIL");
  const fromEmail =
    Deno.env.get("RESEND_FROM_EMAIL") ||
    "Blackwood <onboarding@resend.dev>";
  const replyToEmail = Deno.env.get("RESEND_REPLY_TO_EMAIL");

  if (!resendApiKey || !operatorEmail) {
    return Response.json(
      { error: "Missing notification email configuration" },
      { status: 500, headers: corsHeaders },
    );
  }

  let payload: AccessRequestNotification;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: corsHeaders },
    );
  }

  const priority = clean(payload.priority, "unreviewed").toLowerCase();
  const createdAt = formatTimestamp(payload.created_at);
  const subject = `New Blackwood Access Request — ${priority} priority`;

  const text = [
    "New Blackwood access request",
    "",
    `Name: ${clean(payload.full_name)}`,
    `Role: ${clean(payload.role)}`,
    `Organization: ${clean(payload.organization)}`,
    `Email: ${clean(payload.email)}`,
    `Scope: ${clean(payload.scope)}`,
    `Note: ${clean(payload.note)}`,
    `Score: ${clean(payload.score, "0")}`,
    `Priority: ${priority}`,
    `Created: ${createdAt}`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111;line-height:1.5">
      <p><strong>New Blackwood access request</strong></p>
      <p>
        <strong>Name:</strong> ${escapeHtml(payload.full_name)}<br />
        <strong>Role:</strong> ${escapeHtml(payload.role)}<br />
        <strong>Organization:</strong> ${escapeHtml(payload.organization)}<br />
        <strong>Email:</strong> ${escapeHtml(payload.email)}<br />
        <strong>Scope:</strong> ${escapeHtml(payload.scope)}<br />
        <strong>Note:</strong> ${escapeHtml(payload.note)}<br />
        <strong>Score:</strong> ${escapeHtml(payload.score ?? 0)}<br />
        <strong>Priority:</strong> ${escapeHtml(priority)}<br />
        <strong>Created:</strong> ${escapeHtml(createdAt)}
      </p>
    </div>
  `;

  const resend = new Resend(resendApiKey);

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [operatorEmail],
    subject,
    text,
    html,
    ...(replyToEmail ? { replyTo: replyToEmail } : {}),
  });

  if (error) {
    console.error("[notify-access-request] Resend error", error);
    return Response.json(
      { error: "Unable to send notification", details: error },
      { status: 502, headers: corsHeaders },
    );
  }

  return Response.json(
    { ok: true, id: data?.id },
    { status: 200, headers: corsHeaders },
  );
});
