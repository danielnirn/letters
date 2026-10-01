import { type ReactNode, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BAD, GOLD, OK, font } from "../theme/colors";
import { he } from "../i18n/he";
import { Icon } from "./Art";

function parseExpr(expr: string): { a: string; op: string; b: string } | null {
  const m = expr.trim().match(/^(\d+)\s*([+\-×÷])\s*(\d+)$/);
  if (!m) return null;
  return { a: m[1], op: m[2], b: m[3] };
}

function why(expr: string, answer: string): string {
  const p = parseExpr(expr);
  if (!p) return `${expr} = ${answer}`;
  if (p.op === "+") return `מחברים ${p.a} ו-${p.b}: סופרים ${p.b} צעדים אחרי ${p.a} ומגיעים ל-${answer}.`;
  if (p.op === "-") return `חיסור: מ-${p.a} יורדים ${p.b} ומגיעים ל-${answer}.`;
  if (p.op === "×") return `כפל: ${p.a} פעמים ${p.b} זה ${answer}.`;
  return `חילוק: ${p.a} מחולק ל-${p.b} זה ${answer}.`;
}

export function FadeIn({
  resetKey,
  children,
}: {
  resetKey: string;
  children: ReactNode;
}) {
  const [opacity, setOpacity] = useState(0);
  useEffect(() => {
    setOpacity(0);
    const t0 = Date.now();
    const duration = 420;
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / duration);
      setOpacity(1 - (1 - p) * (1 - p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [resetKey]);

  return <View style={{ opacity, width: "100%", alignItems: "center" }}>{children}</View>;
}

/** Counting dots for small + / − so the child can see the answer. */
function Dots({ expr }: { expr: string }) {
  const p = parseExpr(expr);
  if (!p || (p.op !== "+" && p.op !== "-")) return null;
  const a = Number(p.a);
  const b = Number(p.b);
  if (p.op === "+" && a + b > 20) return null;
  if (p.op === "-" && (a > 20 || b > a)) return null;
  const dots =
    p.op === "+"
      ? [...Array(a).fill(MATH_BLUE), ...Array(b).fill(GOLD.base)]
      : [...Array(a - b).fill(MATH_BLUE), ...Array(b).fill("taken")];
  return (
    <View style={styles.dots}>
      {dots.map((d, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            d === "taken" ? { borderWidth: 2, borderColor: BAD.base, borderStyle: "dashed" } : { backgroundColor: d },
          ]}
        />
      ))}
    </View>
  );
}

export function MathErrorCard({
  expr,
  guess,
  answer,
  title = true,
}: {
  expr: string;
  guess: string;
  answer: string;
  title?: boolean;
}) {
  return (
    <FadeIn resetKey={`${expr}|${guess}|${answer}`}>
      <View style={styles.card}>
        {title ? (
          <View style={styles.titleRow}>
            <View style={styles.badge}>
              <Icon name="x" size={16} color="#fff" weight={3} />
            </View>
            <Text style={styles.title}>{he.wrongTitle}</Text>
          </View>
        ) : null}
        {guess ? (
          <Text style={styles.guess}>
            {expr} זה לא {guess}
          </Text>
        ) : null}
        <Text style={styles.eq}>
          {expr} = <Text style={styles.answer}>{answer}</Text>
        </Text>
        <Dots expr={expr} />
        <Text style={styles.why}>{why(expr, answer)}</Text>
      </View>
    </FadeIn>
  );
}

const MATH_BLUE = "#2F6FEB";

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 26,
    borderWidth: 3,
    borderColor: "#FFC2C9",
    borderBottomWidth: 6,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: "center",
    gap: 8,
  },
  titleRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BAD.base,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: BAD.deep, fontSize: 19, fontFamily: font.heavy },
  guess: { color: "#5B6785", fontFamily: font.bold, fontSize: 15, textAlign: "center" },
  eq: { color: "#1F2A44", fontSize: 30, fontFamily: font.black, textAlign: "center" },
  answer: { color: OK.lip },
  dots: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, maxWidth: 260 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  why: {
    color: "#5B6785",
    fontFamily: font.medium,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
