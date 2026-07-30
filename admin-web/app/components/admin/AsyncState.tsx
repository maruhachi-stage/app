export function LoadingMessage() {
  return <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-500">管理情報を読み込み中です。</div>
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm font-bold text-rose-700"><p>{message}</p><button type="button" onClick={onRetry} className="mt-3 rounded bg-rose-600 px-3 py-2 text-white">再試行</button></div>
}
