import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  runAcquisitionSwarm,
  generatePrivateBrief,
} from "./lib/runAcquisitionSwarm";
import {
  Search,
  CheckCircle,
  Edit3,
  X,
  ChevronRight,
  Shield,
  Users,
  Loader2,
  Save,
  Network,
  ArrowRight,
  Handshake,
  Mail,
  FileText,
  Clock,
  Target,
  Zap,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.98 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

const primaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-text-primary px-4 text-sm font-medium text-background-primary transition-colors hover:bg-text-secondary active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45";

const secondaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 text-sm text-text-secondary transition-colors hover:border-white/15 hover:text-text-primary active:scale-[0.96]";

const ghostButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm text-text-muted transition-colors hover:bg-white/[0.035] hover:text-text-secondary active:scale-[0.96]";

const fieldClass =
  "min-h-12 w-full rounded-lg border border-white/[0.07] bg-white/[0.035] px-4 text-sm text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition-colors placeholder:text-text-muted focus:border-accent/35 focus:bg-white/[0.055]";

function ConnectionStrength({ strength }) {
  const colors = {
    strong: "bg-accent shadow-[0_0_14px_rgba(212,175,55,0.35)]",
    medium: "bg-text-secondary",
    weak: "bg-text-muted",
  };
  const labels = {
    strong: "Strong",
    medium: "Medium",
    weak: "Weak",
  };
  return (
    <div className="inline-flex min-h-7 items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.025] px-2.5">
      <div className={`h-1.5 w-1.5 rounded-full ${colors[strength]}`} />
      <span className="text-xs text-text-muted">
        {labels[strength] || "Unknown"}
      </span>
    </div>
  );
}

function ConnectorScore({ attempts, successes }) {
  const rate = attempts > 0 ? Math.round((successes / attempts) * 100) : 0;
  const isHigh = rate >= 60;
  const isMedium = rate >= 30 && rate < 60;

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            isHigh
              ? "bg-accent"
              : isMedium
                ? "bg-text-secondary"
                : "bg-text-muted"
          }`}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span
        className={`text-xs font-medium tabular-nums ${
          isHigh
            ? "text-accent"
            : isMedium
              ? "text-text-secondary"
              : "text-text-muted"
        }`}
      >
        {rate}%
      </span>
    </div>
  );
}

export default function AcquisitionDesk() {
  const [query, setQuery] = useState("");
  const [prospects, setProspects] = useState([]);
  const [approvedProspects, setApprovedProspects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editMessage, setEditMessage] = useState("");
  const [showConnections, setShowConnections] = useState({});
  const [introDrafting, setIntroDrafting] = useState({});
  const [privateBriefs, setPrivateBriefs] = useState({});
  const [interactionHistory, setInteractionHistory] = useState({});
  const [connectorPerformance, setConnectorPerformance] = useState({});

  const runIntelligence = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setProspects([]);
    setApprovedProspects([]);
    setShowConnections({});
    setIntroDrafting({});
    setPrivateBriefs({});

    try {
      const response = await runAcquisitionSwarm(query);
      setProspects(response.prospects);
    } catch (error) {
      console.error("Pipeline error:", error);
    } finally {
      setLoading(false);
    }
  };

  const recordInteraction = (
    prospectId,
    type,
    outcome = "draft",
    notes = "",
    connectorName = null,
  ) => {
    const interaction = {
      id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      prospectId,
      type,
      outcome,
      notes,
      timestamp: new Date().toISOString(),
      connectorName,
    };
    setInteractionHistory((prev) => ({
      ...prev,
      [prospectId]: [...(prev[prospectId] || []), interaction],
    }));

    if (connectorName) {
      updateConnectorPerformance(connectorName, type, outcome);
    }
  };

  const updateConnectorPerformance = (connectorName, type, outcome) => {
    setConnectorPerformance((prev) => {
      const current = prev[connectorName] || {
        attempts: 0,
        successes: 0,
        intros: 0,
        meetings: 0,
      };
      const newOutcome =
        outcome === "meeting"
          ? "meeting"
          : outcome === "replied"
            ? "replied"
            : "no_response";

      return {
        ...prev,
        [connectorName]: {
          ...current,
          attempts: current.attempts + 1,
          successes:
            newOutcome === "meeting" || newOutcome === "replied"
              ? current.successes + 1
              : current.successes,
          intros: type === "intro" ? current.intros + 1 : current.intros,
          meetings:
            newOutcome === "meeting" ? current.meetings + 1 : current.meetings,
          lastAttempt: new Date().toISOString(),
        },
      };
    });
  };

  const updateInteractionOutcome = (
    prospectId,
    interactionId,
    outcome,
    notes = "",
  ) => {
    const history = interactionHistory[prospectId] || [];
    const interaction = history.find((i) => i.id === interactionId);

    setInteractionHistory((prev) => ({
      ...prev,
      [prospectId]: prev[prospectId].map((i) =>
        i.id === interactionId ? { ...i, outcome, notes: notes || i.notes } : i,
      ),
    }));

    if (interaction?.connectorName) {
      updateConnectorPerformance(
        interaction.connectorName,
        interaction.type,
        outcome,
      );
    }
  };

  const getInteractions = (prospectId) => interactionHistory[prospectId] || [];

  const getConnectorStats = (connectorName) =>
    connectorPerformance[connectorName] || {
      attempts: 0,
      successes: 0,
      intros: 0,
      meetings: 0,
    };

  const rankConnections = (connections) => {
    return [...connections].sort((a, b) => {
      const aStats = getConnectorStats(a.name);
      const bStats = getConnectorStats(b.name);

      const aRate =
        aStats.attempts > 0
          ? aStats.successes / aStats.attempts
          : a.relationshipStrength === "strong"
            ? 0.5
            : 0.25;
      const bRate =
        bStats.attempts > 0
          ? bStats.successes / bStats.attempts
          : b.relationshipStrength === "strong"
            ? 0.5
            : 0.25;

      if (
        a.relationshipStrength === "strong" &&
        b.relationshipStrength !== "strong"
      )
        return -1;
      if (
        b.relationshipStrength === "strong" &&
        a.relationshipStrength !== "strong"
      )
        return 1;

      return bRate - aRate;
    });
  };

  const handleGenerateBrief = (prospect) => {
    const brief = generatePrivateBrief(prospect);
    setPrivateBriefs((prev) => ({
      ...prev,
      [prospect.id]: brief,
    }));
  };

  const handleCloseBrief = (prospectId) => {
    setPrivateBriefs((prev) => {
      const updated = { ...prev };
      delete updated[prospectId];
      return updated;
    });
  };

  const handleApprove = (
    prospect,
    type = "direct",
    recipient = null,
    connectorName = null,
  ) => {
    const item = {
      ...prospect,
      type,
      recipient:
        recipient ||
        (type === "intro" ? prospect.bestPath?.name : prospect.name),
      status: "Draft",
    };
    setApprovedProspects((prev) => [...prev, item]);
    setProspects((prev) => prev.filter((p) => p.id !== prospect.id));
    recordInteraction(prospect.id, type, "draft", "", connectorName || null);
    setExpandedCard(null);
  };

  const handleDiscard = (prospectId) => {
    setProspects((prev) => prev.filter((p) => p.id !== prospectId));
    setExpandedCard(null);
  };

  const handleEdit = (prospect) => {
    setEditingId(prospect.id);
    setEditMessage(prospect.directMessage || prospect.message || "");
  };

  const handleSaveEdit = (prospectId) => {
    setProspects((prev) =>
      prev.map((p) =>
        p.id === prospectId
          ? { ...p, directMessage: editMessage, message: editMessage }
          : p,
      ),
    );
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditMessage("");
  };

  const handleRequestIntro = (prospect, connection) => {
    const introMessage = `Hey ${connection.name.split(" ")[0]},\n\nSaw you're connected with ${prospect.name}. I've been building something quietly for founders operating at that level — focused on coordinating advisors, travel, and decision workflows post-scale.\n\nFeels relevant given ${connection.context.toLowerCase()}.\n\nIf you're comfortable, would appreciate an intro — no pressure at all.\n\nBest`;
    setIntroDrafting((prev) => ({
      ...prev,
      [prospect.id]: { message: introMessage, connection: connection.name },
    }));
  };

  const handleApproveIntro = (prospect, connection) => {
    const draft = introDrafting[prospect.id]?.message || "";
    handleApprove(prospect, "intro", connection.name, connection.name);
  };

  const handlePrepareDraft = (item) => {
    console.log("Prepare draft for:", item.name);
  };

  const toggleConnections = (prospectId) => {
    setShowConnections((prev) => ({
      ...prev,
      [prospectId]: !prev[prospectId],
    }));
  };

  return (
    <div className="min-h-screen overflow-hidden bg-background-primary text-text-primary">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_58%)]" />
        <div className="absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
        <div className="absolute bottom-0 right-1/4 h-[520px] w-[520px] rounded-full bg-white/[0.012] blur-[120px]" />
      </div>

      <div className="relative z-10 flex h-screen">
        {/* LEFT PANEL */}
        <aside className="flex w-80 flex-shrink-0 flex-col border-r border-white/[0.07] bg-black/10 p-6 shadow-[12px_0_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-accent">
              <Shield className="h-3.5 w-3.5" />
              Private desk
            </div>
            <h1 className="mt-5 text-balance font-serif text-4xl leading-tight tracking-tight">
              Acquisition Desk
            </h1>
            <p className="mt-2 text-pretty text-sm leading-6 text-text-muted">
              Private intelligence and outreach
            </p>
          </motion.div>

          <div className="mt-10 flex-1">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find recently exited founders in fintech…"
                className={`${fieldClass} pr-11`}
                onKeyDown={(e) => e.key === "Enter" && runIntelligence()}
              />
              <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            </div>

            <button
              onClick={runIntelligence}
              disabled={loading || !query.trim()}
              className={`${primaryButton} mt-4 w-full`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Run Intelligence
                </>
              )}
            </button>

            <p className="mt-4 text-xs leading-relaxed text-text-muted/60">
              Public-data research only. Approval required before outreach.
            </p>
          </div>

          {/* Connector Performance Stats */}
          <motion.div
            {...fadeUp}
            className="mt-auto border-t border-white/[0.07] pt-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" />
              <h3 className="text-xs uppercase tracking-[0.14em] text-text-muted">
                Flywheel Stats
              </h3>
            </div>

            {Object.keys(connectorPerformance).length > 0 ? (
              <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {Object.entries(connectorPerformance)
                  .sort((a, b) => {
                    const aRate =
                      a[1].attempts > 0 ? a[1].successes / a[1].attempts : 0;
                    const bRate =
                      b[1].attempts > 0 ? b[1].successes / b[1].attempts : 0;
                    return bRate - aRate;
                  })
                  .slice(0, 5)
                  .map(([name, stats]) => (
                    <div
                      key={name}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 shadow-[0_12px_38px_rgba(0,0,0,0.18)]"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium">
                          {name}
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-accent">
                          {stats.attempts} attempts
                        </span>
                      </div>
                      <ConnectorScore
                        attempts={stats.attempts}
                        successes={stats.successes}
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted/50">
                Connector performance tracked here
              </p>
            )}
          </motion.div>
        </aside>

        {/* MAIN PANEL */}
        <main className="flex-1 overflow-y-auto p-8">
          <AnimatePresence initial={false} mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-3xl"
              >
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-xs uppercase tracking-[0.15em] text-text-muted">
                    Researching intelligence...
                  </h2>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)]"
                    >
                      <div className="mb-3 h-5 w-32 rounded bg-white/[0.06]" />
                      <div className="h-4 w-48 rounded bg-white/[0.04]" />
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : prospects.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full items-center justify-center"
              >
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
                  <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035]">
                    <Search className="h-5 w-5 text-accent" />
                  </div>
                  <p className="text-pretty text-sm text-text-muted">
                    Run an intelligence query to begin research
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial="initial"
                animate="animate"
                variants={stagger}
                className="max-w-3xl"
              >
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-xs uppercase tracking-[0.15em] text-text-muted">
                    {prospects.length} Prospects Identified
                  </h2>
                </div>

                <div className="space-y-4">
                  {prospects.map((prospect) => {
                    const rankedConnections = prospect.connections
                      ? rankConnections(prospect.connections)
                      : [];
                    const bestConnector = rankedConnections[0];
                    const bestStats = bestConnector
                      ? getConnectorStats(bestConnector.name)
                      : null;

                    return (
                      <motion.div
                        key={prospect.id}
                        variants={cardVariants}
                        className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-[0_22px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl"
                      >
                        <div
                          className="cursor-pointer p-5 transition-colors hover:bg-white/[0.025]"
                          onClick={() =>
                            setExpandedCard(
                              expandedCard === prospect.id ? null : prospect.id,
                            )
                          }
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="truncate text-lg font-medium">
                                  {prospect.name}
                                </h3>
                                {prospect.score >= 80 && (
                                  <span className="rounded-full border border-accent/15 bg-accent/10 px-2 py-1 text-[10px] tracking-wider text-accent">
                                    HIGH FIT
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 truncate text-sm text-text-secondary">
                                {prospect.role} · {prospect.company}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-3">
                              <span
                                className="rounded-full px-2.5 py-1 text-xs font-medium tabular-nums"
                                style={{
                                  backgroundColor:
                                    prospect.score >= 85
                                      ? "rgba(212, 175, 55, 0.15)"
                                      : prospect.score >= 70
                                        ? "rgba(255, 255, 255, 0.08)"
                                        : "rgba(255, 255, 255, 0.04)",
                                  color:
                                    prospect.score >= 85
                                      ? "#D4AF37"
                                      : prospect.score >= 70
                                        ? "#A1A1A1"
                                        : "#6B6B6B",
                                }}
                              >
                                {prospect.score}
                              </span>
                              <motion.span
                                animate={{
                                  rotate:
                                    expandedCard === prospect.id ? 90 : 0,
                                }}
                                transition={{
                                  type: "spring",
                                  duration: 0.3,
                                  bounce: 0,
                                }}
                                className="text-text-muted"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </motion.span>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {prospect.signals?.map((signal) => (
                              <span
                                key={signal}
                                className="rounded-full border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 text-xs text-text-muted"
                              >
                                {signal}
                              </span>
                            ))}
                            {prospect.source &&
                              prospect.source !== "mock_data" && (
                                <span className="rounded-full border border-accent/15 bg-accent/10 px-2.5 py-1 text-xs text-accent">
                                  Live Data
                                </span>
                              )}
                          </div>
                        </div>

                        <AnimatePresence initial={false}>
                          {expandedCard === prospect.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0, y: -6 }}
                              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden border-t border-white/[0.06]"
                            >
                              <div className="space-y-6 bg-black/10 p-5">
                                {/* Access Intelligence - Best Path */}
                                {bestConnector && (
                                  <div className="rounded-xl border border-accent/15 bg-accent/[0.07] p-4 shadow-[0_16px_50px_rgba(0,0,0,0.18)]">
                                    <div className="mb-3 flex items-center gap-2">
                                      <Zap className="h-4 w-4 text-accent" />
                                      <p className="text-xs uppercase tracking-[0.14em] text-accent">
                                        Access Intelligence
                                      </p>
                                    </div>

                                    <div className="flex items-start justify-between gap-4">
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium">
                                          {bestConnector.name}
                                        </p>
                                        <p className="mt-1 text-xs text-text-muted">
                                          {bestConnector.role}
                                        </p>
                                        <p className="mt-1 text-pretty text-xs leading-5 text-text-muted/60">
                                          {bestConnector.context}
                                        </p>
                                      </div>

                                      {bestStats && bestStats.attempts > 0 && (
                                        <div className="shrink-0 text-right">
                                          <p className="text-xs text-text-muted">
                                            Success Rate
                                          </p>
                                          <ConnectorScore
                                            attempts={bestStats.attempts}
                                            successes={bestStats.successes}
                                          />
                                          <p className="mt-1 text-xs tabular-nums text-text-muted">
                                            {bestStats.meetings} meetings
                                          </p>
                                        </div>
                                      )}

                                      {(!bestStats ||
                                        bestStats.attempts === 0) && (
                                        <div className="shrink-0 text-right">
                                          <p className="text-xs text-accent">
                                            Recommended
                                          </p>
                                          <p className="mt-1 text-xs capitalize text-text-muted">
                                            {bestConnector.relationshipStrength}{" "}
                                            connection
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Connection Map */}
                                {rankedConnections.length > 0 && (
                                  <div>
                                    <button
                                      onClick={() =>
                                        toggleConnections(prospect.id)
                                      }
                                      className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-text-muted transition-colors hover:bg-white/[0.035] hover:text-text-secondary active:scale-[0.96]"
                                    >
                                      <Network className="h-4 w-4" />
                                      <span className="text-xs uppercase tracking-[0.14em]">
                                        Connection Map (
                                        {rankedConnections.length})
                                      </span>
                                      <motion.span
                                        animate={{
                                          rotate: showConnections[prospect.id]
                                            ? 90
                                            : 0,
                                        }}
                                        transition={{
                                          type: "spring",
                                          duration: 0.3,
                                          bounce: 0,
                                        }}
                                      >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                      </motion.span>
                                    </button>

                                    <AnimatePresence initial={false}>
                                      {showConnections[prospect.id] && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{
                                            height: "auto",
                                            opacity: 1,
                                          }}
                                          exit={{
                                            height: 0,
                                            opacity: 0,
                                            y: -6,
                                          }}
                                          transition={{
                                            duration: 0.22,
                                            ease: [0.22, 1, 0.36, 1],
                                          }}
                                          className="mt-3 space-y-2 overflow-hidden"
                                        >
                                          {rankedConnections.map(
                                            (conn, idx) => {
                                              const connStats =
                                                getConnectorStats(conn.name);
                                              return (
                                                <div
                                                  key={idx}
                                                  className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"
                                                >
                                                  <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium">
                                                      {conn.name}
                                                    </p>
                                                    <p className="text-xs text-text-muted">
                                                      {conn.role}
                                                    </p>
                                                    <p className="mt-1 text-pretty text-xs leading-5 text-text-muted/60">
                                                      {conn.context}
                                                    </p>
                                                  </div>
                                                  <div className="flex shrink-0 flex-col items-end gap-2">
                                                    <ConnectionStrength
                                                      strength={
                                                        conn.relationshipStrength
                                                      }
                                                    />
                                                    {connStats.attempts > 0 && (
                                                      <ConnectorScore
                                                        attempts={
                                                          connStats.attempts
                                                        }
                                                        successes={
                                                          connStats.successes
                                                        }
                                                      />
                                                    )}
                                                    <button
                                                      onClick={() =>
                                                        handleRequestIntro(
                                                          prospect,
                                                          conn,
                                                        )
                                                      }
                                                      className="inline-flex min-h-9 items-center rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 text-xs text-text-secondary transition-colors hover:border-accent/30 hover:text-accent active:scale-[0.96]"
                                                    >
                                                      Request Intro
                                                    </button>
                                                  </div>
                                                </div>
                                              );
                                            },
                                          )}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                )}

                                {/* Intro Draft */}
                                {introDrafting[prospect.id] && (
                                  <div>
                                    <p className="mb-3 text-xs uppercase tracking-[0.14em] text-text-muted">
                                      Intro Request Draft
                                    </p>
                                    <div className="mb-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                                      <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-text-secondary">
                                        {introDrafting[prospect.id].message}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() =>
                                          handleApproveIntro(
                                            prospect,
                                            prospect.connections.find(
                                              (c) =>
                                                c.name ===
                                                introDrafting[prospect.id]
                                                  .connection,
                                            ) || rankedConnections[0],
                                          )
                                        }
                                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-accent/20 bg-accent/15 px-4 text-sm text-accent transition-colors hover:bg-accent/20 active:scale-[0.96]"
                                      >
                                        <Handshake className="h-4 w-4" />
                                        Approve Request
                                      </button>
                                      <button
                                        onClick={() =>
                                          setIntroDrafting((prev) => ({
                                            ...prev,
                                            [prospect.id]: null,
                                          }))
                                        }
                                        className={ghostButton}
                                      >
                                        Discard
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Pain & Outreach */}
                                <div>
                                  <p className="mb-2 text-xs uppercase tracking-[0.14em] text-text-muted">
                                    Likely Pain
                                  </p>
                                  <p className="text-pretty text-sm leading-6 text-text-secondary">
                                    {prospect.pain}
                                  </p>
                                </div>

                                <div>
                                  <p className="mb-3 text-xs uppercase tracking-[0.14em] text-text-muted">
                                    Direct Outreach
                                  </p>
                                  {editingId === prospect.id ? (
                                    <div className="space-y-3">
                                      <textarea
                                        value={editMessage}
                                        onChange={(e) =>
                                          setEditMessage(e.target.value)
                                        }
                                        rows={8}
                                        className={`${fieldClass} min-h-52 resize-none py-3 font-serif leading-6`}
                                      />
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() =>
                                            handleSaveEdit(prospect.id)
                                          }
                                          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-accent/20 bg-accent/15 px-4 text-sm text-accent transition-colors hover:bg-accent/20 active:scale-[0.96]"
                                        >
                                          <Save className="h-4 w-4" />
                                          Save
                                        </button>
                                        <button
                                          onClick={handleCancelEdit}
                                          className={ghostButton}
                                        >
                                          <X className="h-4 w-4" />
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                                      <p className="whitespace-pre-line font-serif text-sm leading-6 text-text-secondary">
                                        {prospect.directMessage ||
                                          prospect.message}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Actions */}
                                {!editingId &&
                                  !introDrafting[prospect.id] &&
                                  !privateBriefs[prospect.id] && (
                                    <div className="flex flex-wrap items-center gap-3 pt-2">
                                      <button
                                        onClick={() => handleApprove(prospect)}
                                        className={primaryButton}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleEdit(prospect)}
                                        className={secondaryButton}
                                      >
                                        <Edit3 className="h-4 w-4" />
                                        Edit
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleGenerateBrief(prospect)
                                        }
                                        className={secondaryButton}
                                      >
                                        <FileText className="h-4 w-4" />
                                        Brief
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDiscard(prospect.id)
                                        }
                                        className={`${ghostButton} ml-auto`}
                                      >
                                        <X className="h-4 w-4" />
                                        Discard
                                      </button>
                                    </div>
                                  )}

                                {/* Private Brief */}
                                {privateBriefs[prospect.id] && (
                                  <div className="mt-4 border-t border-white/[0.06] pt-4">
                                    <div className="mb-4 flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-accent" />
                                        <span className="text-xs uppercase tracking-[0.14em] text-accent">
                                          Private Brief
                                        </span>
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleCloseBrief(prospect.id)
                                        }
                                        className="inline-flex min-h-9 items-center rounded-lg px-3 text-xs text-text-muted transition-colors hover:bg-white/[0.035] hover:text-text-secondary active:scale-[0.96]"
                                      >
                                        Close
                                      </button>
                                    </div>
                                    <div className="space-y-4 text-sm">
                                      <div>
                                        <p className="mb-1 text-xs uppercase tracking-[0.12em] text-text-muted">
                                          Context
                                        </p>
                                        <p className="text-pretty leading-6 text-text-secondary">
                                          {privateBriefs[prospect.id].summary}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="mb-1 text-xs uppercase tracking-[0.12em] text-text-muted">
                                          Blackwood Fit
                                        </p>
                                        <p className="text-pretty text-sm leading-6 text-accent">
                                          {privateBriefs[prospect.id].fit}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="mb-1 text-xs uppercase tracking-[0.12em] text-text-muted">
                                          Entry
                                        </p>
                                        <p className="text-pretty text-sm leading-6">
                                          {
                                            privateBriefs[prospect.id]
                                              .entryPoint
                                          }
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Interaction History */}
                                {getInteractions(prospect.id).length > 0 && (
                                  <div className="mt-6 border-t border-white/[0.06] pt-4">
                                    <div className="mb-4 flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-text-muted" />
                                      <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
                                        History
                                      </p>
                                    </div>
                                    <div className="space-y-2">
                                      {getInteractions(prospect.id).map(
                                        (interaction) => (
                                          <div
                                            key={interaction.id}
                                            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                                          >
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                {interaction.type ===
                                                "intro" ? (
                                                  <Handshake className="h-3.5 w-3.5 text-accent" />
                                                ) : (
                                                  <Mail className="h-3.5 w-3.5 text-accent" />
                                                )}
                                                <span className="text-xs">
                                                  {interaction.type}
                                                </span>
                                              </div>
                                              <span
                                                className={`rounded-full px-2 py-0.5 text-xs ${
                                                  interaction.outcome ===
                                                  "meeting"
                                                    ? "bg-green-500/10 text-green-400"
                                                    : interaction.outcome ===
                                                        "replied"
                                                      ? "bg-accent/10 text-accent"
                                                      : interaction.outcome ===
                                                          "draft"
                                                        ? "bg-surface text-text-muted"
                                                        : "bg-red-500/10 text-red-400"
                                                }`}
                                              >
                                                {interaction.outcome}
                                              </span>
                                            </div>
                                            <p className="mt-1 text-xs tabular-nums text-text-muted">
                                              {new Date(
                                                interaction.timestamp,
                                              ).toLocaleString()}
                                            </p>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* RIGHT PANEL */}
        <aside className="hidden w-72 border-l border-white/[0.07] bg-black/10 p-6 shadow-[-12px_0_70px_rgba(0,0,0,0.2)] backdrop-blur-xl xl:block">
          <motion.div {...fadeUp} className="sticky top-6">
            <div className="mb-6 flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              <span className="text-xs uppercase tracking-[0.14em] text-text-muted">
                Active Queue
              </span>
            </div>

            {approvedProspects.length > 0 ? (
              <div className="space-y-3">
                {approvedProspects.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium">
                        {item.recipient}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                          item.type === "intro"
                            ? "bg-accent/10 text-accent"
                            : "bg-white/[0.04] text-text-muted"
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <p className="mb-3 truncate text-xs text-text-muted">
                      via {item.name}
                    </p>
                    <button
                      onClick={() => handlePrepareDraft(item)}
                      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-text-primary px-3 text-xs font-medium text-background-primary transition-colors hover:bg-text-secondary active:scale-[0.96]"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      Prepare
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-12 text-center">
                <Users className="mx-auto mb-3 h-8 w-8 text-text-muted/25" />
                <p className="text-xs text-text-muted/50">
                  No approved prospects
                </p>
              </div>
            )}
          </motion.div>
        </aside>
      </div>
    </div>
  );
}
