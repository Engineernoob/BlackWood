import { firstName } from "./agentUtils";

const signature = [
  "— Blackwood Private Office",
  "Client Relations",
  "",
  "Discretion. Control. Execution.",
].join("\n");

export function outreachDraftAgent(prospect, type = "direct_outreach") {
  const intro =
    type === "intro_request"
      ? `I saw your connection to ${prospect.name} and thought Blackwood may be relevant.`
      : `I came across your recent work at ${prospect.company} and thought Blackwood may be relevant.`;

  const body = [
    `Hello ${firstName(prospect.name)},`,
    "",
    intro,
    "",
    "Blackwood is a private operating layer for founders and principals managing increasing complexity across communications, scheduling, travel, advisors, and decision workflows.",
    "",
    "We are onboarding selectively.",
    "",
    "If useful, we can send a brief overview.",
    "",
    signature,
  ].join("\n");

  return {
    prospect_id: prospect.id,
    type,
    subject: "Private coordination support",
    body,
    status: "draft",
  };
}
