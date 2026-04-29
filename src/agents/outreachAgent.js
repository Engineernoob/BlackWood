import { clean, firstName } from "./agentUtils";

function directOutreach(prospect) {
  return [
    `${firstName(prospect.name)},`,
    "",
    `I noticed ${clean(prospect.publicSignals?.[0] || prospect.event || "your recent work")}. Blackwood works privately with principals navigating complex operational demands across communications, advisors, travel, and decision flow.`,
    "",
    "If useful, I would welcome a discreet conversation.",
    "",
    "— Blackwood Private Office",
  ].join("\n");
}

function introRequest(prospect) {
  return [
    "Hello,",
    "",
    `I saw your connection to ${clean(prospect.name, "this principal")}. Blackwood works quietly with founders, executives, and family-office operators whose coordination needs have outgrown conventional support.`,
    "",
    "If appropriate, I would appreciate a discreet introduction. No pressure.",
    "",
    "— Blackwood Private Office",
  ].join("\n");
}

function onboardingInvitation(prospect) {
  return [
    `${firstName(prospect.name)},`,
    "",
    "Thank you for the context. If aligned, the next step would be a short private call to understand operating scope, decision preferences, and where Blackwood can remove friction.",
    "",
    "We keep the discussion selective and practical.",
    "",
    "— Blackwood Private Office",
  ].join("\n");
}

export function outreachAgent(prospect = {}, type = "direct") {
  const draftType =
    type === "intro" || type === "intro request"
      ? "intro request"
      : type === "onboarding" || type === "onboarding call invitation"
        ? "onboarding call invitation"
        : "direct outreach";

  const body =
    draftType === "intro request"
      ? introRequest(prospect)
      : draftType === "onboarding call invitation"
        ? onboardingInvitation(prospect)
        : directOutreach(prospect);

  return {
    type: draftType,
    subject:
      draftType === "onboarding call invitation"
        ? "Blackwood private review"
        : "Private note from Blackwood",
    body,
    guardrails: [
      "No automatic contact has been sent.",
      "Use only after human operator approval.",
      "Reference only public, non-sensitive context.",
    ],
  };
}
