import { includesAny } from "./agentUtils";

export function replyClassifierAgent(emailMessage = {}) {
  const body = `${emailMessage.subject || ""} ${emailMessage.body || ""}`.toLowerCase();

  if (includesAny(body, ["unsubscribe", "do not contact", "remove me", "stop emailing"])) {
    return {
      intent: "unsubscribe / do not contact",
      sentiment: "negative",
      urgency: "high",
      requiresApproval: true,
      reason: "Unsubscribe or do-not-contact language must be honored and never auto-sent.",
    };
  }

  if (includesAny(body, ["price", "pricing", "cost", "fee", "retainer"])) {
    return {
      intent: "pricing question",
      sentiment: "neutral",
      urgency: "medium",
      requiresApproval: true,
      reason: "Pricing questions require operator review.",
    };
  }

  if (includesAny(body, ["meeting", "call", "calendar", "schedule", "available"])) {
    return {
      intent: "meeting request",
      sentiment: "positive",
      urgency: "high",
      requiresApproval: true,
      reason: "Meeting requests are high-value and should be approved manually.",
    };
  }

  if (includesAny(body, ["send", "overview", "more info", "learn more", "details"])) {
    return {
      intent: "asks for more info",
      sentiment: "positive",
      urgency: "medium",
      requiresApproval: false,
      reason: "Safe informational request with no sensitive content.",
    };
  }

  if (includesAny(body, ["not interested", "no thanks", "not a fit"])) {
    return {
      intent: "not interested",
      sentiment: "neutral",
      urgency: "low",
      requiresApproval: false,
      reason: "Polite decline can receive a short acknowledgement or be archived.",
    };
  }

  if (includesAny(body, ["concern", "claim", "legal", "financial", "angry", "misleading"])) {
    return {
      intent: "objection",
      sentiment: "negative",
      urgency: "high",
      requiresApproval: true,
      reason: "Objections and legal/financial language require human review.",
    };
  }

  return {
    intent: "interested",
    sentiment: "positive",
    urgency: "medium",
    requiresApproval: true,
    reason: "Positive reply should be reviewed before a relationship advances.",
  };
}
