import { submitAccessRequest } from "./accessRequests";

export async function exampleAccessSubmit() {
  return submitAccessRequest({
    full_name: "Jane Founder",
    role: "Founder",
    organization: "Example Ventures",
    email: "jane@exampleventures.com",
    scope: "Founder / post-exit operations",
    note: "I need help coordinating inbox, advisor requests, calendar pressure, travel, documents, and post-exit operations.",
    source: "landing_page",
  });
}
