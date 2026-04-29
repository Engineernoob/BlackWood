const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY
const TAVILY_API_BASE = 'https://api.tavily.com'

const MOCK_PROSPECTS = [
  {
    name: "Marcus Ashford",
    role: "Founder & CEO",
    company: "MeridianPay",
    event: "Acquired 2025",
    signals: ["Fintech", "B2B Payments", "Series B → Exit"]
  },
  {
    name: "Elena Vasquez",
    role: "Managing Partner",
    company: "Aurora Capital",
    event: "Fund II Close",
    signals: ["Family Office", "Fund II", "Direct Investments"]
  },
  {
    name: "James Thornwell",
    role: "Chairman's Office",
    company: "Thornwell Holdings",
    event: "Penson Acquisition",
    signals: ["Legacy Finance", "Strategic Acquisition", "Family Office"]
  },
  {
    name: "Sarah Chen",
    role: "Founder",
    company: "Optic AI",
    event: "IPO 2025",
    signals: ["AI/ML", "Enterprise", "Public Company"]
  },
  {
    name: "David Reinholt",
    role: "Principal",
    company: "R Capital",
    event: "Portfolio Exit Q4",
    signals: ["Single Family Office", "Tech", "Active Investor"]
  },
  {
    name: "Victoria Sterling",
    role: "Managing Director",
    company: "Sterling Ventures",
    event: "Third Exit",
    signals: ["Venture", "Serial Entrepreneur", "LP Relationships"]
  },
  {
    name: "Michael Calder",
    role: "Chairman",
    company: "Calder Industries",
    event: "Strategic Review",
    signals: ["Industrial", "Multi-family", "Cross-border"]
  },
  {
    name: "Isabella Marquez",
    role: "CEO",
    company: "GlobalSource",
    event: "Expansion 2025",
    signals: ["Supply Chain", "Enterprise", "International Growth"]
  }
]

async function tavilySearch(query, options = {}) {
  if (!TAVILY_API_KEY) {
    return { results: [] }
  }
  
  try {
    const response = await fetch(`${TAVILY_API_BASE}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TAVILY_API_KEY}`
      },
      body: JSON.stringify({
        query,
        max_results: options.maxResults || 5,
        search_depth: options.searchDepth || 'advanced',
        include_answer: false,
        include_raw_content: false,
        include_images: false,
        ...options
      })
    })
    
    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('[Tavily] Search error:', error.message)
    return { results: [] }
  }
}

function parseSearchResult(result, query) {
  const title = result.title || ''
  const url = result.url || ''
  const content = result.content || ''
  
  const name = extractPersonName(title, content)
  const company = extractCompany(title, content)
  const event = extractEvent(title, content)
  const signals = extractSignals(title, content, url, query)
  
  return {
    name,
    role: signals.includes('Family Office') || signals.includes('Venture') ? 'Managing Partner' : 'Founder / CEO',
    company,
    event,
    signals,
    source: url
  }
}

function extractPersonName(title, content) {
  const text = title + ' ' + content
  
  const patterns = [
    /(?:CEO|Founder|Managing Partner|Chairman|Principal|COO)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s+(?:CEO|Founder)/,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is|was|leads|runs)/
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1] && match[1].length > 2) {
      return match[1]
    }
  }
  
  const words = text.split(/\s+/)
  for (let i = 0; i < words.length - 1; i++) {
    const word = words[i]
    if (word.match(/^[A-Z][a-z]+$/) && word.length > 2) {
      const next = words[i + 1]
      if (next && (next === 'CEO' || next === 'CEO' || next === 'founder' || next === 'Partner')) {
        return word + ' ' + next
      }
    }
  }
  
  const parts = title.split(/[-|,]/)
  if (parts[0]) {
    return parts[0].trim().split(' ').slice(0, 2).join(' ')
  }
  
  return 'Unnamed Executive'
}

function extractCompany(title, content) {
  const text = title + ' ' + content
  
  const companyPatterns = [
    /(?:at|from|via)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/,
    /-\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:Inc|LLC|Corp|Holdings|Ventures|Capital)/
  ]
  
  for (const pattern of companyPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) return match[1]
  }
  
  const domains = ['tech', 'capital', 'ventures', 'holdings', 'group', 'fund', 'Partners', 'Labs', 'AI', 'Systems']
  const words = text.split(/\s+/)
  for (const word of words) {
    for (const domain of domains) {
      if (word.toLowerCase().includes(domain.toLowerCase())) {
        return word
      }
    }
  }
  
  return 'Private Company'
}

