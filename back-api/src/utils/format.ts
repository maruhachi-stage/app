export function generateReservationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function getQrCodeUrl(code: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(code)}&format=png`
}

export function toJstString(d: Date): string {
  return d.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function maskEmail(email: string): string {
  const at = email.indexOf('@')
  if (at <= 0) return email
  const visible = email.slice(0, Math.min(2, at))
  return `${visible}***${email.slice(at)}`
}

const IMAGE_BASE = process.env.IMAGE_BASE_URL ?? 'http://localhost:3001'

export function imageUrl(filename: string | null): string | null {
  if (!filename) return null
  if (filename.startsWith('http')) return filename
  return `${IMAGE_BASE}/images/${filename}`
}
