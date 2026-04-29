const baseScores = {
  "Founder & CEO": 85,
  "Managing Partner": 80,
  "Chairman": 78,
  "Managing Director": 82,
  "Principal": 75,
  "CEO": 80
}

const eventMultipliers = {
  "Exit": 12,
  "Acquired": 10,
  "IPO": 8,
  "Close": 5,
  "Expansion": 3,
  "Review": -2
}

const signalMultipliers = {
  "Family Office": 8,
  "Multi-family": 6,
  "Public Company": 5,
  "Enterprise": 3,
  "AI/ML": 4,
  "Fintech": 3,
  "Venture": 2,
  "Private": -3
}

export function wealthSignalAgent(prospect) {
  let baseScore = baseScores[prospect.role] || 75
  let multiplier = 0
  
  for (const [event, mult] of Object.entries(eventMultipliers)) {
    if (prospect.event?.includes(event)) {
      multiplier += mult
    }
  }
  
  for (const [signal, mult] of Object.entries(signalMultipliers)) {
    if (prospect.signals?.some(s => s.includes(signal))) {
      multiplier += mult
    }
  }
  
  const score = Math.min(99, Math.max(45, baseScore + multiplier))
  
  return {
    score,
    factors: {
      roleBase: baseScore,
      eventImpact: multiplier,
      signalBoost: multiplier
    },
    classification: score >= 80 ? "high-fit" : score >= 70 ? "moderate" : "standard"
  }
}

export function assignScores(prospects) {
  return prospects.map(prospect => ({
    ...prospect,
    score: wealthSignalAgent(prospect).score
  }))
}