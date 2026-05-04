import express from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../config/db.mjs';
import { isUserAuthenticated } from '../middlewares/middlewares.mjs';

const router = express.Router();

router.post('/signupProcess', async (req, res) => {
    try {
        const saltRounds = 10;
        let { username, password, email, firstname, lastname, dob, sex } = req.body;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        let sql = `INSERT INTO login (username, password, email, firstname, lastname, dob, sex) VALUES (?, ?, ?, ?, ?, ?, ?);`;
        await pool.query(sql, [username, hashedPassword, email, firstname, lastname, dob, sex]);

        res.render('login.ejs');

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

router.get('/profile', isUserAuthenticated, async (req, res) => {
    try {
        let sql = `SELECT * FROM login WHERE username = ?`;
        const [rows] = await pool.query(sql, [req.session.username]);
        if (rows.length > 0) {
            res.render('profile.ejs', { user: rows[0] });
        } else {
            res.redirect('/welcome');
        }
    } catch (err) {
        console.error(err);
        res.redirect('/welcome');
    }
});

router.post('/profile/update', isUserAuthenticated, async (req, res) => {
    try {
        let { email, firstname, lastname, dob, sex } = req.body;
        let sql = `UPDATE login SET email = ?, firstname = ?, lastname = ?, dob = ?, sex = ? WHERE username = ?;`;
        await pool.query(sql, [email, firstname, lastname, dob, sex, req.session.username]);
        req.session.fullName = firstname + " " + lastname;
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        let sqlFetch = `SELECT * FROM login WHERE username = ?`;
        const [rows] = await pool.query(sqlFetch, [req.session.username]);
        res.render('profile.ejs', { user: rows[0], errorMessage: "Failed to update profile. Email might already be taken.", successMessage: null });
    }
});

router.get('/welcome', isUserAuthenticated, async (req, res) => {
    try {
        const apiKey = process.env.API_KEY_TICKETMASTER;
        const url = `https://app.ticketmaster.com/discovery/v2/events.json?classificationId=KZFzniwnSyZfZ7v7nJ&apikey=${apiKey}`;

        let results = await fetch(url);
        let data = await results.json();

        data._embedded.events = data._embedded.events.filter(event => {
            const name = event.name.toLowerCase();
            return !name.includes('monster jam');
        });

        res.render('welcome.ejs', {
            "fullName": req.session.fullName,
            data
        });

    } catch (err) {
        console.error("Erreur Ticketmaster:", err);
        res.render('welcome.ejs', {
            "fullName": req.session.fullName,
            data: null
        });
    }
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