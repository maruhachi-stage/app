import { and, asc, eq, gt, inArray, lte, ne, or } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import type { Database } from '#infrastructure/database/database.js'
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

/**
 * Seat rows are protected by a unique index, so a concurrent hold surfaces as a
 * constraint violation that the API reports as a seat conflict.
 */
function toSeatError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err)
  if (message.includes('UNIQUE constraint failed')) {
    return new AppError('SEAT_ALREADY_RESERVED', 'One or more seats are already reserved or held')
  }
  return err instanceof Error ? err : new Error(message)
}

export class DrizzleReservationRepository implements ReservationRepository {
  constructor(private readonly db: Database) {}

  async findPublicSchedule(id: number) {
    const [row] = await this.db
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
    const [row] = await this.db
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
    const rows = await this.db
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
    const rows = await this.db
      .select({ id: seats.id, row: seats.rowLabel, col: seats.colNo })
      .from(seats)
      .where(and(inArray(seats.id, ids), eq(seats.screenId, screenId)))
    return new Map(rows.map((row) => [row.id, { row: row.row, col: row.col }]))
  }

  async reservationCodeExists(code: string) {
    const [row] = await this.db
      .select({ id: reservations.id })
      .from(reservations)
      .where(eq(reservations.reservationCode, code))
      .limit(1)
    return Boolean(row)
  }

  async findDetail(code: string): Promise<ReservationDetail | null> {
    const [row] = await this.db
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
    const [image] = await this.db
      .select({ fileName: images.fileName })
      .from(images)
      .where(and(eq(images.entityType, 'screening'), eq(images.entityId, row.screeningId)))
      .orderBy(asc(images.displayOrder))
      .limit(1)
    const seatRows = await this.db
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
    const [row] = await this.db
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
    // Releasing the seat rows keeps them bookable again, which the unique index
    // on (schedule_id, seat_id) otherwise forbids.
    await this.db.batch([
      this.db.update(reservations).set({ status: 'cancelled' }).where(eq(reservations.id, id)),
      this.db.delete(reservationSeats).where(eq(reservationSeats.reservationId, id)),
    ])
  }

  async hold(scheduleId: number, ids: number[], expiresAt: Date, code: string): Promise<void> {
    const now = new Date()
    await this.ensureSeatsAvailable(scheduleId, ids, now)

    const inserted = await this.db
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
      try {
        await this.db.insert(reservationSeats).values(
          ids.map((seatId) => ({
            reservationId: inserted.id,
            scheduleId,
            seatId,
            ticketType: 'general' as const,
            price: 0,
          })),
        )
      } catch (err) {
        // The hold row is useless without its seats, so it is removed before the
        // unique constraint violation is surfaced to the caller.
        await this.db.delete(reservations).where(eq(reservations.id, inserted.id))
        throw toSeatError(err)
      }
    }
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
  }): Promise<{ reservationId: number; reservationCode: string }> {
    const now = new Date()
    const ids = input.tickets.map((ticket) => ticket.seatId)
    await this.ensureSeatsAvailable(input.scheduleId, ids, now, input.reservationCode)

    const reservationCode = input.reservationCode ?? input.generatedCode
    const seatRows = (reservationId: number) =>
      input.tickets.map((ticket) => ({
        reservationId,
        scheduleId: input.scheduleId,
        seatId: ticket.seatId,
        ticketType: ticket.ticketType,
        price: ticketPrices[ticket.ticketType],
      }))

    if (input.reservationCode) {
      const held = await this.db
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
        .get()
      if (!held) throw new AppError('NOT_FOUND', 'Valid tentative reservation not found')
      const reservationId = held.id

      // D1 has no interactive transactions, so the confirmation and the seat
      // hand-over are sent as one atomic batch.
      const statements: BatchItem<'sqlite'>[] = [
        this.db
          .update(reservations)
          .set({
            status: 'confirmed',
            expiresAt: null,
            memberId: input.memberId,
            bookingType: input.bookingType,
            customerName: null,
            customerEmail: input.customerEmail,
            totalPrice: input.totalPrice,
          })
          .where(eq(reservations.id, reservationId)),
        this.db.delete(reservationSeats).where(eq(reservationSeats.reservationId, reservationId)),
      ]
      if (input.tickets.length) {
        statements.push(this.db.insert(reservationSeats).values(seatRows(reservationId)))
      }

      try {
        await this.db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]])
      } catch (err) {
        throw toSeatError(err)
      }
      return { reservationId, reservationCode }
    }

    const inserted = await this.db
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

    if (input.tickets.length) {
      try {
        await this.db.insert(reservationSeats).values(seatRows(inserted.id))
      } catch (err) {
        await this.db.delete(reservations).where(eq(reservations.id, inserted.id))
        throw toSeatError(err)
      }
    }
    return { reservationId: inserted.id, reservationCode }
  }

  /**
   * Releases seat rows left behind by cancelled or expired holds, then rejects
   * the request when any of the requested seats is still taken.
   */
  private async ensureSeatsAvailable(
    scheduleId: number,
    ids: number[],
    now: Date,
    excludeReservationCode?: string,
  ): Promise<void> {
    if (ids.length === 0) return

    const inactiveReservations = this.db
      .select({ id: reservations.id })
      .from(reservations)
      .where(
        or(
          eq(reservations.status, 'cancelled'),
          and(eq(reservations.status, 'pending'), lte(reservations.expiresAt, now)),
        ),
      )
    await this.db
      .delete(reservationSeats)
      .where(
        and(
          eq(reservationSeats.scheduleId, scheduleId),
          inArray(reservationSeats.seatId, ids),
          inArray(reservationSeats.reservationId, inactiveReservations),
        ),
      )

    const conditions = [
      eq(reservationSeats.scheduleId, scheduleId),
      inArray(reservationSeats.seatId, ids),
      or(
        eq(reservations.status, 'confirmed'),
        and(eq(reservations.status, 'pending'), gt(reservations.expiresAt, now)),
      ),
    ]
    if (excludeReservationCode) {
      conditions.push(ne(reservations.reservationCode, excludeReservationCode))
    }

    const occupied = await this.db
      .select({ seatId: reservationSeats.seatId })
      .from(reservationSeats)
      .innerJoin(reservations, eq(reservations.id, reservationSeats.reservationId))
      .where(and(...conditions))
      .all()
    if (occupied.length > 0) {
      throw new AppError('SEAT_ALREADY_RESERVED', 'One or more seats are already reserved or held')
    }
  }
}
