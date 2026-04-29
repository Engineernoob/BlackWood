const painMap = {
  "Founder & CEO": [
    "Build vs. buy operational complexity post-scale",
    "Coordination across multiple service providers",
    "Time-intensive board and investor communications"
  ],
  "Managing Partner": [
    "Volume of inbound opportunities overwhelming capacity",
    "LP relationship management across funds",
    "Deal flow filtering at scale"
  ],
  "Chairman": [
    "Family coordination across jurisdictions",
    "Legacy wealth transfer complexities",
    "Multi-generational communication challenges"
  ],
  "Managing Director": [
    "Portfolio company oversight coordination",
    "Investor reporting burden",
    "Strategic decision prioritization"
  ],
  "Principal": [
    "Capital deployment workflows",
    "Deal sourcing efficiency",
    "Investment committee coordination"
  ],
  "CEO": [
    "Operational scaling demands",
    "Executive team coordination",
    "Stakeholder management complexity"
  ]
}

const eventPainMap = {
  "Exit": "Post-transaction operational restructuring",
  "Acquired": "Integration coordination with acquirer",
  "IPO": "Public company governance overhead",
  "Fund Close": "Rapid deployment pressure",
  "Expansion": "Geographic and operational scaling",
  "Review": "Strategic assessment bottleneck"
}

export function painHypothesisAgent(prospect) {
  const rolePains = painMap[prospect.role] || painMap["CEO"]
  let eventPain = null
  
  for (const [event, pain] of Object.entries(eventPainMap)) {
    if (prospect.event?.includes(event)) {
      eventPain = pain
      break
    }
  }
  
  const primaryPain = eventPain || rolePains[0]
  const secondaryPains = rolePains.slice(1, 3)
  
  return {
    primary: primaryPain,
    secondary: secondaryPains,
    hypothesis: `${prospect.name} likely faces ${primaryPain.toLowerCase()} given their ${prospect.event?.toLowerCase() || 'current position'}.`,
    confidence: eventPain ? "high" : "moderate"
  }
}

export function inferPains(prospects) {
  return prospects.map(prospect => ({
    ...prospect,
    pain: painHypothesisAgent(prospect).primary
  }))
}