import { useState, useEffect } from "react"
import { apiFetch } from "~/shared/api/client"
import { useReservationFlow } from "~/processes/reservation-flow/context"
import type { TicketType } from "~/entities/ticket"
import type { SelectedSeat } from "~/entities/reservation/draft"

export function useTicketSelection() {
  const { state, setTickets } = useReservationFlow()
  const [seats, setSeats] = useState<SelectedSeat[]>(state.selectedSeats ?? [])
  const [totalPrice, setTotalPrice] = useState(0)
  const [quoting, setQuoting] = useState(false)

  useEffect(() => {
    if (!state.scheduleId || seats.length === 0) return

    const counts = countByType(seats)
    setQuoting(true)
    apiFetch<{ totalPrice: number }>("/reservations/quote", {
      method: "POST",
      body: JSON.stringify({ scheduleId: state.scheduleId, ticketCounts: counts }),
    })
      .then(d => setTotalPrice(d.totalPrice))
      .catch(() => {})
      .finally(() => setQuoting(false))
  }, [seats])

  function updateSeatTicketType(seatId: number, type: TicketType) {
    setSeats(prev => prev.map(s => s.seatId === seatId ? { ...s, ticketType: type } : s))
  }

  function submit() {
    setTickets(seats, countByType(seats), totalPrice)
  }

  return { seats, totalPrice, quoting, updateSeatTicketType, submit }
}

function countByType(seats: SelectedSeat[]) {
  const counts = { general: 0, university: 0, highschool: 0, child: 0 }
  seats.forEach(s => { counts[s.ticketType as keyof typeof counts]++ })
  return counts
}
