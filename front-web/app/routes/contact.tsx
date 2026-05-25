import type { Route } from "./+types/contact"
import { Button } from "~/shared/ui/Button"
import { Input } from "~/shared/ui/Input"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "お問い合わせ | HALシネマ" },
    { name: "description", content: "HALシネマへのお問い合わせ" },
  ]
}

export default function Contact() {
  return (
    <div className="py-16 max-w-2xl mx-auto">
      <h1 className="text-3xl font-black mb-8">お問い合わせ</h1>
      
      <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          サービスに関するご意見・ご質問がございましたら、以下のフォームよりお問い合わせください。
          通常、3営業日以内にご回答させていただきます。
        </p>

        <form className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold">お名前</label>
            <Input placeholder="山田 太郎" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">メールアドレス</label>
            <Input type="email" placeholder="example@hal-cinema.jp" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">お問い合わせ内容</label>
            <textarea 
              className="w-full min-h-[150px] rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="ご自由にご記入ください"
            />
          </div>

          <Button variant="primary" className="w-full font-bold py-6">
            送信する
          </Button>
        </form>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-border bg-card/50">
          <h2 className="font-bold mb-2">お電話でのお問い合わせ</h2>
          <p className="text-2xl font-black text-primary">03-XXXX-XXXX</p>
          <p className="text-xs text-muted-foreground mt-2">受付時間: 10:00 - 20:00</p>
        </div>
        <div className="p-6 rounded-xl border border-border bg-card/50">
          <h2 className="font-bold mb-2">よくあるご質問</h2>
          <p className="text-sm text-muted-foreground">
            予約のキャンセルや、会員登録に関するFAQはこちらをご確認ください。
          </p>
          <Button variant="ghost" size="sm" className="mt-4 font-bold p-0 h-auto hover:bg-transparent text-primary underline-offset-4 hover:underline">
            FAQを見る
          </Button>
        </div>
      </div>
    </div>
  )
}
