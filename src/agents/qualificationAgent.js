import { clean, includesAny } from "./agentUtils";

export function qualificationAgent(input = {}) {
  const score = Number(input.score || input.estimatedFit || 0);
  const priority = clean(input.priority, score >= 75 ? "high" : score >= 45 ? "medium" : "low");
  const role = clean(input.role);
  const scope = clean(input.scope || input.likelyNeed);
  const organization = clean(input.organization || input.company);
  const note = clean(input.note || input.whyTheyFit);
  const publicSignals = input.publicSignals || input.signals || [];

  const reasoning = [];

  if (score >= 75 || priority === "high") {
    reasoning.push("Score/priority indicates strong alignment.");
  } else if (score >= 45 || priority === "medium") {
    reasoning.push("Score/priority indicates possible alignment, but needs human judgment.");
  } else {
    reasoning.push("Score/priority indicates limited immediate fit.");
  }

  if (includesAny(role, ["founder", "ceo", "principal", "partner", "investor", "chairman"])) {
    reasoning.push("Role suggests senior decision-maker or principal-level context.");
  }

  if (includesAny(scope, ["family office", "post-exit", "coordination", "investment", "advisory", "executive"])) {
    reasoning.push("Scope maps to Blackwood operating support.");
  }

  if (organization) {
    reasoning.push("Organization context is available for review.");
  }

  if (note.length > 80 || publicSignals.length > 1) {
    reasoning.push("There is enough context to support a qualified review.");
  }

  let recommendation = "review manually";

  if (
    (score >= 75 || priority === "high") &&
    includesAny(role, ["founder", "ceo", "principal", "partner", "investor", "chairman"])
  ) {
    recommendation = "approve";
  }

  if (score < 30 && priority === "low" && !includesAny(role, ["founder", "ceo", "principal", "partner"])) {
    recommendation = "reject";
  }

  return {
    recommendation,
    priority,
    score,
    reasoning,
    reviewedFields: {
      role,
      scope,
      organization,
      notePresent: Boolean(note),
    },
  };
}
