const NBSP = ' '

export function formatPrice(price) {
  if (price == null || price === '') return ''
  const num = Math.round(Number(price))
  const str = num.toString()
  const thousands = str.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
  return thousands + NBSP + '₽'
}
