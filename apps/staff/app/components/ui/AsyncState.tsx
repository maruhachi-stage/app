export function LoadingMessage() {
    return (
        <div className="rounded-lg border border-admin-border bg-admin-surface p-10 text-center text-sm font-bold text-admin-muted-foreground">
            管理情報を読み込み中です。
        </div>
    )
}
export function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="rounded-lg border border-admin-danger bg-admin-muted p-5 text-sm font-bold text-admin-danger">
            <p>{message}</p>
            <button
                type="button"
                onClick={onRetry}
                className="mt-3 rounded bg-admin-accent px-3 py-2 text-admin-accent-foreground"
            >
                再試行
            </button>
        </div>
    )
}
