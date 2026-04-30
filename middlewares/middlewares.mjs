import { pool } from '../config/db.mjs';

export function isUserAuthenticated(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/');
    }
}

export function isUserNotAuthenticated(req, res, next) {
    if (!req.session.authenticated) {
        next();
    } else {
        res.redirect('/welcome');
    }
}

export async function isAdmin(req, res, next) {
    let sql = 'SELECT * FROM admin WHERE username = ?;'
    const [rows] = await pool.query(sql, [req.session.username]);
    if (req.session.authenticated && rows.length > 0) {
        next();
    } else {
        res.redirect('/');
    }
}