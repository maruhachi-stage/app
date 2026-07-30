import { createHash, randomBytes } from 'node:crypto'
import argon2 from 'argon2'

export const STAFF_SESSION_COOKIE = 'hal_staff_session'
export const STAFF_CHALLENGE_COOKIE = 'hal_staff_challenge'
export const STAFF_SESSION_MAX_AGE = 8 * 60 * 60
export const STAFF_OTP_EXPIRES_MIN = 10

export const hashToken = (value: string) => createHash('sha256').update(value).digest('hex')
export const createToken = () => randomBytes(32).toString('base64url')
export const createOtp = () => String(Math.floor(100000 + Math.random() * 900000))
export const hashPassword = (password: string) => argon2.hash(password, { type: argon2.argon2id })
export const verifyPassword = (hash: string, password: string) => argon2.verify(hash, password)
