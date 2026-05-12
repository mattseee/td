function resolveImageUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `/uploads/${url}`
}

module.exports = { resolveImageUrl }
