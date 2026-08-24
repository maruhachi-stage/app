import type { ThemeMode } from "~/hooks/useThemeMode"

export function ThemeModeSelect({ mode, onChange }: { mode: ThemeMode; onChange: (mode: ThemeMode) => void }) {
  return <label className="flex h-10 items-center rounded-lg border border-border bg-surface px-2 text-xs font-black text-muted-foreground"><span className="sr-only">テーマ</span><select value={mode} onChange={event => onChange(event.target.value as ThemeMode)} className="bg-transparent outline-none"><option value="system">システム</option><option value="light">ライト</option><option value="dark">ダーク</option></select></label>
}
