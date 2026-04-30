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

// route that checks username and password
router.post('/loginProcess', async (req, res) => {
    // let username = req.body.username;
    // let password = req.body.password;
    let { username, password } = req.body;
    let hashedPassword = '';
    console.log(username + " " + password + hashedPassword)
    let sql = 'SELECT * FROM login WHERE username = ?;'
    const [rows] = await pool.query(sql, [username]);

    if (rows.length > 0) { // username was found in the database
        hashedPassword = rows[0].password
    }

    const match = await bcrypt.compare(password, hashedPassword);

    if (match) {
        req.session.authenticated = true;
        req.session.fullName = rows[0].firstname + " " + rows[0].lastname;
        req.session.username = rows[0].username;
        let sqlAdmin = 'SELECT * FROM admin WHERE username = ?;';
        const [adminRows] = await pool.query(sqlAdmin, [rows[0].username]);
        if (adminRows.length > 0) {
            res.redirect('/adminPage');
        }
        else {
            res.redirect('/welcome');
        }
    } else {
        let loginError = "Wrong Credentials ! Try Again !"
        res.render('login.ejs', { loginError });
    }
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