import {Button} from "~/components/Button"
import {Input} from "~/components/Input"
import {useLookup} from "~/features/reservation/useLookup"

export default function LookupPage() {
    const {code, setCode, loading, error, handleSubmit} = useLookup()

    return (
        <div className="py-12 max-w-md mx-auto">
            <h1 className="mb-2 text-2xl font-bold">予約確認</h1>
            <p className="mb-6 text-sm text-gray-500">予約番号を入力して予約内容を確認できます。</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input id="code" label="予約番号" value={code}
                       onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12))}
                       placeholder="例：ABCD1234" autoComplete="off"/>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" size="lg" disabled={loading}>
                    {loading ? "検索中..." : "予約を確認する"}
                </Button>
            </form>
        </div>
    )
}
