import type { Context } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '#types.js'
import { AppError } from '#lib/errors.js'
import { successResponse } from '#utils/response.js'
import * as MemberService from '#modules/members/service.js'

export const getProfile = async (c: Context<AppEnv>) => {
  const session = c.get('session')
  const requestId = c.get('requestId')
  if (!session) throw new AppError('UNAUTHORIZED', 'Not authenticated')

  const profile = await MemberService.getMemberProfile(session.memberId)
  if (!profile) throw new AppError('NOT_FOUND', 'Member not found')

  return c.json(successResponse({ id: profile.id, email: profile.email, name: profile.name }, requestId))
}

export const getReservations = async (c: Context<AppEnv>) => {
  const session = c.get('session')
  const requestId = c.get('requestId')
  if (!session) throw new AppError('UNAUTHORIZED', 'Not authenticated')

  const items = await MemberService.getMemberReservations(session.memberId)
  return c.json(successResponse({ items }, requestId))
}
