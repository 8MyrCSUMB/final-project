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
        res.redirect('/welcome');
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
    try {
        let url = `https://api.deezer.com/search?q=artist:"${artistName}" track:"${musicName}"`;
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);
        result.push(data.data[0].artist.name);
        result.push(data.data[0].title);
        result.push(data.data[0].artist.picture_small);
        result.push(data.data[0].preview);

        //let sql = `INSERT INTO login (username, password, email, firstname, lastname) VALUES (?, ?, ?, ?, ?);`;
        //await pool.query(sql, [username, hashedPassword, email, firstname, lastname]);
        console.log();

        res.render('liked.ejs', { result, message });
    } catch (err) {
        if (err instanceof TypeError) {
            message = "Artist or music not found";
            res.render("liked.ejs", { message, result });
        } else {
            console.log();
            res.render('liked.ejs');
        }

    }
});

app.get('/logout', isUserAuthenticated, (req, res) => {
    req.session.destroy();
    res.redirect('/')
});