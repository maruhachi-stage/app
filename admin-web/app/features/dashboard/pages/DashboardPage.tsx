import type { ReactNode } from 'react'
import { FiGrid, FiMonitor, FiRefreshCw } from 'react-icons/fi'
import { Link, useOutletContext } from 'react-router'
import { ErrorMessage, LoadingMessage } from '~/components/admin/AsyncState'
import type { AdminLayoutContext } from '~/components/admin/AdminLayout'
import { useDashboard } from '~/features/dashboard/hooks/useDashboard'
export function DashboardPage() {
    const { editKey, canEdit } = useOutletContext<AdminLayoutContext>()
    const { overview, loading, error, reload } = useDashboard(editKey)
    if (loading) return <LoadingMessage />
    if (error) return <ErrorMessage message={error} onRetry={reload} />
    if (!overview) return null
    const layouts = overview.screens.items.filter((x) => x.layoutId !== null).length
    return (
        <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
                <Metric
                    label="スクリーン"
                    value={`${overview.screens.total}館`}
                    detail={`${overview.screens.seats}席を設定`}
                    icon={<FiMonitor />}
                />
                <Metric
                    label="座席レイアウト"
                    value={`${layouts}件`}
                    detail="公開中レイアウト"
                    icon={<FiGrid />}
                />
                <Metric
                    label="編集権限"
                    value={canEdit ? '許可' : '未許可'}
                    detail={canEdit ? '編集APIを利用できます' : '編集キーを入力してください'}
                    icon={<FiRefreshCw />}
                />
            </div>
            <section className="rounded-lg border border-admin-border bg-admin-surface p-5 shadow-sm">
                <h3 className="text-lg font-black">座席レイアウト管理</h3>
                <p className="mt-1 text-sm font-bold text-admin-muted-foreground">
                    スクリーンごとの座席レイアウトを確認できます。編集機能はまだ提供していません。
                </p>
                <Link
                    to="/seat-layouts"
                    className="mt-4 inline-flex h-10 items-center rounded-lg bg-admin-accent px-4 text-sm font-black text-admin-accent-foreground hover:bg-admin-accent-hover"
                >
                    座席レイアウトを開く
                </Link>
            </section>
            <button
                type="button"
                onClick={reload}
                className="inline-flex items-center gap-2 rounded-lg border border-admin-border bg-admin-surface px-4 py-2 text-sm font-black text-admin-muted-foreground"
            >
                <FiRefreshCw />
                最新状態に更新
            </button>
        </div>
    )
}
function Metric({
    label,
    value,
    detail,
    icon,
}: {
    label: string
    value: string
    detail: string
    icon: ReactNode
}) {
    return (
        <section className="rounded-lg border border-admin-border bg-admin-surface p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-black tracking-wider text-admin-muted-foreground">
                        {label}
                    </p>
                    <p className="mt-3 text-3xl font-black">{value}</p>
                    <p className="mt-2 text-sm font-bold text-admin-muted-foreground">{detail}</p>
                </div>
                <span className="grid size-10 place-items-center rounded-lg bg-admin-muted text-admin-accent">
                    {icon}
                </span>
            </div>
        </section>
    )
}
