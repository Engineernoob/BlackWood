export function privateBriefAgent(prospect) {
  const recentEvent = prospect.event || 'recent milestone'
  const signals = prospect.signals || []
  
  const complexitySignals = []
  if (prospect.event?.includes('Exit') || prospect.event?.includes('Acquired') || prospect.event?.includes('IPO')) {
    complexitySignals.push('Significant liquidity event within 18 months')
    complexitySignals.push('Post-transaction operational restructure')
  }
  if (signals.some(s => s.toLowerCase().includes('family') || s.toLowerCase().includes('multi'))) {
    complexitySignals.push('Multi-jurisdictional family coordination')
  }
  if (signals.some(s => s.toLowerCase().includes('fund') || s.toLowerCase().includes('capital'))) {
    complexitySignals.push('Multiple LP / investor relationships')
    complexitySignals.push('Capital deployment workflows')
  }
  if (signals.some(s => s.toLowerCase().includes('public') || s.toLowerCase().includes('IPO'))) {
    complexitySignals.push('Public company governance overhead')
    complexitySignals.push('Enhanced disclosure requirements')
  }
  if (complexitySignals.length === 0) {
    complexitySignals.push('Domain diversification observed')
    complexitySignals.push('Operational scaling demands')
  }
  
  const frictionPoints = [
    prospect.pain || 'Coordination across multiple service providers',
    'Fragmented communication channels',
    'Time-intensive decision workflows'
  ]
  
  const fitScore = prospect.score || 75
  const fit = fitScore >= 80 
    ? 'High alignment — operational complexity matches Blackwood core capability. Principal post-transition represents ideal client profile.'
    : fitScore >= 70 
    ? 'Moderate alignment — secondary coordination needs likely emerge as asset base stabilizes.'
    : 'Emerging alignment — initial touchpoint to establish relationship for future consideration.'
  
  const entryPoint = prospect.bestPath 
    ? `Discreet introduction via ${prospect.bestPath.name}`
    : prospect.connections?.[0]
    ? `Warm introduction through ${prospect.connections[0].name}`
    : `Direct note referencing ${signals[0] || 'operational coordination'}`
  
  return {
    summary: `${prospect.name} leads ${prospect.company}. Recent ${recentEvent.toLowerCase()} represents a significant transition point. Background includes ${signals.slice(0, 3).join(', ')}.`,
    context: `${prospect.name} operates at the principal level with ${signals[0]?.toLowerCase() || 'enterprise'} focus. The ${recentEvent.toLowerCase()} creates specific operational demands that conventional solutions don't address.`,
    complexitySignals,
    frictionPoints,
    blackwoodFit: fit,
    suggestedEntry: entryPoint,
    confidence: 'moderate'
  }
}

export function attachBriefs(prospects) {
  return prospects.map(prospect => ({
    ...prospect,
    privateBrief: privateBriefAgent(prospect)
  }))
}