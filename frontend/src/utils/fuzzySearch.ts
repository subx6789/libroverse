/**
 * Fuzzy Search & Spell Correction Utility using Dynamic Programming (Levenshtein Distance)
 * Time Complexity: O(M * N) per word comparison (DP Matrix)
 * Space Complexity: O(min(M, N)) with 1D row memory optimization
 *
 * Classic LeetCode 72 (Edit Distance) pattern used in search engines for "Did you mean?" suggestions.
 */

/**
 * Computes Levenshtein edit distance between two strings
 * (Number of single-character insertions, deletions, or substitutions)
 */
export function computeLevenshteinDistance(a: string, b: string): number {
  const str1 = a.toLowerCase().trim();
  const str2 = b.toLowerCase().trim();

  if (str1 === str2) return 0;
  if (!str1.length) return str2.length;
  if (!str2.length) return str1.length;

  const row = Array.from({ length: str2.length + 1 }, (_, i) => i);

  for (let i = 1; i <= str1.length; i++) {
    let prev = row[0];
    row[0] = i;

    for (let j = 1; j <= str2.length; j++) {
      const temp = row[j];
      if (str1[i - 1] === str2[j - 1]) {
        row[j] = prev;
      } else {
        // Minimum of: insertion (row[j-1]), deletion (row[j]), substitution (prev) + 1
        row[j] = 1 + Math.min(row[j - 1], row[j], prev);
      }
      prev = temp;
    }
  }

  return row[str2.length];
}

/**
 * Finds the closest matching dictionary term if edit distance is within allowed threshold
 */
export function findFuzzySuggestion(
  query: string,
  candidates: string[],
  maxDistance: number = 3
): string | null {
  const cleanQuery = query.toLowerCase().trim().replace(/([a-z])\1{2,}/g, '$1$1'); // Collapse 3+ repeated characters e.g. "jaavvaaaa" -> "jaavvaa"
  if (cleanQuery.length < 3) return null;

  let closestMatch: string | null = null;
  let minDistance = Infinity;

  // Split candidates into full strings and individual words (e.g., "Java: The Complete Reference" -> "Java", "Complete", "Reference")
  const searchEntries: { original: string; term: string }[] = [];
  for (const candidate of candidates) {
    if (!candidate) continue;
    searchEntries.push({ original: candidate, term: candidate.toLowerCase().trim() });
    
    // Add individual words if candidate is a multi-word phrase
    const words = candidate.split(/[\s:,-]+/).filter((w) => w.trim().length >= 3);
    for (const word of words) {
      searchEntries.push({ original: candidate, term: word.toLowerCase().trim() });
    }
  }

  const allowedDistance = Math.min(maxDistance, Math.max(1, Math.floor(cleanQuery.length / 2)));

  for (const entry of searchEntries) {
    const cleanCandidate = entry.term;

    // If exact or already substring, no typo suggestion needed
    if (cleanCandidate === cleanQuery || cleanCandidate.includes(cleanQuery)) {
      continue;
    }

    const distance = computeLevenshteinDistance(cleanQuery, cleanCandidate);

    if (distance <= allowedDistance && distance < minDistance) {
      minDistance = distance;
      closestMatch = entry.original;
    }
  }

  return closestMatch;
}
