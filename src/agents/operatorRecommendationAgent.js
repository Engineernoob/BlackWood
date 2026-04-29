export function operatorRecommendationAgent(context = {}) {
  const qualification = context.qualification || {};
  const inputType = context.inputType || "access_request";

  if (qualification.recommendation === "approve") {
    return inputType === "research_query"
      ? "Review the top prospect source links, then approve one discreet outreach draft."
      : "Approve for manual review and send a discreet follow-up from the operator inbox.";
  }

  if (qualification.recommendation === "reject") {
    return inputType === "research_query"
      ? "Do not pursue this prospect; retain only public notes if useful for future research."
      : "Archive the request unless new context is provided.";
  }

  return inputType === "research_query"
    ? "Manually review the prospect and source links before drafting any outreach."
    : "Review the request manually and decide whether to ask for additional context.";
}
