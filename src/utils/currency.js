export const formatCurrency = (value) => {
  if (value === null || value === undefined) return '$0.00'
  const amount = Number(value)
  if (Number.isNaN(amount)) return '$0.00'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount)
}
