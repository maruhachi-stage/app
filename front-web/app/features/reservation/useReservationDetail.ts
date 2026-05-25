import { useState, useEffect } from "react"
import { useParams } from "react-router"
import { apiFetch, ApiError } from "~/shared/api/client"

type Seat = { row: string; col: number; ticketType: string; price: number }

export type ReservationDetail = {
  reservationCode: string
  status: string
  bookingType: "member" | "guest"
  canCancel: boolean
  movie: { title: string; thumbnailUrl: string | null }
  schedule: { startsAt: string; endsAt: string; screenName: string }
  seats: Seat[]
  totalPrice: number
  customer: { maskedEmail: string }
  qrCodeUrl: string | null
}

export function useReservationDetail() {
  const { reservationCode } = useParams<{ reservationCode: string }>()
  const [detail, setDetail] = useState<ReservationDetail | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelEmail, setCancelEmail] = useState("")
  const [cancelError, setCancelError] = useState("")
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  useEffect(() => {
    if (!reservationCode) return
    apiFetch<ReservationDetail>(`/reservations/${reservationCode.toUpperCase()}`)
      .then(setDetail)
      .catch(err => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true)
      })
  }, [reservationCode])

  async function handleCancel() {
    if (!detail) return
    if (detail.bookingType === "guest" && !cancelEmail.trim()) {
      setCancelError("ゲスト予約のキャンセルにはメールアドレス入力が必要です。")
      return
    }
    setCancelError("")
    setCancelling(true)
    try {
      const body = detail.bookingType === "guest"
        ? JSON.stringify({ email: cancelEmail.trim() })
        : undefined
      await apiFetch(`/reservations/${detail.reservationCode}/cancel`, {
        method: "POST",
        body,
      })
      setCancelled(true)
      setShowCancelModal(false)
      setDetail(prev => prev ? { ...prev, status: "cancelled", canCancel: false, qrCodeUrl: null } : prev)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "FORBIDDEN") {
          setCancelError("メールアドレスが一致しません。")
        } else if (err.code === "CANCELLATION_NOT_ALLOWED") {
          setCancelError("上映開始30分前以降はキャンセルできません。")
        } else if (err.code === "ALREADY_CANCELLED") {
          setCancelError("すでにキャンセル済みです。")
        } else {
          setCancelError(err.message)
        }
      } else {
        setCancelError("エラーが発生しました。再度お試しください。")
      }
    } finally {
      setCancelling(false)
    }
  }

  function closeCancelModal() {
    setShowCancelModal(false)
    setCancelError("")
    setCancelEmail("")
  }

  return {
    detail, notFound, cancelled,
    showCancelModal, setShowCancelModal, closeCancelModal,
    cancelEmail, setCancelEmail, cancelError,
    cancelling, handleCancel,
  }
}
