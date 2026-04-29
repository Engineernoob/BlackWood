import { supabase } from "./supabase";
import { scoreAccessRequest } from "./utils/scoreAccessRequest";

export async function submitAccessRequest(form) {
  const required = ["full_name", "role", "email"];

  for (const field of required) {
    if (!form[field] || !String(form[field]).trim()) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  const { score, priority, reasons } = scoreAccessRequest(form);

  const payload = {
    full_name: form.full_name.trim(),
    role: form.role.trim(),
    organization: form.organization?.trim() || null,
    email: form.email.trim().toLowerCase(),
    scope: form.scope || null,
    note: form.note?.trim() || null,
    source: form.source || "landing_page",
    status: "new",
    score,
    priority,
    scoring_reasons: reasons,
  };

  const createdAt = new Date().toISOString();

  const { error } = await supabase.from("access_requests").insert(payload);

  if (error) throw error;

  try {
    const { error: notificationError } = await supabase.functions.invoke(
      "notify-access-request",
      {
        body: {
          full_name: payload.full_name,
          role: payload.role,
          organization: payload.organization,
          email: payload.email,
          scope: payload.scope,
          note: payload.note,
          score: payload.score,
          priority: payload.priority,
          created_at: createdAt,
        },
      },
    );

    if (notificationError) {
      console.warn("[Access Request] Notification failed:", notificationError);
    }
  } catch (notificationError) {
    console.warn("[Access Request] Notification failed:", notificationError);
  }

  return {
    created_at: createdAt,
    priority: payload.priority,
    score: payload.score,
  };
}

export async function listAccessRequests() {
  const { data, error } = await supabase
    .from("access_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

export async function updateAccessRequestStatus(id, status) {
  const patch = {
    status,
    reviewed_at: ["approved", "rejected", "archived"].includes(status)
      ? new Date().toISOString()
      : null,
  };

  const { data, error } = await supabase
    .from("access_requests")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  return data;
}

export async function rescoreAccessRequest(request) {
  const { score, priority, reasons } = scoreAccessRequest(request);

  const { data, error } = await supabase
    .from("access_requests")
    .update({
      score,
      priority,
      scoring_reasons: reasons,
    })
    .eq("id", request.id)
    .select("*")
    .single();

  if (error) throw error;

  return data;
}
