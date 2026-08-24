export function SeatLegend() {
  return (
    <div className="mb-6 flex flex-wrap justify-center gap-4 text-[11px] font-bold text-muted-foreground sm:gap-8">
      <span className="flex items-center gap-2">
        <span className="inline-block h-3 w-6 rounded-sm bg-white ring-1 ring-border" />空席
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block h-3 w-6 rounded-sm bg-primary" />選択中
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block h-3 w-6 rounded-sm bg-zinc-700" />予約済
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block h-3 w-6 rounded-sm bg-amber-400" />仮押さえ
      </span>
    </div>
  )
}
