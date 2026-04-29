const freeEmailDomains = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
];

function includesAny(value = "", terms = []) {
  const lower = value.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function getEmailDomain(email = "") {
  return email.split("@")[1]?.toLowerCase() || "";
}

function normalize(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function scoreAccessRequest(request) {
  let score = 0;
  const reasons = [];

  const role = request.role || "";
  const scope = request.scope || "";
  const organization = request.organization || "";
  const note = request.note || "";
  const email = request.email || "";

  const roleRules = [
    { terms: ["founder", "ceo", "principal", "family office"], points: 25, reason: "High-fit role/title" },
    { terms: ["managing partner"], points: 20, reason: "Senior investment/operator role" },
    { terms: ["investor"], points: 15, reason: "Investor profile" },
    { terms: ["executive assistant", "ea"], points: 10, reason: "Potential gatekeeper/operator" },
  ];

  for (const rule of roleRules) {
    if (includesAny(role, rule.terms)) {
      score += rule.points;
      reasons.push(`${rule.reason}: +${rule.points}`);
      break;
    }
  }

  const scopeRules = [
    { term: "Founder / post-exit operations", points: 30 },
    { term: "Family office coordination", points: 30 },
    { term: "Investment / advisory workflows", points: 20 },
    { term: "Personal executive support", points: 15 },
    { term: "Other", points: 5 },
  ];

  const matchedScope = scopeRules.find(
    (rule) => scope.toLowerCase() === rule.term.toLowerCase()
  );

  if (matchedScope) {
    score += matchedScope.points;
    reasons.push(`Relevant scope (${matchedScope.term}): +${matchedScope.points}`);
  }

  if (organization.trim().length > 0) {
    score += 10;
    reasons.push("Organization provided: +10");
  }

  if (
    includesAny(organization, [
      "capital",
      "ventures",
      "holdings",
      "family office",
      "partners",
      "fund",
      "foundation",
    ])
  ) {
    score += 15;
    reasons.push("Organization suggests capital/family-office context: +15");
  }

  if (note.trim().length > 80) {
    score += 15;
    reasons.push("Detailed note provided: +15");
  }

  if (
    includesAny(note, [
      "travel",
      "advisor",
      "inbox",
      "calendar",
      "liquidity",
      "post-exit",
      "family office",
      "documents",
      "operations",
    ])
  ) {
    score += 10;
    reasons.push("Note mentions Blackwood-relevant workflow pain: +10");
  }

  const domain = getEmailDomain(email);
  if (domain && !freeEmailDomains.includes(domain)) {
    score += 10;
    reasons.push("Professional/private email domain: +10");
  }

  const orgNormalized = normalize(organization);
  const domainNormalized = normalize(domain.split(".")[0] || "");
  if (orgNormalized && domainNormalized && orgNormalized.includes(domainNormalized)) {
    score += 10;
    reasons.push("Email domain loosely matches organization: +10");
  }

  score = Math.min(score, 100);

  let priority = "low";
  if (score >= 75) priority = "high";
  else if (score >= 45) priority = "medium";

  return {
    score,
    priority,
    reasons,
  };
}
