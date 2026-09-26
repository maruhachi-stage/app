import { and, asc, eq, gt, inArray, lte, ne, or } from 'drizzle-orm'
import { db } from '#infrastructure/database/sqlite.js'
import {
  images,
  reservationSeats,
  reservations,
  schedules,
  screenSeatLayouts,
  screenings,
  screens,
  seats,
} from '#infrastructure/database/schema.js'
import { AppError } from '#domain/errors/appError.js'
import type {
  ReservationRepository,
  ReservationDetail,
} from '#domain/interfaces/repositories/reservation-repository.js'
import type {
  BookingType,
  Reservation,
  SeatLayout,
  SeatPosition,
  TicketType,
} from '#domain/entities/reservation.js'

const ticketPrices: Record<TicketType, number> = {
  general: 1800,
  university: 1600,
  highschool: 1400,
  child: 1000,
}

export class DrizzleReservationRepository implements ReservationRepository {
  async findPublicSchedule(id: number) {
    const [row] = await db
      .select({
        screenId: schedules.screenId,
        title: screenings.title,
        startsAt: schedules.startsAt,
        endsAt: schedules.endsAt,
        screenName: screens.name,
      })
      .from(schedules)
      .innerJoin(screenings, eq(screenings.id, schedules.screeningId))
      .innerJoin(screens, eq(screens.id, schedules.screenId))
      .where(and(eq(schedules.id, id), eq(schedules.isPublic, true)))
    return row
      ? {
          screenId: row.screenId,
          title: row.title,
          startsAt: row.startsAt,
          endsAt: row.endsAt,
          screenName: row.screenName,
        }
      : null
  }

  async findLayout(screenId: number): Promise<SeatLayout | null> {
    const [row] = await db
      .select()
      .from(screenSeatLayouts)
      .where(eq(screenSeatLayouts.screenId, screenId))
    return row
      ? {
          id: row.id,
          version: row.layoutVersion,
          backgroundImageUrl: row.backgroundImageUrl,
          aspectRatioWidth: row.aspectRatioWidth,
          aspectRatioHeight: row.aspectRatioHeight,
        }
      : null
  }

  async findSeats(scheduleId: number, screenId: number): Promise<SeatPosition[]> {
    const now = new Date()
    const rows = await db
      .select({
        seatId: seats.id,
        row: seats.rowLabel,
        col: seats.colNo,
        topPct: seats.positionTopPct,
        leftPct: seats.positionLeftPct,
        widthPct: seats.seatWidthPct,
        heightPct: seats.seatHeightPct,
        hitRadiusPct: seats.hitRadiusPct,
        reservationStatus: reservations.status,
      })
      .from(seats)
      .leftJoin(
        reservationSeats,
        and(eq(reservationSeats.scheduleId, scheduleId), eq(reservationSeats.seatId, seats.id)),
      )
      .leftJoin(
        reservations,
        and(
          eq(reservations.id, reservationSeats.reservationId),
          or(
            eq(reservations.status, 'confirmed'),
            and(eq(reservations.status, 'pending'), gt(reservations.expiresAt, now)),
          ),
        ),
      )
      .where(eq(seats.screenId, screenId))
      .orderBy(asc(seats.rowLabel), asc(seats.colNo))
    return rows.map((row) => ({
      seatId: row.seatId,
      row: row.row,
      col: row.col,
      topPct: Number(row.topPct),
      leftPct: Number(row.leftPct),
      widthPct: Number(row.widthPct),
      heightPct: Number(row.heightPct),
      hitRadiusPct: row.hitRadiusPct == null ? null : Number(row.hitRadiusPct),
      status:
        row.reservationStatus === 'confirmed'
          ? 'reserved'
          : row.reservationStatus === 'pending'
            ? 'held'
            : 'available',
    }))
  }

  async findSeatsInScreen(ids: number[], screenId: number) {
    if (!ids.length) return new Map<number, { row: string; col: number }>()
    const rows = await db
      .select({ id: seats.id, row: seats.rowLabel, col: seats.colNo })
      .from(seats)
      .where(and(inArray(seats.id, ids), eq(seats.screenId, screenId)))
    return new Map(rows.map((row) => [row.id, { row: row.row, col: row.col }]))
  }

  async reservationCodeExists(code: string) {
    const [row] = await db
      .select({ id: reservations.id })
      .from(reservations)
      .where(eq(reservations.reservationCode, code))
      .limit(1)
    return Boolean(row)
  }

