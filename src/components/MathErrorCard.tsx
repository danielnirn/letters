import { type ReactNode, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

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

export function MathErrorCard({
  expr,
  guess,
  answer,
}: {
  expr: string;
  guess: string;
  answer: string;
}) {
  return (
    <FadeIn resetKey={`${expr}|${guess}|${answer}`}>
      <View style={styles.card}>
        <Text style={styles.title}>לא נכון הפעם</Text>
        {guess ? (
          <Text style={styles.guess}>
            {expr} זה לא {guess}
          </Text>
        ) : null}
        <Text style={styles.eq}>
          {expr} = {answer}
        </Text>
        <Text style={styles.why}>{why(expr, answer)}</Text>
      </View>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "#f3b4b4",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  title: { color: "#5c2b2b", fontSize: 18, fontFamily: "Heebo_800ExtraBold" },
  guess: { color: "#5c2b2b", fontFamily: "Heebo_700Bold", marginTop: 4, fontSize: 15, textAlign: "center" },
  eq: {
    color: "#5c2b2b",
    fontSize: 24,
    fontFamily: "Heebo_900Black",
    marginTop: 6,
  },
  why: {
    color: "#5c2b2b",
    fontFamily: "Heebo_700Bold",
    marginTop: 8,
    fontSize: 15,
    textAlign: "center",
  },
});
