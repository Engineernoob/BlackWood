import { asSentenceList, clean, includesAny } from "./agentUtils";

function inferPainPoints(request) {
  const text = [
    request.role,
    request.scope,
    request.organization,
    request.note,
  ].join(" ");

  const pains = [];

  if (includesAny(text, ["travel", "calendar", "inbox", "email", "communications"])) {
    pains.push("High-friction personal and executive coordination");
  }
  if (includesAny(text, ["advisor", "legal", "tax", "documents", "signature"])) {
    pains.push("Advisor and document workflow complexity");
  }
  if (includesAny(text, ["family office", "family", "estate", "holdings"])) {
    pains.push("Family-office coordination across relationships and assets");
  }
  if (includesAny(text, ["investment", "portfolio", "capital", "fund", "deal"])) {
    pains.push("Investment workflow filtering and follow-through");
  }
  if (includesAny(text, ["post-exit", "liquidity", "acquired", "exit", "founder"])) {
    pains.push("Post-liquidity operating transition");
  }

  if (pains.length === 0) {
    pains.push("Possible coordination burden across time, decisions, and service providers");
  }

  return pains;
}

export function intakeAnalystAgent(accessRequest) {
  const likelyPainPoints = inferPainPoints(accessRequest);
  const name = clean(accessRequest.full_name, "The requester");
  const role = clean(accessRequest.role, "an unspecified role");
  const organization = clean(accessRequest.organization, "an undisclosed organization");
  const scope = clean(accessRequest.scope, "a general Blackwood coordination need");
  const score = Number(accessRequest.score || 0);
  const priority = clean(accessRequest.priority, "low");

  const summary = `${name} appears to be ${role} associated with ${organization}. The stated scope is ${scope}. The request scored ${score} and is currently classified as ${priority} priority.`;

  const fitSignals = asSentenceList([
    includesAny(role, ["founder", "ceo", "principal", "partner", "chairman"])
      ? "Requester appears to operate at principal or senior operator level"
      : "",
    clean(accessRequest.organization)
      ? "Organization context was provided"
      : "",
    clean(accessRequest.note).length > 80
      ? "Requester gave enough detail to evaluate operational context"
      : "",
    score >= 75
      ? "Score suggests strong alignment with Blackwood intake criteria"
      : score >= 45
        ? "Score suggests possible fit pending manual review"
        : "Score suggests weak or early fit",
  ]);

  return {
    summary,
    likelyPainPoints,
    fitAssessment:
      score >= 75
        ? "Strong potential fit for Blackwood review."
        : score >= 45
          ? "Possible fit. Manual review recommended before outreach."
          : "Limited fit signal. Keep tone neutral and selective.",
    fitSignals,
  };
}
