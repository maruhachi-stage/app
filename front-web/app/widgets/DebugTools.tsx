import { ThemeToggle } from "~/shared/ui/ThemeToggle";
import type { Theme } from "~/shared/lib/theme";

// デバッグツールの表示フラグ (true: 表示, false: 非表示)
const SHOW_DEBUG_TOOLS = true;

type Props = {
  theme: Theme;
  toggleTheme: () => void;
};

export function DebugTools({ theme, toggleTheme }: Props) {
  if (!SHOW_DEBUG_TOOLS) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      {/* 他のデバッグツールをここに追加可能 */}
    </div>
  );
}
