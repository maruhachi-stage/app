import { FiEdit3, FiGrid, FiRefreshCw } from "react-icons/fi"
import { ErrorMessage, LoadingMessage } from "~/components/admin/AsyncState"
import { useSeatLayouts } from "~/features/seat-layouts/hooks/useSeatLayouts"
import type { StaffScreen } from "~/types/staff"

const sizes: Record<StaffScreen["size"], string> = { large: "大", medium: "中", small: "小" }

export function SeatLayoutsPage() {
  const { screens, loading, error, reload } = useSeatLayouts()
  if (loading) return <LoadingMessage />
  if (error) return <ErrorMessage message={error} onRetry={reload} />
  return <section className="overflow-hidden rounded-lg border border-admin-border bg-admin-surface shadow-sm"><header className="flex flex-col gap-3 border-b border-admin-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-lg font-black">スクリーン / 座席レイアウト</h3><p className="mt-1 text-sm font-bold text-admin-muted-foreground">スクリーンごとの座席レイアウトを確認します。</p></div><button type="button" onClick={reload} className="h-10 rounded-lg border border-admin-border px-4 text-sm font-black text-admin-muted-foreground"><FiRefreshCw className="inline" /> 更新</button></header><div className="divide-y divide-admin-border">{screens.length === 0 ? <p className="px-5 py-8 text-sm font-bold text-admin-muted-foreground">スクリーンが登録されていません。</p> : screens.map(screen => <Row key={screen.id} screen={screen} />)}</div></section>
}

function Row({ screen }: { screen: StaffScreen }) { return <div className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div className="flex gap-3"><span className="grid size-9 place-items-center rounded-lg bg-admin-muted text-admin-muted-foreground"><FiGrid /></span><div><p className="font-black">{screen.name} <span className="ml-2 text-xs text-admin-muted-foreground">{sizes[screen.size]}サイズ</span></p><p className="mt-1 text-xs font-bold text-admin-muted-foreground">座席 {screen.seatCount}/{screen.totalSeats} / 比率 {screen.aspectRatio ?? "-"} / Layout ID {screen.layoutId ?? "-"}</p></div></div><button type="button" disabled className="h-10 rounded-lg border border-admin-border px-4 text-sm font-black text-admin-muted-foreground disabled:opacity-40"><FiEdit3 className="inline" /> 編集準備中</button></div> }
