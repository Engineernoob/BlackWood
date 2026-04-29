const directOutreachTemplates = {
  "Founder & CEO": (prospect) => 
    `Dear ${prospect.name.split(' ')[0]},\n\n${getOutreachContext(prospect)}\n\nBlackwood operates as a private layer for founders post-execution. We handle communications, travel, advisors, and daily decision workflows—quietly.\n\nIf you're interested in a conversation about how we support principals through transition, I'd welcome the introduction.\n\n\nBest`,
  "Managing Partner": (prospect) => 
    `${prospect.name.split(' ')[0]},\n\n${getOutreachContext(prospect)}\n\nBlackwood helps principals filter, prioritize, and act on opportunities with trained human review. We're invite-only and built for those who value discretion.\n\nWould be happy to share how we support similar family offices.\n\n\nRespectfully`,
  "Chairman": (prospect) => 
    `Dear ${prospect.name.split(' ')[0]},\n\n${getOutreachContext(prospect)}\n\nBehind the scenes, family principals often need a layer that operates with discretion and precision. Blackwood coordinates communications, travel, legal workflows, and daily decisions—without operational sprawl.\n\nI'd welcome the chance to discuss how we might support your operations.\n\n\nWith respect`,
  "Managing Director": (prospect) => 
    `${prospect.name.split(' ')[0]},\n\n${getOutreachContext(prospect)}\n\nWith your recent milestone, managing relationships across portfolios becomes more complex. Blackwood provides coordination that handles investor communications, reporting, and scheduling—with human review.\n\nBuilt for principals who've earned the right to operate at this level.\n\n\nBest`,
  "Principal": (prospect) => 
    `${prospect.name.split(' ')[0]},\n\n${getOutreachContext(prospect)}\n\nWith ${prospect.event?.toLowerCase()}, the operational burden doubles. Blackwood helps principals filter, research, and act on deal flow—with human support.\n\nWe're built for those who value precision over volume.\n\nLet me know if you'd find a conversation useful.\n\n\nRegards`,
  "CEO": (prospect) => 
    `Dear ${prospect.name.split(' ')[0]},\n\n${getOutreachContext(prospect)}\n\nScaling brings coordination challenges that can't be solved with more tools. Principals at your level need a layer that anticipates needs before they arise.\n\nBlackwood handles communications, travel, advisor coordination, and daily decisions—quietly. Built for those who've outgrown conventional solutions.\n\n\nWould welcome a conversation.\n\n\nBest`
}

const introTemplates = {
  "warm intro": (prospect, connection) => 
    `Hey ${connection.name.split(' ')[0]},\n\n${getIntroContext(prospect, connection)}\n\nFeels relevant given ${connection.context.toLowerCase()}.\n\nIf you're comfortable, would appreciate an intro — no pressure at all.\n\n\n\nBest`,
  "second-degree": (prospect, connection) => 
    `${connection.name.split(' ')[0]},\n\n${getIntroContext(prospect, connection)}\n\nGiven the connection, it seemed reasonable to reach out.\n\nNo pressure at all — just an observation from watching peers navigate this transition.\n\n\n\nBest`
}

function getOutreachContext(prospect) {
  if (prospect.event?.includes('Exit') || prospect.event?.includes('Acquired')) {
    return `Congratulations on the ${prospect.event}. Having navigated that transition myself, I know the coordination burden doesn't decrease—it shifts.\n\n`
  }
  if (prospect.event?.includes('IPO')) {
    return `Congratulations on the public milestone. Post-IPO, the personal dimension of operating a public company changes—one's time becomes the scarcest asset.\n\n`
  }
  if (prospect.event?.includes('Fund')) {
    return `With Fund ${prospect.event.match(/II|III|IV/)?.[0] || ''} deploying at scale, the signal-to-noise challenge compounds.\n\n`
  }
  if (prospect.event?.includes('Expansion') || prospect.event?.includes('Growth')) {
    return `Scaling ${prospect.company} brings coordination challenges that can't be solved with more tools.\n\n`
  }
  return `I've been building something quietly for principals operating at your level.\n\n`
}

function getIntroContext(prospect, connection) {
  const templates = [
    `Saw you're connected with ${prospect.name}. I've been building something quietly for founders operating at that level — focused on coordinating advisors, travel, and decision workflows post-scale.`,
    `Noticed your connection with ${prospect.name}. We've been operating quietly in the background for principals who've scaled beyond conventional solutions.`,
    `I see you have a relationship with ${prospect.name}. We're a private coordination layer for executives managing complex operational demands.`
  ]
  return templates[Math.floor(Math.random() * templates.length)]
}

export function outreachWriterAgent(prospect) {
  const directWriter = directOutreachTemplates[prospect.role] || directOutreachTemplates["CEO"]
  
  return {
    directMessage: directWriter(prospect),
    introMessage: introTemplates["warm intro"](
      prospect, 
      { name: prospect.bestPath?.name || "Connection", context: prospect.bestPath?.reason || "mutual connection" }
    )
  }
}

export function generateOutreach(prospects) {
  return prospects.map(prospect => ({
    ...prospect,
    ...outreachWriterAgent(prospect)
  }))
}