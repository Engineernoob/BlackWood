import { includesAny } from "./agentUtils";

export function safetyGateAgent(replyDraft = {}, context = {}) {
  const body = `${replyDraft.body || ""} ${context.intent || ""} ${context.sentiment || ""}`;
  const highValue = Number(context.fit_score || context.score || 0) >= 75;

  if (includesAny(body, ["unsubscribe", "do not contact"])) {
    return {
      auto_send_allowed: false,
      reason: "Unsubscribe and do-not-contact handling requires operator confirmation.",
    };
  }

  if (includesAny(body, ["pricing", "price", "retainer", "legal", "financial", "claim"])) {
    return {
      auto_send_allowed: false,
      reason: "Pricing, legal, or financial content must not auto-send.",
    };
  }

  if (includesAny(body, ["angry", "objection"]) || context.sentiment === "negative") {
    return {
      auto_send_allowed: false,
      reason: "Negative or objection-bearing replies require escalation.",
    };
  }

  if (highValue || context.intent === "meeting request") {
    return {
      auto_send_allowed: false,
      reason: "High-value lead responses and meeting requests require approval.",
    };
  }

  if (
    includesAny(body, [
      "thank you for letting us know",
      "short overview",
      "follow up privately",
      "understood",
    ])
  ) {
    return {
      auto_send_allowed: true,
      reason: "Low-risk acknowledgement or informational follow-up.",
    };
  }

  return {
    auto_send_allowed: false,
    reason: "Defaulting to manual approval.",
  };
}
