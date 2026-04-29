export function clean(value, fallback = "") {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }

  return String(value).trim();
}

export function includesAny(value = "", terms = []) {
  const lower = clean(value).toLowerCase();
  return terms.some((term) => lower.includes(term));
}

export function firstName(name = "") {
  return clean(name, "there").split(/\s+/)[0] || "there";
}

export function asSentenceList(items = []) {
  return items.filter(Boolean).map((item) => clean(item)).filter(Boolean);
}

export function getPriority(score = 0, fallback = "low") {
  if (fallback === "high" || fallback === "medium" || fallback === "low") {
    return fallback;
  }

  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}

export function makeId(prefix = "item") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
