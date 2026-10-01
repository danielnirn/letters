import { questionsInStage, type Difficulty } from "./config";
import { shuffle } from "./shuffle";
import type { Word } from "./words";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeProblem(left: number, op: "+" | "-" | "×" | "÷", right: number, result: number): Word {
  return { word: String(result), emoji: `${left} ${op} ${right}` };
}

function uniqueProblems(make: () => Word, count: number): Word[] {
  const seen = new Set<string>();
  const out: Word[] = [];
  let guard = 0;
  while (out.length < count && guard < count * 20) {
    guard++;
    const p = make();
    const key = `${p.emoji}=${p.word}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

function easyProblem(): Word {
  if (Math.random() < 0.55) {
    const a = rand(1, 9);
    const b = rand(1, 9);
    return makeProblem(a, "+", b, a + b);
  }
  const a = rand(1, 10);
  const b = rand(0, a);
  return makeProblem(a, "-", b, a - b);
}

function midProblem(): Word {
  const roll = Math.random();
  if (roll < 0.4) {
    const a = rand(8, 20);
    const b = rand(1, 15);
    return makeProblem(a, "+", b, a + b);
  }
  if (roll < 0.75) {
    const a = rand(10, 30);
    const b = rand(1, a);
    return makeProblem(a, "-", b, a - b);
  }
  const a = rand(2, 6);
  const b = rand(2, 9);
  return makeProblem(a, "×", b, a * b);
}

function hardProblem(): Word {
  const roll = Math.random();
  if (roll < 0.45) {
    const a = rand(3, 10);
    const b = rand(3, 10);
    return makeProblem(a, "×", b, a * b);
  }
  if (roll < 0.75) {
    const b = rand(2, 9);
    const result = rand(2, 9);
    return makeProblem(b * result, "÷", b, result);
  }
  const a = rand(15, 40);
  const b = rand(10, 30);
  return makeProblem(a, "+", b, a + b);
}

export function generateMathList(level: Difficulty, count = questionsInStage(1)): Word[] {
  if (level === "easy") return shuffle(uniqueProblems(easyProblem, count));
  if (level === "mid") return shuffle(uniqueProblems(midProblem, count));
  return shuffle(uniqueProblems(hardProblem, count));
}
