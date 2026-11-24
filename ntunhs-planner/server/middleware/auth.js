import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

const ephemeralSecret = crypto.randomBytes(32).toString('hex');

export function getJwtSecret() {
  return process.env.JWT_SECRET || ephemeralSecret;
}

/**
 * Attaches req.user if a valid Bearer token is present, otherwise leaves req.user = null.
 */
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = header.slice(7).trim();
  try {
    req.user = jwt.verify(token, getJwtSecret());
  } catch {
    req.user = null;
  }
  return next();
}

/**
 * Requires a valid authenticated user.
 */
export function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: '請先登入系統 (Authentication required)' });
    }
    return next();
  });
}

/**
 * Requires an admin user.
 */
export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: '需要管理者權限 (Admin access required)' });
    }
    return next();
  });
}
