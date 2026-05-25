import type { Theme } from "~/shared/lib/theme";

type Props = {
  theme: Theme;
  onToggle: () => void;
};

export function ThemeToggle({ theme, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-110 active:scale-95"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <span className="text-xl">
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
    </button>
  );
}
