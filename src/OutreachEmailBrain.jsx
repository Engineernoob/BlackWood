import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Archive,
  CheckCircle,
  Edit3,
  Mail,
  RefreshCw,
  Send,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import {
  approveDraft,
  approveReplyDraft,
  archiveThread,
  createDraftForProspect,
  discardDraft,
  generateDailyProspects,
  listOutreachBrainData,
  sendOutreachDraft,
  sendReplyDraft,
  updateDraft,
} from "./lib/outreachBrain";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

const buttonBase =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45";

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.16em] text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-text-secondary">{value || "—"}</p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-text-muted">
        {label}
      </p>
      <p className="mt-1 font-serif text-2xl tabular-nums">{value}</p>
    </div>
  );
}

export default function OutreachEmailBrain() {
  const [prospects, setProspects] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [threads, setThreads] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState([]);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [editingBody, setEditingBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await listOutreachBrainData();
      setProspects(data.prospects);
      setDrafts(data.drafts);
      setThreads(data.threads);
      setReplyDrafts(data.replyDrafts);
      setSelectedDraft((current) => current || data.drafts[0] || null);
      setEditingBody((current) => current || data.drafts[0]?.body || "");
    } catch (loadError) {
      console.error("[OutreachEmailBrain] Load failed", loadError);
      setError("Unable to load Outreach & Email Brain data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const metrics = useMemo(
    () => ({
      reviewed: prospects.length,
      approved: drafts.filter((draft) => draft.status === "approved").length,
      sent: drafts.filter((draft) => draft.status === "sent").length,
      replies: threads.length,
      meetings: threads.filter((thread) => thread.intent === "meeting request").length,
      highPriority: prospects.filter((prospect) => Number(prospect.fit_score) >= 75).length,
    }),
    [drafts, prospects, threads],
  );

  async function refreshAfter(action) {
    setBusy(action);
    setError("");
    try {
      await action();
      await load();
    } catch (actionError) {
      console.error("[OutreachEmailBrain] Action failed", actionError);
      setError("Action failed. Review permissions, function deploys, or Supabase logs.");
    } finally {
      setBusy("");
    }
  }

  function selectDraft(draft) {
    setSelectedDraft(draft);
    setEditingBody(draft.body);
  }

  const activeReplies = replyDrafts.filter((draft) => draft.status !== "sent");

  return (
    <main className="min-h-screen overflow-hidden bg-background-primary text-text-primary">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_60%)]" />
        <div className="absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      </div>

      <section className="relative mx-auto max-w-[1800px] px-5 py-8">
        <motion.header
          {...fadeUp}
          className="mb-6 flex flex-col gap-5 border-b border-white/[0.07] pb-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-accent">
              <Shield className="h-3.5 w-3.5" />
              Private operator system
            </div>
            <h1 className="mt-5 text-balance font-serif text-5xl leading-tight">
              Outreach & Email Brain
            </h1>
            <p className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-text-secondary">
              Prospect discovery, approval-gated outreach, reply intelligence,
              and discreet response drafting. No campaigns. No mass send.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => refreshAfter(() => generateDailyProspects())}
              disabled={Boolean(busy)}
              className={`${buttonBase} border border-accent/20 bg-accent/10 text-accent hover:bg-accent/15`}
            >
              <Sparkles className="h-4 w-4" />
              Find 25 prospects
            </button>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className={`${buttonBase} border border-white/[0.08] bg-white/[0.025] text-text-secondary hover:border-white/15 hover:text-text-primary`}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </motion.header>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Metric label="Prospects reviewed" value={metrics.reviewed} />
          <Metric label="Drafts approved" value={metrics.approved} />
          <Metric label="Emails sent" value={metrics.sent} />
          <Metric label="Replies received" value={metrics.replies} />
          <Metric label="Meetings requested" value={metrics.meetings} />
          <Metric label="High-priority leads" value={metrics.highPriority} />
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-400/15 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.2fr_0.95fr]">
          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-[0.16em] text-text-muted">
                Prospect Feed
              </h2>
              <span className="text-xs text-text-muted">Daily 25 / top 5 ranked</span>
            </div>
            <div className="space-y-3">
              {prospects.map((prospect) => (
                <article
                  key={prospect.id}
                  className="rounded-xl border border-white/[0.06] bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-medium">{prospect.name}</h3>
                      <p className="mt-1 truncate text-sm text-text-secondary">
                        {prospect.role} · {prospect.company}
                      </p>
                    </div>
                    <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs tabular-nums text-accent">
                      {prospect.fit_score}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-text-muted">
                    {prospect.reason_matched}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(prospect.public_signals || []).slice(0, 3).map((signal) => (
                      <span
                        key={signal}
                        className="rounded-full border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-xs text-text-muted"
                      >
                        {signal}
                      </span>
                    ))}
                  </div>
                  <Field label="Recommended approach" value={prospect.recommended_approach} />
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => refreshAfter(() => createDraftForProspect(prospect))}
                    className={`${buttonBase} mt-3 w-full border border-white/[0.08] bg-white/[0.025] text-text-secondary hover:border-accent/20 hover:text-accent`}
                  >
                    <Mail className="h-4 w-4" />
                    Draft outreach
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-[0.16em] text-text-muted">
                Draft Queue
              </h2>
              <span className="text-xs text-text-muted">Operator approval required</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="space-y-2">
                {drafts.map((draft) => (
                  <button
                    key={draft.id}
                    type="button"
                    onClick={() => selectDraft(draft)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors active:scale-[0.96] ${
                      selectedDraft?.id === draft.id
                        ? "border-accent/25 bg-accent/10"
                        : "border-white/[0.06] bg-black/20 hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">
                        {draft.prospects?.name || "Prospect"}
                      </p>
                      <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-xs text-text-muted">
                        {draft.status}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-text-muted">{draft.type}</p>
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                {selectedDraft ? (
                  <>
                    <Field label="Subject" value={selectedDraft.subject} />
                    <textarea
                      value={editingBody}
                      onChange={(event) => setEditingBody(event.target.value)}
                      className="mt-4 min-h-72 w-full resize-none rounded-lg border border-white/[0.07] bg-white/[0.035] px-4 py-3 font-serif text-sm leading-6 text-text-secondary outline-none transition-colors focus:border-accent/35"
                    />
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => refreshAfter(() => updateDraft(selectedDraft.id, { body: editingBody }))}
                        className={`${buttonBase} border border-white/[0.08] bg-white/[0.025] text-text-secondary hover:text-text-primary`}
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => refreshAfter(() => approveDraft(selectedDraft.id))}
                        className={`${buttonBase} border border-emerald-400/20 bg-emerald-400/10 text-emerald-300`}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => refreshAfter(() => sendOutreachDraft(selectedDraft.id))}
                        className={`${buttonBase} border border-accent/20 bg-accent/10 text-accent`}
                      >
                        <Send className="h-4 w-4" />
                        Send via Resend
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => refreshAfter(() => discardDraft(selectedDraft.id))}
                        className={`${buttonBase} ml-auto text-text-muted hover:bg-white/[0.035]`}
                      >
                        <X className="h-4 w-4" />
                        Discard
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="py-24 text-center text-sm text-text-muted">
                    No draft selected.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-[0.16em] text-text-muted">
                Email Brain
              </h2>
              <span className="text-xs text-text-muted">Replies and suggested actions</span>
            </div>

            <div className="space-y-3">
              {threads.map((thread) => {
                const reply = activeReplies.find((draft) => draft.thread_id === thread.id);
                return (
                  <article
                    key={thread.id}
                    className="rounded-xl border border-white/[0.06] bg-black/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-medium">
                          {thread.prospects?.name || "Inbound reply"}
                        </h3>
                        <p className="mt-1 text-xs text-text-muted">
                          {thread.sentiment || "unclassified"} · {thread.intent || "pending"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          thread.requires_approval
                            ? "bg-accent/10 text-accent"
                            : "bg-emerald-400/10 text-emerald-300"
                        }`}
                      >
                        {thread.requires_approval ? "approval" : "safe"}
                      </span>
                    </div>

                    {reply && (
                      <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.025] p-3">
                        <p className="whitespace-pre-line font-serif text-sm leading-6 text-text-secondary">
                          {reply.body}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {reply && !reply.requires_approval && (
                        <button
                          type="button"
                          disabled={Boolean(busy)}
                          onClick={() => refreshAfter(() => sendReplyDraft(reply.id))}
                          className={`${buttonBase} border border-emerald-400/20 bg-emerald-400/10 text-emerald-300`}
                        >
                          Auto-send safe reply
                        </button>
                      )}
                      {reply && (
                        <button
                          type="button"
                          disabled={Boolean(busy)}
                          onClick={() => refreshAfter(() => approveReplyDraft(reply.id))}
                          className={`${buttonBase} border border-accent/20 bg-accent/10 text-accent`}
                        >
                          Approve reply
                        </button>
                      )}
                      <button
                        type="button"
                        className={`${buttonBase} border border-white/[0.08] bg-white/[0.025] text-text-secondary`}
                      >
                        Escalate
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => refreshAfter(() => archiveThread(thread.id))}
                        className={`${buttonBase} text-text-muted hover:bg-white/[0.035]`}
                      >
                        <Archive className="h-4 w-4" />
                        Archive
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
