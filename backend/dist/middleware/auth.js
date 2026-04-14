import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const secret = process.env.JWT_SECRET ?? 'default_secret';
export function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        return res.status(401).json({ message: 'Missing authorization token' });
    }
    try {
        const payload = jwt.verify(token, secret);
        req.user = { id: payload.id, role: payload.role, username: payload.username };
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
}
export function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
        }
        next();
    };
}
