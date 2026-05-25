export const toApiDateTime = (value, endOfDay = false) => {
  if (!value) return null
  if (endOfDay && value.length <= 10) {
    return value + 'T23:59:59'
  }
  if (value.length <= 10) {
    return value + 'T00:00:00'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 19)
}

export const diasEntre = (inicio, fin) => {
  if (!inicio || !fin) return 1
  const d1 = new Date(inicio)
  const d2 = new Date(fin)
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return 1
  const diff = d2.getTime() - d1.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return Math.max(days, 1)
}
