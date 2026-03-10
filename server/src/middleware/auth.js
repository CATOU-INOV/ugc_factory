// Middleware d'authentification JWT
// Vérifie le token Bearer dans l'en-tête Authorization

import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'ugcfactory-poc-secret-key-2024'

/**
 * Middleware de vérification JWT — protège les routes back-office
 * Accepte le token via :
 *   - En-tête Authorization: Bearer <token>
 *   - Query param ?token=<token> (nécessaire pour les balises <video src=...> du navigateur)
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  const queryToken = req.query.token

  let token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  } else if (queryToken) {
    token = queryToken
  } else {
    return res.status(401).json({ error: 'Token d\'authentification manquant' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' })
  }
}

/**
 * Middleware de vérification de rôle
 * @param {...string} roles - Rôles autorisés (ex: 'ADMIN', 'MEDIA')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé — droits insuffisants' })
    }
    next()
  }
}

/**
 * Génère un token JWT
 */
export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
    JWT_SECRET,
    { expiresIn: '8h' }
  )
}
