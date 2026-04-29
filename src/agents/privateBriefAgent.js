import { clean } from "./agentUtils";

export function privateBriefAgent(input = {}, context = {}) {
  const name = clean(input.full_name || input.name, "Unknown prospect");
  const role = clean(input.role, "Unspecified role");
  const company = clean(input.organization || input.company, "Undisclosed organization");
  const signals = input.publicSignals || input.signals || input.scoring_reasons || [];
  const likelyPainPoints = context.likelyPainPoints || [input.likelyNeed].filter(Boolean);
  const qualification = context.qualification;

  const operationalComplexity =
    likelyPainPoints.length > 0
      ? likelyPainPoints.join("; ")
      : "Operational complexity is not yet clear from available context.";

  const blackwoodFit =
    qualification?.recommendation === "approve"
      ? "Strong fit signal. Consider a direct private review."
      : qualification?.recommendation === "reject"
        ? "Weak fit signal. Keep response minimal unless new context emerges."
        : "Potential fit. Human operator should review before committing to next steps.";

  const suggestedNextStep =
    qualification?.recommendation === "approve"
      ? "Send a discreet follow-up and prepare for a short qualification call."
      : qualification?.recommendation === "reject"
        ? "Archive or send only neutral acknowledgement."
        : "Review manually and decide whether to request more context.";

  return {
    prospectSummary: `${name} is listed as ${role} at ${company}.`,
    likelyOperationalComplexity: operationalComplexity,
    blackwoodFit,
    suggestedNextStep,
    sourceSignals: signals,
  };
}
