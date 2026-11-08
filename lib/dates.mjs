export const TZ = 'America/Toronto'

const fmt = (opts) => new Intl.DateTimeFormat('en-US', { timeZone: TZ, ...opts })
const utcFmt = (opts) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...opts })

/** YYYY-MM-DD in Toronto time */
export const ymd = (d = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(d))

export const addDays = (day, n) => {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}
export const dayOfWeek = (day) => new Date(`${day}T12:00:00Z`).getUTCDay()

export function offsetFor(day) {
  const part = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'shortOffset' })
    .formatToParts(new Date(`${day}T12:00:00Z`))
    .find((p) => p.type === 'timeZoneName')?.value
  const m = part && part.match(/GMT([+-]\d+)(?::(\d+))?/)
  if (!m) return '-05:00'
  const h = Number(m[1])
  return `${h < 0 ? '-' : '+'}${String(Math.abs(h)).padStart(2, '0')}:${m[2] || '00'}`
}
/** ISO string for a Toronto wall-clock time */
export const torontoISO = (day, hm) => `${day}T${hm}:00${offsetFor(day)}`

/** [friday, sunday] of the current (or upcoming) weekend */
export function weekendRange(today = ymd()) {
  const d = dayOfWeek(today)
  if (d === 0) return [addDays(today, -2), today]
  if (d === 6) return [addDays(today, -1), addDays(today, 1)]
  const fri = addDays(today, 5 - d)
  return [fri, addDays(fri, 2)]
}

export const fmtDate = (iso) => fmt({ month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
export const fmtDay = (day) => utcFmt({ weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${day}T12:00:00Z`))
export const fmtMonth = (ym) => utcFmt({ month: 'long', year: 'numeric' }).format(new Date(`${ym}-15T12:00:00Z`))

export function eventParts(iso) {
  const d = new Date(iso)
  return {
    dow: fmt({ weekday: 'short' }).format(d).toUpperCase(),
    mon: fmt({ month: 'short' }).format(d).toUpperCase(),
    day: fmt({ day: 'numeric' }).format(d),
    time: fmt({ hour: 'numeric', minute: '2-digit' }).format(d),
    long: fmt({ weekday: 'long', month: 'long', day: 'numeric' }).format(d),
  }
}
export function timeRange(start, end) {
  const s = eventParts(start).time
  return end ? `${s}–${eventParts(end).time}` : s
}

/** Month grid (Sunday-first) of YYYY-MM-DD strings, null for padding */
export function monthGrid(ym) {
  const [y, m] = ym.split('-').map(Number)
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay()
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const cells = Array(first).fill(null)
  for (let d = 1; d <= days; d++) cells.push(`${ym}-${String(d).padStart(2, '0')}`)
  while (cells.length % 7) cells.push(null)
  return cells
}
export const shiftMonth = (ym, n) => {
  const [y, m] = ym.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7)
}
