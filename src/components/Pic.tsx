import { useState } from "react";
import { Text, View, type TextStyle } from "react-native";
import { SvgXml } from "react-native-svg";
import { PICS } from "../game/pics";

/** Bundled illustration for an emoji; falls back to the emoji glyph while a picture is missing. */
export function Pic({ emoji, size }: { emoji: string; size: number }) {
  const xml = PICS[emoji.replace(/️/g, "")];
  if (xml) {
    return (
      <View style={{ width: size, height: size }}>
        <SvgXml xml={xml} width={size} height={size} />
      </View>
    );
  }
  return <Text style={{ fontSize: size * 0.83, lineHeight: size * 1.0 }}>{emoji}</Text>;
}

type Token = { pic: string } | { text: string };

const MAX_KEY = Math.max(...Object.keys(PICS).map((k) => k.length));

/** Split a line into bundled pictures and plain text (numbers, shapes, unmapped emoji). */
function tokenize(line: string): Token[] {
  const out: Token[] = [];
  let text = "";
  let i = 0;
  while (i < line.length) {
    let hit = 0;
    for (let len = Math.min(MAX_KEY + 2, line.length - i); len > 0; len--) {
      if (PICS[line.slice(i, i + len).replace(/️/g, "")]) {
        hit = len;
        break;
      }
    }
    if (!hit) {
      text += line[i];
      i++;
      continue;
    }
    if (text) out.push({ text });
    text = "";
    out.push({ pic: line.slice(i, i + hit) });
    i += hit;
    while (line[i] === "️") i++;
  }
  if (text) out.push({ text });
  return out;
}

/**
 * Emoji text (logic sequences, science combos) drawn with bundled pictures.
 * Pictures shrink so the widest line fits; lines read left → right like the original string.
 */
export function PicText({ text, size, textStyle }: { text: string; size: number; textStyle?: TextStyle }) {
  const [width, setWidth] = useState(0);
  const lines = text.split("\n").map(tokenize);
  const fontSize = textStyle?.fontSize ?? size * 0.75;
  const gap = 4;
  let pic = size;
  if (width > 0) {
    for (const line of lines) {
      const pics = line.filter((t) => "pic" in t).length;
      if (!pics) continue;
      const chars = line.reduce((n, t) => n + ("text" in t ? t.text.length : 0), 0);
      const room = width - chars * fontSize * 0.55 - (line.length - 1) * gap;
      pic = Math.min(pic, Math.floor(room / pics));
    }
    pic = Math.max(pic, 20);
  }
  return (
    <View style={{ width: "100%", alignItems: "center" }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {lines.map((line, li) => (
        <View key={li} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap, marginVertical: 2 }}>
          {line.map((t, ti) =>
            "pic" in t ? (
              <Pic key={ti} emoji={t.pic} size={pic} />
            ) : (
              <Text key={ti} style={textStyle}>
                {t.text}
              </Text>
            ),
          )}
        </View>
      ))}
    </View>
  );
}
