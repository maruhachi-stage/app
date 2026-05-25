import { useState } from "react"
import { useReservationFlow } from "~/processes/reservation-flow/context"

export function useCustomerForm() {
  const { state, setCustomer } = useReservationFlow()
  const [email, setEmail] = useState(state.customer?.email ?? "")
  const [errors, setErrors] = useState<{ email?: string }>({})

  function validate() {
    const errs: { email?: string } = {}
    if (!email.trim()) errs.email = "メールアドレスを入力してください"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "正しいメールアドレスを入力してください"
    else if (email.length > 254) errs.email = "254文字以内で入力してください"
    return errs
  }

  function submit(): boolean {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return false }
    setCustomer({ email: email.trim() })
    return true
  }

  return { email, setEmail, errors, submit }
}
