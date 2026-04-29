import { makeId } from "./agentUtils";

const sampleProspects = [
  {
    name: "Mara Ellison",
    role: "Founder",
    company: "Northline Systems",
    email: "mara@example.com",
    source_url: "https://example.com/northline-acquisition",
    public_signals: ["recent acquisition", "founder liquidity event", "public interview"],
    reason_matched: "Founder recently associated with a public acquisition signal.",
    recommended_approach: "Direct outreach referencing the public transition.",
  },
  {
    name: "Julian Vale",
    role: "Managing Partner",
    company: "Vale Family Capital",
    email: "julian@example.com",
    source_url: "https://example.com/vale-family-capital",
    public_signals: ["family office mention", "board roles", "angel investing activity"],
    reason_matched: "Family-office and board signals suggest coordination complexity.",
    recommended_approach: "Warm intro request through shared investment network.",
  },
  {
    name: "Simone Arledge",
    role: "CEO",
    company: "Arledge Health",
    email: "simone@example.com",
    source_url: "https://example.com/arledge-series-c",
    public_signals: ["funding round", "executive transition", "public interview"],
    reason_matched: "Growth-stage executive with expanding investor and scheduling load.",
    recommended_approach: "Direct note offering brief overview only if useful.",
  },
  {
    name: "Nolan Pierce",
    role: "Principal",
    company: "Pierce Holdings",
    email: "nolan@example.com",
    source_url: "https://example.com/pierce-board",
    public_signals: ["board roles", "family office mention"],
    reason_matched: "Principal-level operator with public board responsibilities.",
    recommended_approach: "Intro request; avoid first-touch claims beyond public board context.",
  },
  {
    name: "Claire Benton",
    role: "Founder",
    company: "Benton AI",
    email: "claire@example.com",
    source_url: "https://example.com/benton-funding",
    public_signals: ["funding round", "public podcast", "executive transition"],
    reason_matched: "Public funding and interview signals suggest rising operational load.",
    recommended_approach: "Direct outreach with no pressure and no urgency.",
  },
];

function scoreProspect(prospect) {
  let score = 50;
  const signals = prospect.public_signals || [];
  const role = `${prospect.role} ${prospect.company}`.toLowerCase();

  if (role.includes("founder") || role.includes("principal")) score += 12;
  if (role.includes("partner") || role.includes("family")) score += 10;
  if (signals.includes("recent acquisition")) score += 16;
  if (signals.includes("founder liquidity event")) score += 16;
  if (signals.includes("family office mention")) score += 14;
  if (signals.includes("board roles")) score += 8;
  if (signals.includes("funding round")) score += 6;

  return Math.min(96, score);
}

export function prospectHunterAgent(query = "daily Blackwood prospects") {
  const normalized = String(query || "").toLowerCase();
  const filtered = sampleProspects.filter((prospect) => {
    const haystack = [
      prospect.name,
      prospect.role,
      prospect.company,
      prospect.reason_matched,
      ...(prospect.public_signals || []),
    ]
      .join(" ")
      .toLowerCase();

    return (
      !normalized ||
      normalized.includes("daily") ||
      normalized.split(/\s+/).some((term) => term.length > 3 && haystack.includes(term))
    );
  });

  const source = filtered.length > 0 ? filtered : sampleProspects;

  return source.slice(0, 25).map((prospect) => ({
    id: makeId("prospect"),
    ...prospect,
    fit_score: scoreProspect(prospect),
    status: "new",
  }));
}
