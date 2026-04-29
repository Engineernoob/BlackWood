const connectionTemplates = {
  "Founder & CEO": [
    { role: "Partner", relationshipStrength: "strong", context: "Lead investor", pathType: "warm intro" },
    { role: "Former CTO", relationshipStrength: "medium", context: "Co-founder", pathType: "second-degree" },
    { role: "Executive Assistant", relationshipStrength: "medium", context: "Direct report", pathType: "ecosystem" },
    { role: "Board Observer", relationshipStrength: "weak", context: "Shared network", pathType: "second-degree" }
  ],
  "Managing Partner": [
    { role: "Managing Partner", relationshipStrength: "strong", context: "Co-investor", pathType: "warm intro" },
    { role: "Principal", relationshipStrength: "medium", context: "Direct report", pathType: "ecosystem" },
    { role: "Founder", relationshipStrength: "medium", context: "Portfolio founder", pathType: "second-degree" }
  ],
  "Chairman": [
    { role: "Senior Partner", relationshipStrength: "strong", context: "Legal counsel", pathType: "warm intro" },
    { role: "Family Office Advisor", relationshipStrength: "strong", context: "Trust advisor", pathType: "warm intro" },
    { role: "Chief of Staff", relationshipStrength: "medium", context: "Direct report", pathType: "ecosystem" },
    { role: "Chairman", relationshipStrength: "medium", context: "Peer network", pathType: "second-degree" }
  ],
  "Managing Director": [
    { role: "Partner", relationshipStrength: "strong", context: "Co-founder", pathType: "warm intro" },
    { role: "LP Relations", relationshipStrength: "strong", context: "Investor relations", pathType: "ecosystem" },
    { role: "Chairman", relationshipStrength: "medium", context: "Major LP", pathType: "second-degree" }
  ],
  "Principal": [
    { role: "Partner", relationshipStrength: "medium", context: "Investor network", pathType: "second-degree" },
    { role: "Principal", relationshipStrength: "medium", context: "Direct report", pathType: "ecosystem" }
  ],
  "CEO": [
    { role: "Chairman", relationshipStrength: "strong", context: "Board chairman", pathType: "warm intro" },
    { role: "Chief of Staff", relationshipStrength: "strong", context: "Direct report", pathType: "ecosystem" },
    { role: "SVP Operations", relationshipStrength: "medium", context: "Longtime colleague", pathType: "second-degree" }
  ]
}

const firstNames = ["Robert", "Diana", "Michael", "Sarah", "James", "Lisa", "Patricia", "William", "Rachel", "Charles", "Elizabeth", "Andrew", "Jennifer", "Marcus", "Tom", "Emily", "Richard", "Amanda", "George", "Harold", "Caroline", "John", "Roberto", "Maria", "Walter"]

function generateConnectionName() {
  return firstNames[Math.floor(Math.random() * firstNames.length)]
}

export function referralIntelligenceAgent(prospect) {
  const templates = connectionTemplates[prospect.role] || connectionTemplates["CEO"]
  const companyInitial = prospect.company?.charAt(0) || "A"
  
  const connections = templates.map((t, idx) => ({
    name: generateConnectionName(),
    role: `${t.role}, ${prospect.company?.substring(0, 3).toUpperCase()}${t.role.includes("Partner") ? " Partners" : t.role.includes("Advisor") ? " Advisory" : ""}`,
    relationshipStrength: t.relationshipStrength,
    context: `${t.context} with ${prospect.company}`,
    pathType: t.pathType
  })).slice(0, 4)
  
  const sortedConnections = [...connections].sort((a, b) => {
    const strengthOrder = { strong: 3, medium: 2, weak: 1 }
    return strengthOrder[b.relationshipStrength] - strengthOrder[a.relationshipStrength]
  })
  
  const bestPath = {
    name: sortedConnections[0]?.name || connections[0]?.name,
    reason: `${sortedConnections[0]?.context || connections[0]?.context} — ${sortedConnections[0]?.relationshipStrength || connections[0]?.relationshipStrength} relationship`
  }
  
  return {
    connections,
    bestPath,
    totalPaths: connections.length
  }
}

export function enrichWithReferrals(prospects) {
  return prospects.map(prospect => ({
    ...prospect,
    ...referralIntelligenceAgent(prospect)
  }))
}