import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { Webhook, WebhookVerificationError } from "standardwebhooks";

type PolarEvent = {
  type?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
};

type ClientPayload = {
  full_name: string | null;
  email: string;
  organization: string | null;
  polar_customer_id: string | null;
  polar_subscription_id: string | null;
  polar_product_id: string | null;
  polar_price_id: string | null;
  status: string;
  tier: string | null;
  onboarding_status: string;
  source: "polar";
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supportedEvents = new Set([
  "order.paid",
  "subscription.created",
  "subscription.active",
  "subscription.updated",
  "subscription.canceled",
  "subscription.revoked",
]);

const activationEvents = new Set(["order.paid", "subscription.active"]);
const cancellationEvents = new Set([
  "subscription.canceled",
  "subscription.revoked",
]);

const onboardingTaskTitles = [
  "Send private onboarding email",
  "Schedule workflow audit",
  "Collect client preferences",
  "Configure communications workflow",
  "Configure approval rules",
];

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

function clean(value: unknown, fallback = "") {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }

  return String(value).trim();
}

function getPath(obj: Record<string, unknown> | undefined, paths: string[]) {
  for (const path of paths) {
    const value = path.split(".").reduce<unknown>((current, key) => {
      if (!current || typeof current !== "object") return undefined;
      return (current as Record<string, unknown>)[key];
    }, obj);

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return null;
}

function extractResourceId(data: Record<string, unknown> | undefined) {
  return getPath(data, ["id", "order.id", "subscription.id", "customer.id"]);
}

function extractClient(data: Record<string, unknown> | undefined, eventType: string): ClientPayload | null {
  const email = getPath(data, [
    "customer.email",
    "customer_email",
    "email",
    "user.email",
    "billing_email",
  ]);

  if (!email) return null;

  const firstName = getPath(data, ["customer.name", "customer_name", "name", "user.name"]);
  const organization = getPath(data, [
    "customer.organization",
    "organization",
    "company",
    "billing_name",
  ]);
  const polarCustomerId = getPath(data, ["customer.id", "customer_id"]);
  const subscriptionId = getPath(data, [
    "subscription.id",
    "subscription_id",
    "subscription",
    "id",
  ]);
  const productId = getPath(data, [
    "product.id",
    "product_id",
    "items.0.product_id",
    "line_items.0.product_id",
  ]);
  const priceId = getPath(data, [
    "price.id",
    "price_id",
    "items.0.price_id",
    "line_items.0.price_id",
  ]);
  const tier = getPath(data, [
    "product.name",
    "product_name",
    "price.name",
    "price_name",
    "items.0.product.name",
  ]);

  return {
    full_name: firstName,
    email: email.toLowerCase(),
    organization,
    polar_customer_id: polarCustomerId,
    polar_subscription_id:
      eventType.startsWith("subscription.") || getPath(data, ["subscription.id", "subscription_id"])
        ? subscriptionId
        : null,
    polar_product_id: productId,
    polar_price_id: priceId,
    status:
      eventType === "subscription.canceled"
        ? "canceled"
        : eventType === "subscription.revoked"
          ? "revoked"
          : "active",
    tier,
    onboarding_status: "pending",
    source: "polar",
  };
}

async function sendOperatorAlert(params: {
  resendApiKey: string;
  operatorEmail: string;
  fromEmail: string;
  subject: string;
  lines: string[];
}) {
  const resend = new Resend(params.resendApiKey);
  const text = params.lines.join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;color:#111;line-height:1.5">
      ${params.lines.map((line) => (line ? `<p>${line}</p>` : "<br />")).join("")}
    </div>
  `;

  const { data, error } = await resend.emails.send({
    from: params.fromEmail,
    to: [params.operatorEmail],
    subject: params.subject,
    text,
    html,
  });

  if (error) {
    console.error("[polar-webhook] Operator alert failed", error);
    return null;
  }

  return data?.id || null;
}

async function createDefaultOnboardingTasks(
  supabase: ReturnType<typeof createClient<any>>,
  clientId: string,
) {
  const dueAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const rows = onboardingTaskTitles.map((title) => ({
    client_id: clientId,
    title,
    status: "pending",
    due_at: dueAt,
  }));

  const { error } = await supabase.from("onboarding_tasks").insert(rows);

  if (error) {
    console.error("[polar-webhook] Failed creating onboarding tasks", {
      clientId,
      error,
    });
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const polarWebhookSecret = Deno.env.get("POLAR_WEBHOOK_SECRET");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const operatorEmail = Deno.env.get("BLACKWOOD_OPERATOR_EMAIL");
  const fromEmail =
    Deno.env.get("RESEND_FROM_EMAIL") ||
    "Blackwood Private Office <access@blackwoodprivate.xyz>";

  if (!supabaseUrl || !serviceRoleKey || !polarWebhookSecret) {
    return json({ error: "Missing webhook configuration" }, 500);
  }

  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers.entries());
  const webhookId = request.headers.get("webhook-id");

  if (!webhookId) {
    return json({ error: "Missing webhook-id header" }, 400);
  }

  let event: PolarEvent;

  try {
    const webhook = new Webhook(polarWebhookSecret);
    event = webhook.verify(rawBody, headers) as PolarEvent;
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      console.warn("[polar-webhook] Signature verification failed", {
        webhookId,
      });
      return json({ error: "Invalid webhook signature" }, 403);
    }

    console.error("[polar-webhook] Verification error", error);
    return json({ error: "Webhook verification failed" }, 403);
  }

  const eventType = clean(event.type);
  const data = event.data || {};
  const resourceId = extractResourceId(data);
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: storedEvent, error: storeError } = await supabase
    .from("polar_webhook_events")
    .insert({
      webhook_id: webhookId,
      event_type: eventType || "unknown",
      polar_resource_id: resourceId,
      processed: false,
      payload: event,
    })
    .select("id")
    .single();

  if (storeError) {
    if (storeError.code === "23505") {
      console.info("[polar-webhook] Duplicate delivery ignored", {
        webhookId,
        eventType,
      });
      return json({ ok: true, duplicate: true }, 202);
    }

    console.error("[polar-webhook] Failed storing event", storeError);
    return json({ error: "Unable to store webhook event" }, 500);
  }

  if (!supportedEvents.has(eventType)) {
    await supabase
      .from("polar_webhook_events")
      .update({ processed: true })
      .eq("id", storedEvent.id);

    return json({ ok: true, ignored: true, event_type: eventType }, 202);
  }

  const clientPayload = extractClient(data, eventType);
  let clientId: string | null = null;

  if (activationEvents.has(eventType)) {
    if (!clientPayload) {
      console.warn("[polar-webhook] Paid/active event missing customer email", {
        webhookId,
        eventType,
      });
    } else {
      const { data: client, error } = await supabase
        .from("clients")
        .upsert(clientPayload, { onConflict: "email" })
        .select("id")
        .single();

      if (error) {
        console.error("[polar-webhook] Client upsert failed", error);
        return json({ error: "Unable to upsert client" }, 500);
      }

      clientId = client.id;
      await createDefaultOnboardingTasks(supabase, client.id);

      if (resendApiKey && operatorEmail) {
        await sendOperatorAlert({
          resendApiKey,
          operatorEmail,
          fromEmail,
          subject: "New Blackwood Paid Client",
          lines: [
            "New Blackwood paid client",
            "",
            `Name: ${clientPayload.full_name || "Not provided"}`,
            `Email: ${clientPayload.email}`,
            `Tier/Product: ${clientPayload.tier || clientPayload.polar_product_id || "Not provided"}`,
            `Polar customer id: ${clientPayload.polar_customer_id || "Not provided"}`,
            `Subscription id: ${clientPayload.polar_subscription_id || "Not provided"}`,
          ],
        });
      }
    }
  }

  if (eventType === "subscription.created" || eventType === "subscription.updated") {
    if (clientPayload) {
      const { data: client } = await supabase
        .from("clients")
        .upsert(clientPayload, { onConflict: "email" })
        .select("id")
        .single();
      clientId = client?.id || null;
    }
  }

  if (cancellationEvents.has(eventType)) {
    const status = eventType === "subscription.revoked" ? "revoked" : "canceled";
    const subscriptionId = getPath(data, ["subscription.id", "subscription_id", "id"]);
    const customerId = getPath(data, ["customer.id", "customer_id"]);
    const email = getPath(data, ["customer.email", "customer_email", "email"]);

    let query = supabase.from("clients").update({ status }).select("id, email, full_name, polar_subscription_id");
    if (subscriptionId) query = query.eq("polar_subscription_id", subscriptionId);
    else if (customerId) query = query.eq("polar_customer_id", customerId);
    else if (email) query = query.eq("email", email.toLowerCase());

    const { data: clients, error } = await query;

    if (error) {
      console.error("[polar-webhook] Cancellation update failed", error);
      return json({ error: "Unable to update canceled client" }, 500);
    }

    const client = clients?.[0];
    clientId = client?.id || null;

    if (resendApiKey && operatorEmail) {
      await sendOperatorAlert({
        resendApiKey,
        operatorEmail,
        fromEmail,
        subject: `Blackwood Subscription ${status === "revoked" ? "Revoked" : "Canceled"}`,
        lines: [
          `Subscription ${status}`,
          "",
          `Name: ${client?.full_name || "Not provided"}`,
          `Email: ${client?.email || email || "Not provided"}`,
          `Subscription id: ${subscriptionId || "Not provided"}`,
          `Polar customer id: ${customerId || "Not provided"}`,
        ],
      });
    }
  }

  await supabase
    .from("polar_webhook_events")
    .update({ processed: true })
    .eq("id", storedEvent.id);

  console.info("[polar-webhook] Processed", {
    webhookId,
    eventType,
    resourceId,
    clientId,
  });

  return json({
    ok: true,
    event_type: eventType,
    polar_resource_id: resourceId,
    client_id: clientId,
  });
});
