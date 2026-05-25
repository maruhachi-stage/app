import { useState, useEffect } from "react"

type ReservationResult = {
  reservationId: number
  reservationCode: string
  totalPrice: number
  qrCodeUrl: string
}

const COMPLETE_KEY = "hal_cinema_last_reservation"

export function useComplete() {
  const [result, setResult] = useState<ReservationResult | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem(COMPLETE_KEY)
    if (raw) {
      setResult(JSON.parse(raw) as ReservationResult)
      sessionStorage.removeItem(COMPLETE_KEY)
    }
  }, [])

  return { result }
}
