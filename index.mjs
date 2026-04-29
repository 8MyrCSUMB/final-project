import 'dotenv/config'
import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import session from 'express-session';

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
//for Express to get values using the POST method
app.use(express.urlencoded({ extended: true }));
//setting up database connection pool, replace values in red
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWD,
    database: process.env.DB_DATABASE,
    connectionLimit: 10,
    waitForConnections: true
});

// setting sessions
app.set('trust proxy', 1)
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true }
}))

// middleware functions

function isUserAuthenticated(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/');
    }
}

function isUserNotAuthenticated(req, res, next) {
    if (!req.session.authenticated) {
        next();
    } else {
        res.redirect('/welcome');
    }
}

async function isAdmin(req, res, next) {
    let sql = 'SELECT * FROM login WHERE firstname = ? AND lastname = ?;'
    let [fname, lname] = req.session.fullName.split(' ');
    const [rows] = await pool.query(sql, [fname, lname]);
    if (req.session.authenticated && rows[0].userId == 1) {
        next();
    } else {
        res.redirect('/');
    }
}

//routes
app.get('/', isUserNotAuthenticated, (req, res) => {
    res.render('home.ejs');
});

app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.get('/signup', (req, res) => {
    res.render('signup.ejs');
});

app.get("/dbTest", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});//dbTest

app.listen(3000, () => {
    console.log("Express server running")
})

app.post('/signupProcess', async (req, res) => {
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
app.post('/loginProcess', async (req, res) => {
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
        if (username == "admin") {
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

app.get('/search', isUserAuthenticated, async (req, res) => {
    let message = "";
    let result = [];
    try {
        let search = req.query.musicName;
        let url = `https://api.deezer.com/search?q=${search}`;
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);
        for (let i = 0; i < data.data.length && i < 20; i++) {
            let dico = [];
            dico.push(data.data[i].artist.name);
            dico.push(data.data[i].title);
            dico.push(data.data[i].artist.picture_small);
            dico.push(data.data[i].preview);
            result.push(dico);
        }

        res.render('search.ejs', { result, message });
    } catch (err) {
        if (err instanceof TypeError) {
            message = "Artist or music not found";
            res.render("search.ejs", { message, result });
        } else {
            console.log();
        }
    }
});

app.get('/profile', isUserAuthenticated, (req, res) => {
    res.render('profile.ejs');
});

app.get('/welcome', isUserAuthenticated, (req, res) => {
    res.render('welcome.ejs', { "fullName": req.session.fullName });
});

app.get('/liked', isUserAuthenticated, async (req, res) => {
    let musicName = req.query.musicName;
    let artistName = req.query.artistName;
    let message = "";
    let result = [];
    let liked = [];
    try {
        let url = `https://api.deezer.com/search?q=artist:"${artistName}" track:"${musicName}"`;
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);
        result.push(data.data[0].artist.name);
        result.push(data.data[0].title);
        result.push(data.data[0].artist.picture_small);
        result.push(data.data[0].preview);
        result.push(data.data[0].id);

        let [firstName, lastName] = req.session.fullName.split(' ');
        let sql = 'SELECT userId FROM login WHERE firstname = ? AND lastname = ?;'
        const [rows] = await pool.query(sql, [firstName, lastName]);

        let sql2 = `INSERT INTO likedMusic (userId, songName, artistName, musicLink) VALUES (?, ?, ?, ?);`;
        await pool.query(sql2, [rows[0].userId, result[1], result[0], result[3]]);

        let sql3 = 'SELECT artistName, songName, musicLink FROM likedMusic WHERE userId = ?;'
        const [rows2] = await pool.query(sql3, [rows[0].userId]);

        for (let i = 0; i < rows2.length; i++) {
            let url = `https://api.deezer.com/search?q=artist:"${rows2[i].artistName}" track:"${rows2[i].songName}"`;
            const response = await fetch(url);
            const data = await response.json();
            console.log(data);
            liked.push({ picture: data.data[0].artist.picture_small, preview: data.data[0].preview });
        }
        console.log();

        res.render('liked.ejs', { rows2, message, liked });
    } catch (err) {
        if (err instanceof TypeError) {
            message = "Artist or music not found";
            res.render("liked.ejs", { message, result });
        } else {
            console.log();
            res.render('liked.ejs', { message, result });
        }

    }
});

app.get('/adminPage', isAdmin, (req, res) => {
    res.render('adminPage.ejs');
});

app.get('/allUsers', isAdmin, async (req, res) => {
    let sql = 'SELECT * FROM login;'
    const [rows] = await pool.query(sql);
    res.render('allUsers.ejs', { rows });
});

app.get('/deleteUser', isAdmin, async (req, res) => {
    let userId = req.query.userId;
    let sql = `DELETE FROM login WHERE userId = ?`
    const [rows] = await pool.query(sql, [userId]);
    res.render('adminPage.ejs');
});

app.get('/logout', isUserAuthenticated, (req, res) => {
    req.session.destroy();
    res.redirect('/')
});