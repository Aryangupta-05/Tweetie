export function searchFilter(value) {
  if (typeof value !== "string" || value.trim().length < 2 || value.trim().length > 80) return null;
  const query = value.trim();
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { query, post: query.startsWith("#") ? new RegExp(`(^|\\s)${escaped}(?![\\p{L}\\p{N}_])`, "iu") : new RegExp(escaped, "i"), person: new RegExp(escaped, "i") };
}
