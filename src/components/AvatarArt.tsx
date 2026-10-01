import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import { composeAvatar, FULL_VIEWBOX, HEAD_VIEWBOX, itemThumb, type Shape } from "../game/avatarArt";
import type { AvatarLoadout, AvatarSlot, Gender } from "../types/models";

function Shapes({ shapes }: { shapes: Shape[] }) {
  return (
    <>
      {shapes.map((s, i) => {
        const paint = {
          fill: s.f,
          stroke: s.s,
          strokeWidth: s.sw,
          opacity: s.o,
          strokeLinecap: "round" as const,
          strokeLinejoin: "round" as const,
        };
        if (s.k === "c") return <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} {...paint} />;
        if (s.k === "e") return <Ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} {...paint} />;
        if (s.k === "r") return <Rect key={i} x={s.x} y={s.y} width={s.wd} height={s.ht} rx={s.rx} {...paint} />;
        return <Path key={i} d={s.d} {...paint} />;
      })}
    </>
  );
}

/** A dressed character. `head` crops to the face (for small round badges). */
export function AvatarFigure({
  loadout,
  gender,
  height,
  head = false,
}: {
  loadout: AvatarLoadout;
  gender: Gender;
  height: number;
  head?: boolean;
}) {
  const ratio = head ? 1 : 160 / 234;
  return (
    <Svg width={height * ratio} height={height} viewBox={head ? HEAD_VIEWBOX : FULL_VIEWBOX}>
      <Shapes shapes={composeAvatar(loadout, gender)} />
    </Svg>
  );
}

/** One shop item drawn on its own, for a card thumbnail. */
export function ItemThumb({ id, slot, gender, size }: { id: string; slot: AvatarSlot; gender: Gender; size: number }) {
  const { shapes, viewBox } = itemThumb(id, slot, gender);
  return (
    <Svg width={size} height={size} viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
      <Shapes shapes={shapes} />
    </Svg>
  );
}
