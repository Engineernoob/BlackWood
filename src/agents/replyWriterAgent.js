const signature = [
  "— Blackwood Private Office",
  "Client Relations",
  "",
  "Discretion. Control. Execution.",
].join("\n");

export function replyWriterAgent(thread = {}, classification = {}) {
  const intent = classification.intent || thread.intent || "interested";

  if (intent === "unsubscribe / do not contact") {
    return {
      body: ["Understood. We will not contact you again.", "", signature].join("\n"),
      requires_approval: true,
    };
  }

  if (intent === "not interested") {
    return {
      body: ["Understood. Thank you for letting us know.", "", signature].join("\n"),
      requires_approval: false,
    };
  }

  if (intent === "asks for more info") {
    return {
      body: [
        "Thank you for the note.",
        "",
        "Blackwood works privately with founders and principals who need a discreet operating layer across communications, scheduling, travel, advisors, and decision workflows.",
        "",
        "We can send a short overview if helpful.",
        "",
        signature,
      ].join("\n"),
      requires_approval: false,
    };
  }

  if (intent === "meeting request") {
    return {
      body: [
        "Thank you. A private call would be appropriate.",
        "",
        "We will follow up with a discreet scheduling option.",
        "",
        signature,
      ].join("\n"),
      requires_approval: true,
    };
  }

  return {
    body: [
      "Thank you for the reply.",
      "",
      "We will review internally and follow up privately if aligned.",
      "",
      signature,
    ].join("\n"),
    requires_approval: true,
  };
}