function extractEvent(title, content) {
  const text = (title + ' ' + content).toLowerCase()
  
  if (text.includes('acquired') || text.includes('buyout')) return 'Acquired 2024-2025'
  if (text.includes('ipo') || text.includes('went public') || text.includes('nasdaq') || text.includes('nyse')) return 'IPO 2024-2025'
  if (text.includes('fund') && text.includes('close')) return 'Fund Close'
  if (text.includes('exit') || text.includes('liquidity')) return 'Exit'
  if (text.includes('series')) return 'Funding Round'
  if (text.includes('launch')) return 'Product Launch'
  if (text.includes('strategic') || text.includes('review')) return 'Strategic Review'
  
  return 'Active'
}

function extractSignals(title, content, url, query) {
  const signals = []
  const text = (title + ' ' + content + ' ' + url).toLowerCase()
  const queryLower = query.toLowerCase()
  
  if (text.includes('fintech') || text.includes('payments') || text.includes('banking') || text.includes('insurtech')) {
    signals.push('Fintech')
  }
  if (text.includes('ai') || text.includes('ml') || text.includes('machine learning') || text.includes('generative')) {
    signals.push('AI/ML')
  }
  if (text.includes('family office') || text.includes('wealth management') || text.includes('private wealth')) {
    signals.push('Family Office')
  }
  if (text.includes('venture') || text.includes('vc') || text.includes('investor')) {
    signals.push('Venture')
  }
  if (text.includes('enterprise') || text.includes('b2b') || text.includes('saas')) {
    signals.push('Enterprise')
  }
  if (text.includes('crypto') || text.includes('web3') || text.includes('blockchain')) {
    signals.push('Crypto/Web3')
  }
  if (text.includes('health') || text.includes('medtech') || text.includes('biotech')) {
    signals.push('HealthTech')
  }
  if (text.includes('climate') || text.includes('clean') || text.includes('energy')) {
    signals.push('CleanTech')
  }
  
  if (signals.length === 0) {
    if (queryLower.includes('fintech')) signals.push('Fintech')
    else if (queryLower.includes('family')) signals.push('Family Office')
    else if (queryLower.includes('ai') || queryLower.includes('ml')) signals.push('AI/ML')
    else signals.push('Technology')
  }
  
  return signals.slice(0, 3)
}

export async function prospectResearchAgent(query) {
  console.log('[Research] Processing query:', query)
  
  if (!TAVILY_API_KEY) {
    console.log('[Research] No API key, using mock data')
    return useMockData(query)
  }
  
  const searchQueries = generateSearchQueries(query)
  const allResults = []
  
  for (const searchQuery of searchQueries) {
    const response = await tavilySearch(searchQuery, { maxResults: 5 })
    
    if (response.results && response.results.length > 0) {
      allResults.push(...response.results)
    }
  }
  
  if (allResults.length === 0) {
    console.log('[Research] No results, using mock data')
    return useMockData(query)
  }
  
  const seen = new Set()
  const prospects = []
  
  for (const result of allResults) {
    if (!result.title || result.title.length < 5) continue
    if (seen.has(result.title)) continue
    seen.add(result.title)
    
    const prospect = parseSearchResult(result, query)
    if (prospect.name && prospect.name.length > 2) {
      prospects.push(prospect)
    }
    
    if (prospects.length >= 5) break
  }
  
  if (prospects.length === 0) {
    return useMockData(query)
  }
  
  console.log('[Research] Found', prospects.length, 'real prospects')
  return prospects
}

function generateSearchQueries(query) {
  const q = query.toLowerCase()
  const queries = []
  
  if (q.includes('exit') || q.includes('acquired')) {
    queries.push(`${query} founder CEO acquired 2024 2025`)
  } else if (q.includes('fund') || q.includes('capital')) {
    queries.push(`${query} managing partner fund close 2024`)
  } else if (q.includes('ipo') || q.includes('public')) {
    queries.push(`${query} founder CEO IPO 2024 2025`)
  } else {
    queries.push(`${query} founder CEO entrepreneur 2024`)
    queries.push(`${query} managing partner executive 2024`)
  }
  
  return queries.slice(0, 2)
}

function useMockData(query) {
  const q = query.toLowerCase()
  let results = MOCK_PROSPECTS.filter(p => 
    p.company.toLowerCase().includes(q) ||
    p.name.toLowerCase().includes(q) ||
    p.signals.some(s => s.toLowerCase().includes(q)) ||
    p.event.toLowerCase().includes(q)
  )
  
  if (results.length === 0) {
    results = [...MOCK_PROSPECTS]
  }
  
  return results.map(p => ({
    ...p,
    source: 'mock_data'
  }))
}

function generateId() {
  return `prospect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function runPipeline(query) {
  return prospectResearchAgent(query).then(prospects => 
    prospects.map(p => ({ ...p, id: generateId() }))
  )
}