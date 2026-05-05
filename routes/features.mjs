import express from 'express';
import { pool } from '../config/db.mjs';
import { isUserAuthenticated } from '../middlewares/middlewares.mjs';

const router = express.Router();

router.get('/search', isUserAuthenticated, async (req, res) => {
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


router.get('/liked', isUserAuthenticated, async (req, res) => {
    let { musicName, artistName } = req.query;
    let message = "";

    try {
        const [user] = await pool.query('SELECT userId FROM login WHERE username = ?', [req.session.username]);
        if (user.length === 0) return res.redirect('/');
        let userId = user[0].userId;

        if (musicName && artistName) {
            let url = `https://api.deezer.com/search?q=artist:"${artistName}" track:"${musicName}"`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.data && data.data.length > 0) {
                let t = data.data[0];
                await pool.query(
                    `INSERT IGNORE INTO likedMusic (musicid, userId, songName, artistName, musicLink, pictureLink) VALUES (?, ?, ?, ?, ?, ?)`,
                    [t.id, userId, t.title, t.artist.name, t.preview, t.artist.picture_small]
                );
            }
        }

        const [rows2] = await pool.query('SELECT * FROM likedMusic WHERE userId = ?', [userId]);
        for (let song of rows2) {
            try {
                const resDeezer = await fetch(`https://api.deezer.com/track/${song.musicid}`);
                const dataDeezer = await resDeezer.json();
                song.musicLink = dataDeezer.preview;
            } catch (e) {
                console.error("Error", e);
            }
        }

        res.render('liked.ejs', { rows2, message });
    } catch (err) {
        console.error(err);
        res.render('liked.ejs', { rows2: [], message: "Error" });
    }
});

router.get('/searchUser', isUserAuthenticated, async (req, res) => {
    try {
        let username = req.query.username;
        let sql = `SELECT * FROM likedMusic NATURAL JOIN login WHERE username = ?`;
        let [rows] = await pool.query(sql, [username]);

        for (let song of rows) {
            try {
                const response = await fetch(`https://api.deezer.com/track/${song.musicid}`);
                const data = await response.json();
                song.musicLink = data.preview;
            } catch (e) {
                console.error("Error refreshing link for user search:", e);
            }
        }

        res.render('searchUser.ejs', { rows });
    } catch (err) {
        console.error(err);
        res.render('searchUser.ejs', { rows: [] });
    }
});

router.get('/searchAUser', isUserAuthenticated, (req, res) => {
    let rows = [];
    let liked = [];
    res.render('searchUser.ejs', { rows, liked });
})

export default router;