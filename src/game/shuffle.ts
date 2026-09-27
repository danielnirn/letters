export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

export function shuffleDistinct(arr: string[]): string[] {
  if (arr.length <= 1) return arr.slice();
  const orig = arr.join("");
  let result: string[] = [];
  let attempts = 0;
  do {
    result = shuffle(arr);
    attempts++;
  } while (result.join("") === orig && attempts < 20);
  return result;
}
