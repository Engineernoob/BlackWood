import {
  outreachDraftAgent,
  prospectHunterAgent,
  prospectRankingAgent,
  replyClassifierAgent,
  replyWriterAgent,
  safetyGateAgent,
} from "../agents";
import { supabase } from "./supabase";

const selectProspects = "id, created_at, name, role, company, email, source_url, public_signals, fit_score, reason_matched, recommended_approach, status";

export async function listOutreachBrainData() {
  const [prospectsResult, draftsResult, threadsResult, repliesResult] =
    await Promise.all([
      supabase.from("prospects").select(selectProspects).order("fit_score", { ascending: false }).limit(25),
      supabase.from("outreach_drafts").select("*, prospects(*)").order("created_at", { ascending: false }).limit(25),
      supabase.from("email_threads").select("*, prospects(*)").order("last_message_at", { ascending: false, nullsFirst: false }).limit(25),
      supabase.from("reply_drafts").select("*, email_threads(*, prospects(*))").order("created_at", { ascending: false }).limit(25),
    ]);

  if (prospectsResult.error) throw prospectsResult.error;
  if (draftsResult.error) throw draftsResult.error;
  if (threadsResult.error) throw threadsResult.error;
  if (repliesResult.error) throw repliesResult.error;

  return {
    prospects: prospectsResult.data || [],
    drafts: draftsResult.data || [],
    threads: threadsResult.data || [],
    replyDrafts: repliesResult.data || [],
  };
}

export async function generateDailyProspects(query = "daily Blackwood prospects") {
  const prospects = prospectRankingAgent(prospectHunterAgent(query), 25);

  const rows = prospects.map((prospect) => ({
    name: prospect.name,
    role: prospect.role,
    company: prospect.company,
    email: prospect.email,
    source_url: prospect.source_url,
    public_signals: prospect.public_signals,
    fit_score: prospect.fit_score,
    reason_matched: prospect.reason_matched,
    recommended_approach: prospect.recommended_approach,
    status: prospect.rank <= 5 ? "ranked" : "new",
  }));

  const { data, error } = await supabase
    .from("prospects")
    .insert(rows)
    .select(selectProspects);

  if (error) throw error;
  return data || [];
}

export async function createDraftForProspect(prospect, type = "direct_outreach") {
  const draft = outreachDraftAgent(prospect, type);
  const { data, error } = await supabase
    .from("outreach_drafts")
    .insert(draft)
    .select("*, prospects(*)")
    .single();

  if (error) throw error;

  await supabase.from("prospects").update({ status: "drafted" }).eq("id", prospect.id);
  return data;
}

export async function updateDraft(id, patch) {
  const { data, error } = await supabase
    .from("outreach_drafts")
    .update(patch)
    .eq("id", id)
    .select("*, prospects(*)")
    .single();

  if (error) throw error;
  return data;
}

export async function approveDraft(id) {
  return updateDraft(id, { status: "approved" });
}

export async function discardDraft(id) {
  return updateDraft(id, { status: "discarded" });
}

export async function sendOutreachDraft(draftId) {
  const { data, error } = await supabase.functions.invoke("send-outreach-email", {
    body: { draft_id: draftId },
  });

  if (error) throw error;
  return data;
}

export async function approveReplyDraft(id) {
  const { data, error } = await supabase
    .from("reply_drafts")
    .update({ status: "approved" })
    .eq("id", id)
    .select("*, email_threads(*, prospects(*))")
    .single();

  if (error) throw error;
  return data;
}

export async function archiveThread(id) {
  const { data, error } = await supabase
    .from("email_threads")
    .update({ status: "archived" })
    .eq("id", id)
    .select("*, prospects(*)")
    .single();

  if (error) throw error;
  return data;
}

export async function sendReplyDraft(replyDraftId) {
  const { data, error } = await supabase.functions.invoke("send-reply-email", {
    body: { reply_draft_id: replyDraftId },
  });

  if (error) throw error;
  return data;
}

export function classifyLocalReply(message) {
  const classification = replyClassifierAgent(message);
  const reply = replyWriterAgent({}, classification);
  const safety = safetyGateAgent(reply, classification);
  return { classification, reply, safety };
}
