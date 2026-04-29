import { prospectResearchAgent } from './agents/prospectResearchAgent.js'
import { assignScores } from './agents/wealthSignalAgent.js'
import { inferPains } from './agents/painHypothesisAgent.js'
import { enrichWithReferrals } from './agents/referralIntelligenceAgent.js'
import { generateOutreach } from './agents/outreachWriterAgent.js'
import { attachBriefs, privateBriefAgent } from './agents/privateBriefAgent.js'

export { privateBriefAgent as generatePrivateBrief }
export async function runAcquisitionSwarm(query) {
  const stageTimings = {}
  const startTotal = Date.now()
  
  console.log('[Swarm] Initializing acquisition pipeline...')
  console.log(`[Swarm] Query: "${query}"`)
  
  // Stage 1: Prospect Research
  const stageStart = Date.now()
  let prospects = await prospectResearchAgent(query)
  stageTimings.research = Date.now() - stageStart
  console.log(`[Swarm] Research: ${prospects.length} prospects identified (${stageTimings.research}ms)`)
  
  // Stage 2: Wealth Signal Scoring
  const scoreStart = Date.now()
  prospects = assignScores(prospects)
  stageTimings.scoring = Date.now() - scoreStart
  console.log(`[Swarm] Scoring: scores assigned (${stageTimings.scoring}ms)`)
  
  // Stage 3: Pain Hypothesis
  const painStart = Date.now()
  prospects = inferPains(prospects)
  stageTimings.pain = Date.now() - painStart
  console.log(`[Swarm] Pain: pain inferred (${stageTimings.pain}ms)`)
  
  // Stage 4: Referral Intelligence
  const refStart = Date.now()
  prospects = enrichWithReferrals(prospects)
  stageTimings.referrals = Date.now() - refStart
  console.log(`[Swarm] Referrals: ${prospects[0]?.connections?.length || 0} connections mapped (${stageTimings.referrals}ms)`)
  
  // Stage 5: Outreach Generation
  const outreachStart = Date.now()
  prospects = generateOutreach(prospects)
  stageTimings.outreach = Date.now() - outreachStart
  console.log(`[Swarm] Outreach: drafts generated (${stageTimings.outreach}ms)`)
  
  // Stage 6: Private Briefs
  const briefStart = Date.now()
  prospects = attachBriefs(prospects)
  stageTimings.briefs = Date.now() - briefStart
  console.log(`[Swarm] Briefs: structured (${stageTimings.briefs}ms)`)
  
  // Sort by score
  prospects.sort((a, b) => (b.score || 0) - (a.score || 0))
  
  const totalTime = Date.now() - startTotal
  console.log(`[Swarm] Complete: ${prospects.length} prospects enriched (${totalTime}ms total)`)
  
  return {
    prospects,
    metadata: {
      query,
      totalFound: prospects.length,
      timings: stageTimings,
      completedAt: new Date().toISOString()
    }
  }
}