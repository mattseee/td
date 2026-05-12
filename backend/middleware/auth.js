const jwt = require('jsonwebtoken')

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Требуется авторизация' })
  }
  try {
    req.user = jwt.verify(auth.slice(7), process.env.JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ success: false, error: 'Токен недействителен или истёк' })
  }
}

function optionalAuthMiddleware(req, res, next) {
  const auth = req.headers.authorization
  if (auth && auth.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(auth.slice(7), process.env.JWT_SECRET)
    } catch {
      // invalid token — proceed as guest
    }
  }
  next()
}

function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Доступ запрещён' })
  }
  next()
}

module.exports = { authMiddleware, optionalAuthMiddleware, adminMiddleware }
