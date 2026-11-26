/** Fisher–Yates shuffle returning a new array. */
export function shuffle<T>(a: readonly T[], rand: () => number = Math.random): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j]!, b[i]!]; }
  return b;
}

/** Shuffle a multiple-choice question's answers and remap the correct index. */
export function shuffleChoices<Q extends { choices: string[]; answer: number }>(q: Q, rand: () => number = Math.random): Q {
  const order = shuffle(q.choices.map((_, i) => i), rand);
  return { ...q, choices: order.map(i => q.choices[i]!), answer: order.indexOf(q.answer) };
}
