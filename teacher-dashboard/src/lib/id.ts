let counter = 0;

/** Deterministic-ish, dependency-free id generator for mock data & client-created records. */
export function makeId(prefix = "id"): string {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${rand}${counter.toString(36)}`;
}
