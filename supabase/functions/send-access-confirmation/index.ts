import { Resend } from "resend";

type AccessRequestRow = {
  id?: string;
  created_at?: string;
  full_name?: string;
  role?: string;
  organization?: string | null;
  email?: string;
  scope?: string | null;
  note?: string | null;
  score?: number;
  priority?: string;
};

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: AccessRequestRow;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-blackwood-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const subject = "Your Blackwood Request Has Been Received";

const copy = {
  high: [
    "Thank you for your request.",
    "",
    "Blackwood operates privately with a limited number of relationships at a time. Your request has been received and is currently under review.",
    "",
    "If aligned, we will reach out directly.",
    "",
    "— Blackwood Private Office",
  ],
  medium: [
    "Thank you for your request.",
    "",
    "Blackwood operates privately with a limited number of relationships at a time. Your request has been received and is currently under review.",
    "",
    "If aligned, we will reach out directly.",
    "",
    "— Blackwood Private Office",
  ],
  low: [
    "Thank you for your interest. Requests are reviewed selectively.",
    "",
    "— Blackwood Private Office",
  ],
};

function clean(value: unknown, fallback = "") {
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

function normalizePriority(priority: unknown) {
  const value = clean(priority, "low").toLowerCase();

  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }

  return "low";
}

function renderText(row: AccessRequestRow) {
  const priority = normalizePriority(row.priority);
  return copy[priority].join("\n");
}

function renderHtml(row: AccessRequestRow) {
  const priority = normalizePriority(row.priority);
  const paragraphs = copy[priority].map((line) =>
    line ? `<p>${escapeHtml(line)}</p>` : `<div style="height:8px"></div>`,
  );

  return `
    <div style="margin:0;padding:0;background:#0A0A0A;">
      <div style="max-width:560px;margin:0 auto;padding:40px 24px;font-family:Arial,sans-serif;color:#F7F3EA;line-height:1.6;">
        <div style="border:1px solid rgba(212,175,55,0.24);background:rgba(255,255,255,0.035);border-radius:14px;padding:28px;">
          <p style="margin:0 0 20px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#D4AF37;">Blackwood Private Office</p>
          <div style="font-size:15px;color:#D8D2C4;">
            ${paragraphs.join("")}
          </div>
        </div>
      </div>
    </div>
  `;
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

  const webhookSecret = Deno.env.get("BLACKWOOD_WEBHOOK_SECRET");
  const providedSecret = request.headers.get("x-blackwood-webhook-secret");

  if (!webhookSecret || providedSecret !== webhookSecret) {
    console.warn("[send-access-confirmation] Unauthorized webhook request");
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders },
    );
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail =
    Deno.env.get("RESEND_CONFIRMATION_FROM_EMAIL") ||
    Deno.env.get("RESEND_FROM_EMAIL") ||
    "Blackwood Private Office <access@blackwoodprivate.xyz>";
  const replyToEmail = Deno.env.get("RESEND_REPLY_TO_EMAIL");

  if (!resendApiKey) {
    return Response.json(
      { error: "Missing RESEND_API_KEY" },
      { status: 500, headers: corsHeaders },
    );
  }

  let payload: WebhookPayload | AccessRequestRow;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: corsHeaders },
    );
  }

  const row: AccessRequestRow =
    "record" in payload && payload.record
      ? payload.record
      : (payload as AccessRequestRow);

  if (!row.email) {
    console.warn("[send-access-confirmation] Missing recipient email", {
      id: row.id,
    });
    return Response.json(
      { error: "Missing recipient email" },
      { status: 400, headers: corsHeaders },
    );
  }

  const priority = normalizePriority(row.priority);
  const resend = new Resend(resendApiKey);

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [row.email],
    subject,
    text: renderText(row),
    html: renderHtml(row),
    ...(replyToEmail ? { replyTo: replyToEmail } : {}),
  });

  if (error) {
    console.error("[send-access-confirmation] Resend error", {
      id: row.id,
      email: row.email,
      priority,
      score: row.score,
      error,
    });

    return Response.json(
      { error: "Unable to send confirmation", details: error },
      { status: 502, headers: corsHeaders },
    );
  }

  console.info("[send-access-confirmation] Confirmation sent", {
    id: row.id,
    email: row.email,
    priority,
    score: row.score,
    resend_id: data?.id,
  });

  return Response.json(
    { ok: true, id: data?.id, priority },
    { status: 200, headers: corsHeaders },
  );
});
