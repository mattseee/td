export function getImageUrl(url) {
  if (!url) return 'https://placehold.co/800x600/1A1D27/7A8099?text=Нет+фото'
  if (url.startsWith('http')) return url
  return `${process.env.NEXT_PUBLIC_API_URL}${url}`
}
