import type { CSSProperties } from "react"
import type { LayoutObjectData } from "~/features/reservation/domain/seat-layout"

export function LayoutObjectLayer({ objects }: { objects: LayoutObjectData[] }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {objects.map(object => (
        <LayoutObject key={`${object.type}-${object.code}-${object.id}`} object={object} />
      ))}
    </div>
  )
}

function LayoutObject({ object }: { object: LayoutObjectData }) {
  const baseStyle: CSSProperties = {
    left: `${object.leftPct}%`,
    top: `${object.topPct}%`,
    width: `${object.widthPct}%`,
    height: `${object.heightPct}%`,
    transform: `rotate(${object.rotationDeg}deg)`,
    zIndex: object.zIndex,
  }

  if (object.type === "screen") {
    return (
      <div
        className="absolute flex items-center justify-center rounded-full bg-linear-to-r from-transparent via-white/40 to-transparent text-[8px] font-black tracking-[0.45em] text-muted-foreground/70"
        style={baseStyle}
      >
        {object.label ?? "SCREEN"}
      </div>
    )
  }

  if (object.type === "entrance") {
    return (
      <div
        className="absolute flex items-center justify-center rounded-sm border border-border/40 bg-muted/20 text-[8px] font-black tracking-[0.35em] text-muted-foreground/60"
        style={baseStyle}
      >
        {object.label ?? "ENTRANCE"}
      </div>
    )
  }

  if (object.type === "label") {
    return (
      <div
        className="absolute flex items-center justify-center text-[9px] font-bold text-muted-foreground/70"
        style={baseStyle}
      >
        {object.label}
      </div>
    )
  }

  return (
    <div
      className="absolute rounded-sm border border-border/30 bg-muted/15"
      style={baseStyle}
      aria-label={object.label ?? object.code}
    />
  )
}
