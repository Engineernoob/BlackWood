import { clean, firstName } from "./agentUtils";

const sharedClose = "If aligned, we will reach out directly.\n\n— Blackwood Private Office";

export function followUpWriterAgent(accessRequest = {}, qualification = {}) {
  const priority = clean(accessRequest.priority || qualification.priority, "low");
  const greeting = clean(accessRequest.full_name)
    ? `${firstName(accessRequest.full_name)},`
    : "Hello,";

  let body;

  if (priority === "low") {
    body = [
      greeting,
      "",
      "Thank you for your interest. Requests are reviewed selectively.",
      "",
      "— Blackwood Private Office",
    ].join("\n");
  } else {
    body = [
      greeting,
      "",
      "Thank you for your request.",
      "",
      "Blackwood operates privately with a limited number of relationships at a time. Your request has been received and is currently under review.",
      "",
      sharedClose,
    ].join("\n");
  }

  return {
    subject: "Your Blackwood Request Has Been Received",
    body,
    tone: "private, selective, polished",
  };
}
