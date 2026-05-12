const map = {
  '&nbsp;': ' ', '&mdash;': '—', '&ndash;': '–', '&hellip;': '…',
  '&laquo;': '«', '&raquo;': '»', '&deg;': '°', '&amp;': '&',
  '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&#39;': "'",
  '&plusmn;': '±', '&times;': '×', '&divide;': '÷',
  '&copy;': '©', '&reg;': '®', '&trade;': '™',
}

export function decodeEntities(text) {
  if (!text) return ''
  let r = text
  for (const [k, v] of Object.entries(map)) r = r.split(k).join(v)
  r = r.replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c, 10)))
  r = r.replace(/&#x([0-9a-f]+);/gi, (_, c) => String.fromCharCode(parseInt(c, 16)))
  return r
}
