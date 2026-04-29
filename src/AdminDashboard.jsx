import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Archive,
  CheckCircle,
  ChevronDown,
  Clock,
  Eye,
  FileText,
  Mail,
  RefreshCw,
  Shield,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react";
import {
  listAccessRequests,
  rescoreAccessRequest,
  updateAccessRequestStatus,
} from "./lib/accessRequests";

const filters = [
  { id: "all", label: "All" },
  { id: "high", label: "High priority" },
  { id: "medium", label: "Medium priority" },
  { id: "low", label: "Low priority" },
  { id: "new", label: "New" },
  { id: "approved", label: "Approved" },
];

const statusActions = [
  { id: "reviewing", label: "Reviewing", icon: Eye },
  { id: "approved", label: "Approved", icon: CheckCircle },
  { id: "rejected", label: "Rejected", icon: XCircle },
  { id: "archived", label: "Archived", icon: Archive },
];

const statusStyles = {
  new: "border-white/10 bg-white/[0.04] text-text-secondary",
  reviewing: "border-accent/20 bg-accent/10 text-accent",
  approved: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  rejected: "border-red-400/20 bg-red-400/10 text-red-300",
  archived: "border-white/10 bg-white/[0.025] text-text-muted",
};

const priorityStyles = {
  high: "text-accent",
  medium: "text-text-primary",
  low: "text-text-secondary",
  unreviewed: "text-text-muted",
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

function formatDate(value) {
  if (!value) return "No timestamp";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatText(value, fallback = "Not provided") {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }

  return value;
}

function normalizeReasons(reasons) {
  if (!reasons) return [];
  if (Array.isArray(reasons)) return reasons.filter(Boolean);

  if (typeof reasons === "string") {
    try {
      const parsed = JSON.parse(reasons);
      return normalizeReasons(parsed);
    } catch {
      return [reasons];
    }
  }

  if (typeof reasons === "object") {
    return Object.entries(reasons).map(([key, value]) => `${key}: ${value}`);
  }

  return [String(reasons)];
}

function StatPill({ label, value }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">
        {label}
      </p>
      <p className="mt-1 font-serif text-2xl tabular-nums text-text-primary">
        {value}
      </p>
    </div>
  );
}

function Field({ label, value, className = "" }) {
  return (
    <div className={className}>
      <p className="text-[10px] uppercase tracking-[0.16em] text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-text-secondary">
        {formatText(value)}
      </p>
    </div>
  );
}

