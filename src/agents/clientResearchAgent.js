import { makeId } from "./agentUtils";

const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY;

const sampleProspects = [
  {
    name: "Sample Founder",
    role: "Founder",
    company: "Recently Acquired Company",
    publicSignals: ["recent acquisition", "founder liquidity event"],
    sourceLinks: [],
    estimatedFit: 78,
    whyTheyFit:
      "A recent acquisition may create post-transaction operational complexity.",
    likelyNeed: "Post-exit coordination across advisors, communications, and calendar.",
    recommendedApproach: "Direct outreach referencing the public acquisition.",
  },
  {
    name: "Sample Investor",
    role: "Managing Partner",
    company: "Private Capital Firm",
    publicSignals: ["funding rounds", "board roles", "angel investing activity"],
    sourceLinks: [],
    estimatedFit: 68,
    whyTheyFit:
      "Investment activity suggests high inbound volume and portfolio coordination needs.",
    likelyNeed: "Deal-flow filtering and investor/advisor coordination.",
    recommendedApproach: "Intro request through a trusted mutual connection.",
  },
];

function searchQueries(query) {
  return [
    `${query} founder acquired funding round executive transition`,
    `${query} family office principal investor board podcast interview`,
  ];
}

function signalFromText(text = "") {
  const lower = text.toLowerCase();
  const signals = [];

  if (lower.includes("acquired") || lower.includes("acquisition")) signals.push("recent acquisition");
  if (lower.includes("funding") || lower.includes("series ")) signals.push("funding round");
  if (lower.includes("exit") || lower.includes("liquidity")) signals.push("founder liquidity event");
  if (lower.includes("transition") || lower.includes("appointed")) signals.push("executive transition");
  if (lower.includes("podcast") || lower.includes("interview")) signals.push("public interview/podcast");
  if (lower.includes("board")) signals.push("board role");
  if (lower.includes("angel")) signals.push("angel investing activity");
  if (lower.includes("family office")) signals.push("family office mention");

  return signals.length > 0 ? signals : ["public operating signal"];
}

function estimateFit(signals = []) {
  let fit = 52;
  if (signals.includes("recent acquisition")) fit += 18;
  if (signals.includes("founder liquidity event")) fit += 16;
  if (signals.includes("family office mention")) fit += 15;
  if (signals.includes("board role")) fit += 8;
  if (signals.includes("funding round")) fit += 7;
  if (signals.includes("executive transition")) fit += 6;
  return Math.min(95, fit);
}

function resultToProspect(result) {
  const title = result.title || "Public profile";
  const content = result.content || "";
  const text = `${title} ${content}`;
  const signals = signalFromText(text);
  const fit = estimateFit(signals);

  return {
    id: makeId("prospect"),
    name: title.split(/[-|,]/)[0].trim() || "Public prospect",
    role:
      text.toLowerCase().includes("investor") ||
      text.toLowerCase().includes("partner")
        ? "Investor / Principal"
        : "Founder / Executive",
    company: "Public source review required",
    publicSignals: signals,
    sourceLinks: result.url ? [result.url] : [],
    estimatedFit: fit,
    whyTheyFit:
      "Public source suggests a role or event that may create coordination complexity.",
    likelyNeed:
      "Potential need for communications, advisor, travel, or decision workflow support.",
    recommendedApproach:
      fit >= 75
        ? "Review source links and consider discreet direct outreach."
        : "Review manually before deciding whether outreach is appropriate.",
  };
}

export async function clientResearchAgent(queryOrOptions) {
  const query =
    typeof queryOrOptions === "string"
      ? queryOrOptions
      : queryOrOptions?.query || "";
  const enableRealSearch =
    typeof queryOrOptions === "object" ? Boolean(queryOrOptions.realSearch) : false;

  if (!enableRealSearch || !TAVILY_API_KEY) {
    return sampleProspects.map((prospect) => ({
      ...prospect,
      id: makeId("prospect"),
      sourceMode: "sample_public_data_shape",
      researchQuery: query,
    }));
  }

  const results = [];

  for (const searchQuery of searchQueries(query)) {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query: searchQuery,
        max_results: 5,
        search_depth: "advanced",
        include_answer: false,
        include_raw_content: false,
        include_images: false,
      }),
    });

    if (!response.ok) continue;
    const data = await response.json();
    results.push(...(data.results || []));
  }

  const seen = new Set();
  return results
    .filter((result) => {
      if (!result.url || seen.has(result.url)) return false;
      seen.add(result.url);
      return true;
    })
    .slice(0, 6)
    .map(resultToProspect);
}
