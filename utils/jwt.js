/**
 * JWT utilities — secrets come only from environment (no in-repo defaults).
 */

const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
    const v = process.env.JWT_SECRET;
    if (!v || String(v).trim() === '') {
        throw new Error('JWT_SECRET is not set');
    }
    return String(v).trim();
};

const getJwtRefreshSecret = () => {
    const v = process.env.JWT_REFRESH_SECRET;
    if (!v || String(v).trim() === '') {
        throw new Error('JWT_REFRESH_SECRET is not set');
    }
    return String(v).trim();
};

const JWT_EXPIRE = process.env.JWT_EXPIRE || (process.env.NODE_ENV === 'production' ? '15m' : '1h');
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

const generateToken = (payload) => {
    return jwt.sign(payload, getJwtSecret(), {
        expiresIn: JWT_EXPIRE,
    });
};

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, getJwtRefreshSecret(), {
        expiresIn: JWT_REFRESH_EXPIRE,
    });
};

const verifyToken = (token) => {
    return jwt.verify(token, getJwtSecret());
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, getJwtRefreshSecret());
};

const decodeToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    generateToken,
    generateRefreshToken,
    verifyToken,
    verifyRefreshToken,
    decodeToken,
};
