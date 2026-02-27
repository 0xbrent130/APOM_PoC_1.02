const { extractTokenFromRequest, getSessionFromToken } = require("../auth/session.js")

function sendAuthError(res, statusCode, code, message) {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  })
}

async function requireAuth(req, res, next) {
  try {
    const token = extractTokenFromRequest(req)
    const session = await getSessionFromToken(token)

    if (!session) {
      sendAuthError(res, 401, "UNAUTHORIZED", "Authentication required")
      return
    }

    req.auth = session
    req.auth.token = token
    next()
  } catch (error) {
    console.error(error)
    sendAuthError(res, 500, "INTERNAL_SERVER_ERROR", "Server Error")
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth) {
      sendAuthError(res, 401, "UNAUTHORIZED", "Authentication required")
      return
    }

    if (!allowedRoles.includes(req.auth.role)) {
      sendAuthError(res, 403, "FORBIDDEN", "Insufficient permissions")
      return
    }

    next()
  }
}

module.exports = {
  requireAuth,
  requireRole,
}
