import {
  clientResearchAgent,
  followUpWriterAgent,
  intakeAnalystAgent,
  operatorRecommendationAgent,
  outreachAgent,
  privateBriefAgent,
  qualificationAgent,
} from "../agents";

function isAccessRequest(input) {
  return Boolean(
    input &&
      typeof input === "object" &&
      (input.email || input.full_name || input.scoring_reasons) &&
      (input.role || input.scope || input.note),
  );
}

function normalizeResearchInput(input) {
  if (typeof input === "string") {
    return { query: input, realSearch: false };
  }

  return {
    query: input?.query || input?.researchQuery || "",
    realSearch: Boolean(input?.realSearch),
    outreachType: input?.outreachType || "direct outreach",
  };
}

function strongestProspect(prospects = []) {
  return [...prospects].sort(
    (a, b) => Number(b.estimatedFit || 0) - Number(a.estimatedFit || 0),
  )[0];
}

function runAccessRequestPipeline(accessRequest) {
  const intake = intakeAnalystAgent(accessRequest);
  const qualification = qualificationAgent(accessRequest);
  const followUpEmail = followUpWriterAgent(accessRequest, qualification);
  const privateBrief = privateBriefAgent(accessRequest, {
    likelyPainPoints: intake.likelyPainPoints,
    qualification,
  });
  const recommendedAction = operatorRecommendationAgent({
    inputType: "access_request",
    qualification,
  });

  return {
    inputType: "access_request",
    summary: intake.summary,
    likelyPainPoints: intake.likelyPainPoints,
    qualification,
    followUpEmail,
    privateBrief,
    outreachDraft: null,
    recommendedAction,
    metadata: {
      completedAt: new Date().toISOString(),
      agents: [
        "intakeAnalystAgent",
        "qualificationAgent",
        "followUpWriterAgent",
        "privateBriefAgent",
        "operatorRecommendationAgent",
      ],
    },
  };
}

async function runResearchPipeline(input) {
  const researchInput = normalizeResearchInput(input);
  const prospects = await clientResearchAgent(researchInput);
  const topProspect = strongestProspect(prospects);

  if (!topProspect) {
    const qualification = qualificationAgent({ score: 0, priority: "low" });
    return {
      inputType: "research_query",
      summary: `No prospects found for "${researchInput.query}".`,
      likelyPainPoints: [],
      qualification,
      followUpEmail: null,
      privateBrief: null,
      outreachDraft: null,
      recommendedAction: operatorRecommendationAgent({
        inputType: "research_query",
        qualification,
      }),
      prospects: [],
      metadata: {
        query: researchInput.query,
        realSearch: researchInput.realSearch,
        completedAt: new Date().toISOString(),
      },
    };
  }

  const qualification = qualificationAgent({
    ...topProspect,
    score: topProspect.estimatedFit,
    priority:
      topProspect.estimatedFit >= 75
        ? "high"
        : topProspect.estimatedFit >= 45
          ? "medium"
          : "low",
  });
  const outreachDraft = outreachAgent(topProspect, researchInput.outreachType);
  const privateBrief = privateBriefAgent(topProspect, { qualification });
  const recommendedAction = operatorRecommendationAgent({
    inputType: "research_query",
    qualification,
  });

  return {
    inputType: "research_query",
    summary: `${prospects.length} public-data prospect${prospects.length === 1 ? "" : "s"} identified for "${researchInput.query}". Top prospect: ${topProspect.name}.`,
    likelyPainPoints: [topProspect.likelyNeed],
    qualification,
    followUpEmail: null,
    privateBrief,
    outreachDraft,
    recommendedAction,
    prospects,
    metadata: {
      query: researchInput.query,
      realSearch: researchInput.realSearch,
      publicDataOnly: true,
      noAutomaticContact: true,
      sensitiveTraitInference: false,
      completedAt: new Date().toISOString(),
      agents: [
        "clientResearchAgent",
        "qualificationAgent",
        "outreachAgent",
        "privateBriefAgent",
        "operatorRecommendationAgent",
      ],
    },
  };
}

export async function runAgentSwarm(input) {
  if (isAccessRequest(input)) {
    return runAccessRequestPipeline(input);
  }

  return runResearchPipeline(input);
}
