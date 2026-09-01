import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { apiFetch, ApiError } from "~/lib/api-client"

export type MemberReservation = {
  reservationCode: string
  status: "pending" | "confirmed" | "cancelled"
  totalPrice: number
  createdAt: string
  movieTitle: string
  thumbnailUrl: string | null
  startsAt: string
  endsAt: string
  screenName: string
}

export function useMemberReservations() {
  const navigate = useNavigate()
  const [reservations, setReservations] = useState<MemberReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch<{ items: MemberReservation[] }>("/members/reservations")
      .then(data => setReservations(data.items))
      .catch(err => {
        if (err instanceof ApiError && err.status === 401) {
          navigate("/login?redirect=/member/reservations", { replace: true })
          return
        }
        setError("予約情報の取得に失敗しました")
      })
      .finally(() => setLoading(false))
  }, [navigate])

  return { reservations, loading, error }
}
