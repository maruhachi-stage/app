import { useRef, useEffect } from "react"

export type DayInfo = {
  iso: string;
  label: string;
};

type Props = {
  days: DayInfo[];
  selectedDate: string;
  onSelect: (iso: string) => void;
};

export function DateSelector({ days, selectedDate, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    const container = scrollRef.current
    const barEl = barRef.current
    if (!container || !barEl) return

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container
      barEl.style.width = `${(clientWidth / scrollWidth) * 100}%`
      barEl.style.marginLeft = `${(scrollLeft / scrollWidth) * 100}%`
    }

    update()
    container.addEventListener("scroll", update, { passive: true })
    return () => container.removeEventListener("scroll", update)
  }, [])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const idx = days.findIndex(d => d.iso === selectedDate)
    if (idx < 0) return
    const items = container.querySelectorAll<HTMLElement>("[data-day-item]")
    const item = items[idx]
    if (!item) return
    const paddingLeft = parseInt(window.getComputedStyle(container).paddingLeft) || 0
    container.scrollTo({
      left: item.offsetLeft - paddingLeft,
      behavior: isFirstRender.current ? "instant" : "smooth",
    })
    isFirstRender.current = false
  }, [selectedDate, days])

  return (
    <>
      {/* モバイル: -mx-4 で親パディングを突き破り画面端まで広げる */}
      <div className="mb-8 sm:hidden -mx-4">
        <div
          ref={scrollRef}
          className="flex overflow-x-scroll snap-x snap-mandatory gap-2 pl-4 scroll-pl-4 touch-pan-x overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {days.map((day, index) => {
            const isActive = selectedDate === day.iso
            const labelText = index === 0 ? "今日" : index === 1 ? "明日" : ""
            const dateObj = new Date(day.iso)
            const dayNum = dateObj.getDate()
            const weekDay = dateObj.toLocaleDateString("ja-JP", { weekday: "short" })

            return (
              <div
                key={day.iso}
                data-day-item
                role="button"
                tabIndex={-1}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => onSelect(day.iso)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(day.iso) }}
                className={`snap-start shrink-0 w-1/3 flex flex-col items-center rounded-lg py-3 cursor-pointer select-none transition-all ${
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted/40 hover:bg-muted"
                }`}
              >
                <span className={`text-[10px] font-bold ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {labelText || " "}
                </span>
                <span className={`text-xl font-black ${isActive ? "text-primary-foreground" : "text-foreground"}`}>
                  {dayNum}
                </span>
                <span className={`text-[10px] font-bold ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  ({weekDay})
                </span>
              </div>
            )
          })}
        </div>

        {/* インジケーターバー: 幅1/3・中央寄せ */}
        <div className="mt-2 flex justify-center">
          <div className="w-1/3 h-1 rounded-full bg-muted overflow-hidden">
            <div ref={barRef} className="h-full rounded-full bg-primary/60" />
          </div>
        </div>
      </div>

      {/* PC: 全件横並び（変更なし） */}
      <div className="mb-8 hidden sm:flex gap-3 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {days.map((day, index) => {
          const isActive = selectedDate === day.iso
          const labelText = index === 0 ? "今日" : index === 1 ? "明日" : ""
          const dateObj = new Date(day.iso)
          const dayNum = dateObj.getDate()
          const weekDay = dateObj.toLocaleDateString("ja-JP", { weekday: "short" })

          return (
            <button
              key={day.iso}
              onClick={() => onSelect(day.iso)}
              className={`flex w-full flex-col items-center rounded-lg py-3 transition-all ${
                isActive ? "bg-primary text-primary-foreground" : "bg-muted/40 hover:bg-muted"
              }`}
            >
              <span className={`text-[10px] font-bold ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {labelText || "　"}
              </span>
              <span className={`text-xl font-black ${isActive ? "text-primary-foreground" : "text-foreground"}`}>
                {dayNum}
              </span>
              <span className={`text-[10px] font-bold ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                ({weekDay})
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}