  async findDetail(code: string): Promise<ReservationDetail | null> {
    const [row] = await db
      .select({
        id: reservations.id,
        reservationCode: reservations.reservationCode,
        status: reservations.status,
        bookingType: reservations.bookingType,
        customerEmail: reservations.customerEmail,
        totalPrice: reservations.totalPrice,
        screeningId: screenings.id,
        screeningTitle: screenings.title,
        screeningType: screenings.type,
        startsAt: schedules.startsAt,
        endsAt: schedules.endsAt,
        screenName: screens.name,
      })
      .from(reservations)
      .innerJoin(schedules, eq(schedules.id, reservations.scheduleId))
      .innerJoin(screenings, eq(screenings.id, schedules.screeningId))
      .innerJoin(screens, eq(screens.id, schedules.screenId))
      .where(eq(reservations.reservationCode, code))
    if (!row) return null
    const [image] = await db
      .select({ fileName: images.fileName })
      .from(images)
      .where(and(eq(images.entityType, 'screening'), eq(images.entityId, row.screeningId)))
      .orderBy(asc(images.displayOrder))
      .limit(1)
    const seatRows = await db
      .select({
        row: seats.rowLabel,
        col: seats.colNo,
        ticketType: reservationSeats.ticketType,
        price: reservationSeats.price,
      })
      .from(reservationSeats)
      .innerJoin(seats, eq(seats.id, reservationSeats.seatId))
      .where(eq(reservationSeats.reservationId, row.id))
      .orderBy(asc(seats.rowLabel), asc(seats.colNo))
    return {
      reservationCode: row.reservationCode,
      status: row.status,
      bookingType: row.bookingType,
      customerEmail: row.customerEmail ?? '',
      totalPrice: row.totalPrice,
      screeningTitle: row.screeningTitle,
      screeningType: row.screeningType,
      thumbnailUrl: image?.fileName ?? null,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      screenName: row.screenName,
      seats: seatRows,
    }
  }

  async findForCancel(code: string): Promise<Reservation | null> {
    const [row] = await db
      .select({
        id: reservations.id,
        reservationCode: reservations.reservationCode,
        memberId: reservations.memberId,
        bookingType: reservations.bookingType,
        customerEmail: reservations.customerEmail,
        status: reservations.status,
        startsAt: schedules.startsAt,
      })
      .from(reservations)
      .innerJoin(schedules, eq(schedules.id, reservations.scheduleId))
      .where(eq(reservations.reservationCode, code))
    return row
      ? {
          id: row.id,
          reservationCode: row.reservationCode,
          memberId: row.memberId,
          bookingType: row.bookingType,
          customerEmail: row.customerEmail ?? '',
          status: row.status,
          startsAt: row.startsAt,
        }
      : null
  }

  async cancel(id: number) {
    await db.update(reservations).set({ status: 'cancelled' }).where(eq(reservations.id, id))
  }

  async hold(scheduleId: number, ids: number[], expiresAt: Date, code: string) {
    return db.transaction(
      (tx) => {
        const now = new Date()
        if (ids.length) {
          const inactiveReservations = tx
            .select({ id: reservations.id })
            .from(reservations)
            .where(
              or(
                eq(reservations.status, 'cancelled'),
                and(eq(reservations.status, 'pending'), lte(reservations.expiresAt, now)),
              ),
            )
          tx.delete(reservationSeats)
            .where(
              and(
                eq(reservationSeats.scheduleId, scheduleId),
                inArray(reservationSeats.seatId, ids),
                inArray(reservationSeats.reservationId, inactiveReservations),
              ),
            )
            .run()

          const occupied = tx
            .select({ seatId: reservationSeats.seatId })
            .from(reservationSeats)
            .innerJoin(reservations, eq(reservations.id, reservationSeats.reservationId))
            .where(
              and(
                eq(reservationSeats.scheduleId, scheduleId),
                inArray(reservationSeats.seatId, ids),
                or(
                  eq(reservations.status, 'confirmed'),
                  and(eq(reservations.status, 'pending'), gt(reservations.expiresAt, now)),
                ),
              ),
            )
            .all()
          if (occupied.length) {
            throw new AppError(
              'SEAT_ALREADY_RESERVED',
              'One or more seats are already reserved or held',
            )
          }
        }

        const inserted = tx
          .insert(reservations)
          .values({
            reservationCode: code,
            scheduleId,
            status: 'pending',
            expiresAt,
            totalPrice: 0,
          })
          .returning({ id: reservations.id })
          .get()
        if (!inserted) throw new Error('Failed to create reservation hold')

        if (ids.length) {
          tx.insert(reservationSeats)
            .values(
              ids.map((seatId) => ({
                reservationId: inserted.id,
                scheduleId,
                seatId,
                ticketType: 'general' as const,
                price: 0,
              })),
            )
            .run()
        }
      },
      { behavior: 'immediate' },
    )
  }