function RequestCard({
  request,
  expanded,
  isBusy,
  onToggle,
  onStatusChange,
  onRescore,
}) {
  const reasons = normalizeReasons(request.scoring_reasons);
  const priorityClass =
    priorityStyles[request.priority] || priorityStyles.unreviewed;
  const statusClass = statusStyles[request.status] || statusStyles.new;

  return (
    <motion.article
      layout
      variants={fadeUp}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025] shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl"
    >
      <div className="p-5 md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent/20 bg-accent/10">
                <UserRound className="h-4 w-4 text-accent" />
              </div>
              <div className="min-w-0">
                <h2 className="font-serif text-2xl leading-tight text-text-primary">
                  {formatText(request.full_name, "Unnamed request")}
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  {formatText(request.role)} at{" "}
                  {formatText(request.organization)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Email" value={request.email} />
              <Field label="Scope" value={request.scope} />
              <Field label="Created" value={formatDate(request.created_at)} />
              <Field label="Status" value={request.status} />
            </div>

            <div className="mt-5 rounded-lg border border-white/[0.05] bg-black/20 p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-text-muted">
                <FileText className="h-3.5 w-3.5" />
                Note
              </div>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {formatText(request.note, "No note supplied.")}
              </p>
            </div>
          </div>

          <aside className="w-full shrink-0 xl:w-64">
            <div className="grid grid-cols-3 gap-2 xl:grid-cols-1">
              <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-text-muted">
                  Score
                </p>
                <p className="mt-1 font-serif text-3xl tabular-nums text-text-primary">
                  {request.score ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-text-muted">
                  Priority
                </p>
                <p
                  className={`mt-2 text-sm font-medium capitalize ${priorityClass}`}
                >
                  {formatText(request.priority, "unreviewed")}
                </p>
              </div>
              <div className={`rounded-lg border p-3 ${statusClass}`}>
                <p className="text-[10px] uppercase tracking-[0.16em] opacity-70">
                  Status
                </p>
                <p className="mt-2 text-sm font-medium capitalize">
                  {formatText(request.status, "new")}
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.06] pt-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {statusActions.map((action) => {
              const Icon = action.icon;
              const isActive = request.status === action.id;

              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => onStatusChange(request.id, action.id)}
                  disabled={isBusy || isActive}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45 ${
                    isActive
                      ? "border border-accent/20 bg-accent/10 text-accent"
                      : "border border-white/[0.08] bg-white/[0.025] text-text-secondary hover:border-white/15 hover:text-text-primary"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {action.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onRescore(request)}
              disabled={isBusy}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-accent/20 bg-accent/10 px-3 text-xs font-medium text-accent transition-colors hover:bg-accent/15 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Rescore
            </button>
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 text-xs font-medium text-text-secondary transition-colors hover:border-white/15 hover:text-text-primary active:scale-[0.96]"
            >
              Why this score?
              <motion.span
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </motion.span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-white/[0.06]"
          >
            <div className="bg-black/20 px-5 py-5 md:px-6">
              {reasons.length > 0 ? (
                <ul className="space-y-2">
                  {reasons.map((reason, index) => (
                    <li
                      key={`${request.id}-reason-${index}`}
                      className="flex gap-3 text-sm leading-relaxed text-text-secondary"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" />
                      <span>{String(reason)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-muted">
                  No scoring reasons have been stored for this request.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function loadRequests() {
    setLoading(true);
    setError("");

    try {
      const rows = await listAccessRequests();
      setRequests(rows || []);
    } catch (loadError) {
      console.error("[AdminDashboard] Unable to load access requests", loadError);
      setError("Unable to load access requests from Supabase.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    if (activeFilter === "all") return requests;

    if (["high", "medium", "low"].includes(activeFilter)) {
      return requests.filter((request) => request.priority === activeFilter);
    }

    return requests.filter((request) => request.status === activeFilter);
  }, [activeFilter, requests]);

  const counts = useMemo(
    () => ({
      total: requests.length,
      high: requests.filter((request) => request.priority === "high").length,
      new: requests.filter((request) => request.status === "new").length,
      approved: requests.filter((request) => request.status === "approved")
        .length,
    }),
    [requests],
  );

  async function replaceRequest(updatePromise) {
    const updated = await updatePromise;
    setRequests((current) =>
      current.map((request) => (request.id === updated.id ? updated : request)),
    );
  }

  async function handleStatusChange(id, status) {
    setBusyId(id);
    setError("");

    try {
      await replaceRequest(updateAccessRequestStatus(id, status));
    } catch (statusError) {
      console.error("[AdminDashboard] Unable to update status", statusError);
      setError("Unable to update the request status.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRescore(request) {
    setBusyId(request.id);
    setError("");

    try {
      await replaceRequest(rescoreAccessRequest(request));
      setExpandedId(request.id);
    } catch (rescoreError) {
      console.error("[AdminDashboard] Unable to rescore request", rescoreError);
      setError("Unable to rescore this request.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background-primary text-text-primary">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.09),transparent_58%)]" />
        <div className="absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      </div>

      <section className="relative mx-auto max-w-7xl px-5 py-8 md:px-8 lg:py-10">
        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-6 border-b border-white/[0.07] pb-8 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-accent">
              <Shield className="h-3.5 w-3.5" />
              Private intake console
            </div>
            <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight text-text-primary md:text-6xl">
              Blackwood access review
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-text-secondary md:text-base">
              A quiet review surface for requests entering the private office.
              Prioritize, rescore, and settle disposition without adding sales
              dashboard noise.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRequests}
            disabled={loading}
            className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 text-sm text-text-secondary transition-colors hover:border-white/15 hover:text-text-primary active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </motion.header>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-3 py-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatPill label="Total requests" value={counts.total} />
          <StatPill label="High priority" value={counts.high} />
          <StatPill label="New" value={counts.new} />
          <StatPill label="Approved" value={counts.approved} />
        </motion.div>

        <div className="sticky top-0 z-20 -mx-5 border-y border-white/[0.06] bg-background-primary/85 px-5 py-3 backdrop-blur-xl md:-mx-8 md:px-8">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const active = activeFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`min-h-10 rounded-lg px-3 text-xs font-medium transition-colors active:scale-[0.96] ${
                    active
                      ? "bg-text-primary text-background-primary"
                      : "border border-white/[0.08] bg-white/[0.025] text-text-secondary hover:border-white/15 hover:text-text-primary"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mt-5 flex items-center gap-3 rounded-lg border border-red-400/15 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <section className="py-6">
          {loading ? (
            <div className="flex min-h-72 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025]">
              <div className="text-center">
                <RefreshCw className="mx-auto h-7 w-7 animate-spin text-accent/70" />
                <p className="mt-4 text-sm text-text-muted">
                  Loading access requests...
                </p>
              </div>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex min-h-72 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] px-6 text-center">
              <div>
                <Mail className="mx-auto h-10 w-10 text-text-muted/40" />
                <h2 className="mt-5 font-serif text-3xl text-text-primary">
                  No access requests
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-text-muted">
                  New private-access submissions will appear here after they are
                  written to Supabase.
                </p>
              </div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex min-h-56 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] px-6 text-center">
              <div>
                <Clock className="mx-auto h-9 w-9 text-text-muted/40" />
                <h2 className="mt-4 font-serif text-2xl text-text-primary">
                  No matches
                </h2>
                <p className="mt-2 text-sm text-text-muted">
                  This filter has no requests at the moment.
                </p>
              </div>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.06 } },
              }}
              className="space-y-4"
            >
              {filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  expanded={expandedId === request.id}
                  isBusy={busyId === request.id}
                  onToggle={() =>
                    setExpandedId((current) =>
                      current === request.id ? null : request.id,
                    )
                  }
                  onStatusChange={handleStatusChange}
                  onRescore={handleRescore}
                />
              ))}
            </motion.div>
          )}
        </section>
      </section>
    </main>
  );
}
