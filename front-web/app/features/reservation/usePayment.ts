import { useState } from "react"
import { useReservationFlow } from "~/processes/reservation-flow/context"

export function usePayment() {
  const { setPaymentCard } = useReservationFlow()
  const [cardNo, setCardNo] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [errors, setErrors] = useState<{ cardNo?: string; expiry?: string; cvv?: string }>({})

  function submit(): boolean {
    // const next: typeof errors = {}
    // if (cardNo.replace(/\s/g, "").length !== 16) next.cardNo = "カード番号は16桁で入力してください"
    // if (!/^\d{2}\/\d{2}$/.test(expiry)) next.expiry = "有効期限は MM/YY の形式で入力してください"
    // if (cvv.length !== 3) next.cvv = "セキュリティコードは3桁で入力してください"
    // setErrors(next)
    // if (Object.keys(next).length > 0) return false
    setPaymentCard({ cardNo, expiry, cvv })
    return true
  }

  return { cardNo, setCardNo, expiry, setExpiry, cvv, setCvv, errors, submit }
}
