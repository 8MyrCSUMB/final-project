import express from "express";
import { isAdmin } from "../middlewares/middlewares.mjs";
import { pool } from "../config/db.mjs";

const router = express.Router();

router.get('/adminPage', isAdmin, (req, res) => {
    res.render('adminPage.ejs');
});

router.get('/allUsers', isAdmin, async (req, res) => {
    let sql = 'SELECT * FROM login;'
    const [rows] = await pool.query(sql);
    res.render('allUsers.ejs', { rows, currentUsername: req.session.username });
});

router.get('/deleteUser', isAdmin, async (req, res) => {
    let userId = req.query.userId;
    let sql = `DELETE FROM login WHERE userId = ?`;
    await pool.query(sql, [userId]);
    res.redirect('/allUsers');
});

router.post('/updateUser', isAdmin, async (req, res) => {
    try {
        let { userId, username, email, firstname, lastname, dob, sex } = req.body;
        let sql = `UPDATE login SET username = ?, email = ?, firstname = ?, lastname = ?, dob = ?, sex = ? WHERE userId = ?;`;
        await pool.query(sql, [username, email, firstname, lastname, dob, sex, userId]);
        res.redirect('/allUsers');
    } catch (err) {
        console.error(err);
        let errorMessage = "Email and Username has to be unique.";
        let sqlFetch = 'SELECT * FROM login;';
        const [rows] = await pool.query(sqlFetch);
        res.render('allUsers.ejs', { rows, currentUsername: req.session.username, errorMessage });
    }
});

export default router;