  async finalize(input: {
    reservationCode?: string
    scheduleId: number
    memberId: number | null
    bookingType: BookingType
    customerEmail: string
    tickets: { seatId: number; ticketType: TicketType }[]
    totalPrice: number
    generatedCode: string
  }) {
    const ids = input.tickets.map((ticket) => ticket.seatId)
    return db.transaction(
      (tx) => {
        const now = new Date()
        if (ids.length) {
          const inactiveReservations = tx
            .select({ id: reservations.id })
            .from(reservations)
            .where(
              or(
                eq(reservations.status, 'cancelled'),
                and(eq(reservations.status, 'pending'), lte(reservations.expiresAt, now)),
              ),
            )
          tx.delete(reservationSeats)
            .where(
              and(
                eq(reservationSeats.scheduleId, input.scheduleId),
                inArray(reservationSeats.seatId, ids),
                inArray(reservationSeats.reservationId, inactiveReservations),
              ),
            )
            .run()

          const conditions = [
            eq(reservationSeats.scheduleId, input.scheduleId),
            inArray(reservationSeats.seatId, ids),
            or(
              eq(reservations.status, 'confirmed'),
              and(eq(reservations.status, 'pending'), gt(reservations.expiresAt, now)),
            ),
          ]
          if (input.reservationCode) {
            conditions.push(ne(reservations.reservationCode, input.reservationCode))
          }
          const occupied = tx
            .select({ seatId: reservationSeats.seatId })
            .from(reservationSeats)
            .innerJoin(reservations, eq(reservations.id, reservationSeats.reservationId))
            .where(and(...conditions))
            .all()
          if (occupied.length) {
            throw new AppError(
              'SEAT_ALREADY_RESERVED',
              'One or more seats are already reserved or held',
            )
          }
        }

        const reservationCode = input.reservationCode ?? input.generatedCode
        let reservationId: number
        if (input.reservationCode) {
          const held = tx
            .select({ id: reservations.id })
            .from(reservations)
            .where(
              and(
                eq(reservations.reservationCode, input.reservationCode),
                eq(reservations.status, 'pending'),
                eq(reservations.scheduleId, input.scheduleId),
                gt(reservations.expiresAt, now),
              ),
            )
            .all()
          if (!held[0]) throw new AppError('NOT_FOUND', 'Valid tentative reservation not found')
          reservationId = held[0].id
          tx.update(reservations)
            .set({
              status: 'confirmed',
              expiresAt: null,
              memberId: input.memberId,
              bookingType: input.bookingType,
              customerName: null,
              customerEmail: input.customerEmail,
              totalPrice: input.totalPrice,
            })
            .where(eq(reservations.id, reservationId))
            .run()
          tx.delete(reservationSeats).where(eq(reservationSeats.reservationId, reservationId)).run()
        } else {
          const inserted = tx
            .insert(reservations)
            .values({
              reservationCode,
              scheduleId: input.scheduleId,
              memberId: input.memberId,
              bookingType: input.bookingType,
              customerName: null,
              customerEmail: input.customerEmail,
              totalPrice: input.totalPrice,
            })
            .returning({ id: reservations.id })
            .get()
          if (!inserted) throw new Error('Failed to create reservation')
          reservationId = inserted.id
        }

        if (input.tickets.length) {
          tx.insert(reservationSeats)
            .values(
              input.tickets.map((ticket) => ({
                reservationId,
                scheduleId: input.scheduleId,
                seatId: ticket.seatId,
                ticketType: ticket.ticketType,
                price: ticketPrices[ticket.ticketType],
              })),
            )
            .run()
        }
        return { reservationId, reservationCode }
      },
      { behavior: 'immediate' },
    )
  }
}
