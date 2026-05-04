import 'dotenv/config'
import express from 'express';
import session from 'express-session';
import { isAdmin, isUserNotAuthenticated } from './middlewares/middlewares.mjs';
import adminRoutes from './routes/admin.mjs';
import userRoutes from './routes/login-signup-user.mjs';
import featuresRoutes from './routes/features.mjs';

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
//for Express to get values using the POST method
app.use(express.urlencoded({ extended: true }));
import { pool } from './config/db.mjs';

// setting sessions
app.set('trust proxy', 1)
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true }
}))


app.use(adminRoutes);

app.use(userRoutes);

app.use(featuresRoutes);


app.get('/', isUserNotAuthenticated, async (req, res) => {
    res.render('home.ejs');
});

app.get("/dbTest", isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});

app.listen(3000, () => {
    console.log("Express server running")
})
