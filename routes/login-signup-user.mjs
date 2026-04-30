import express from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../config/db.mjs';
import { isUserAuthenticated } from '../middlewares/middlewares.mjs';

const router = express.Router();

router.post('/signupProcess', async (req, res) => {
    try {
        const saltRounds = 10;
        let { username, password, email, firstname, lastname } = req.body;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        let sql = `INSERT INTO login (username, password, email, firstname, lastname) VALUES (?, ?, ?, ?, ?);`;
        await pool.query(sql, [username, hashedPassword, email, firstname, lastname]);

        res.render('login.ejs', { signupSuccess: "Registration successful! Please log in." });

    } catch (err) {
        let signupError = "Username or Email already exists. Please choose another.";
        res.render('signup.ejs', { signupError });
    }
});

router.post('/loginProcess', async (req, res) => {
    let { username, password } = req.body;

    let sqlAdmin = 'SELECT * FROM admin WHERE username = ?;';
    const [adminRows] = await pool.query(sqlAdmin, [username]);

    if (adminRows.length > 0) {
        const matchAdmin = await bcrypt.compare(password, adminRows[0].password);
        if (matchAdmin) {
            req.session.authenticated = true;
            req.session.fullName = adminRows[0].firstname + " " + adminRows[0].lastname;
            req.session.username = adminRows[0].username;
            return res.redirect('/adminPage');
        }
    }

    let sql = 'SELECT * FROM login WHERE username = ?;'
    const [rows] = await pool.query(sql, [username]);

    if (rows.length > 0) {
        const matchUser = await bcrypt.compare(password, rows[0].password);
        if (matchUser) {
            req.session.authenticated = true;
            req.session.fullName = rows[0].firstname + " " + rows[0].lastname;
            req.session.username = rows[0].username;
            return res.redirect('/welcome');
        }
    }

    let loginError = "Wrong Credentials ! Try Again !";
    res.render('login.ejs', { loginError });
});

router.get('/profile', isUserAuthenticated, (req, res) => {
    res.render('profile.ejs');
});

router.get('/welcome', isUserAuthenticated, (req, res) => {
    res.render('welcome.ejs', { "fullName": req.session.fullName });
});

router.get('/login', (req, res) => {
    res.render('login.ejs');
});

router.get('/signup', (req, res) => {
    res.render('signup.ejs');
});

router.get('/logout', isUserAuthenticated, (req, res) => {
    req.session.destroy();
    res.redirect('/')
});

export default router;