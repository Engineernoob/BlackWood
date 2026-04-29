export function prospectRankingAgent(prospects = [], limit = 5) {
  return [...prospects]
    .sort((a, b) => Number(b.fit_score || 0) - Number(a.fit_score || 0))
    .slice(0, limit)
    .map((prospect, index) => ({
      ...prospect,
      rank: index + 1,
      status: prospect.status === "new" ? "ranked" : prospect.status,
    }));
}
