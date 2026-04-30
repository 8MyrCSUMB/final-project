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
    let musicName = req.query.musicName;
    let artistName = req.query.artistName;
    let message = "";
    let rows2 = [];
    let liked = [];

    try {
        let sql = 'SELECT userId FROM login WHERE username = ?;'
        const [rows] = await pool.query(sql, [req.session.username]);

        if (rows.length === 0) {
            return res.redirect('/');
        }

        let userId = rows[0].userId;

        if (musicName && artistName) {
            try {
                let url = `https://api.deezer.com/search?q=artist:"${artistName}" track:"${musicName}"`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.data && data.data.length > 0) {
                    let trackId = data.data[0].id;
                    let songTitle = data.data[0].title;
                    let artist = data.data[0].artist.name;
                    let preview = data.data[0].preview;

                    let sql2 = `INSERT INTO likedMusic (musicid, userId, songName, artistName, musicLink) VALUES (?, ?, ?, ?, ?);`;
                    await pool.query(sql2, [trackId, userId, songTitle, artist, preview]);
                } else {
                    message = "Artist or music not found";
                }
            } catch (err) {
                console.error(err);
                message = "Error adding music";
            }
        }

        let sql3 = 'SELECT artistName, songName, musicLink FROM likedMusic WHERE userId = ?;'
        const [fetchedRows] = await pool.query(sql3, [userId]);
        rows2 = fetchedRows;

        for (let i = 0; i < rows2.length; i++) {
            try {
                let url = `https://api.deezer.com/search?q=artist:"${rows2[i].artistName}" track:"${rows2[i].songName}"`;
                const response = await fetch(url);
                const data = await response.json();
                if (data.data && data.data.length > 0) {
                    liked.push({ picture: data.data[0].artist.picture_small, preview: data.data[0].preview });
                } else {
                    liked.push({ picture: "", preview: rows2[i].musicLink });
                }
            } catch (e) {
                liked.push({ picture: "", preview: rows2[i].musicLink });
            }
        }

        res.render('liked.ejs', { rows2, message, liked });
    } catch (err) {
        console.error(err);
        res.render('liked.ejs', { rows2: [], message: "An error occurred", liked: [] });
    }
});

export default router;