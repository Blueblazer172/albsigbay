const express = require('express');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt');
const md5 = require('md5');
const db = require('./db');
const port = 3000;

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public/books/covers'));

app.get("/api/users", (req, res, next) => {
    let sql = "select * from users"
    let params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        })
    });
});

app.get("/api/books", (req, res, next) => {
    let sql = "select * from books"
    let params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        })
    });
});

app.get("/api/borrowed-books", (req, res, next) => {
    let sql = "select * from borrowedBooks"
    let params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        })
    });
});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/about', function (req, res) {
    res.sendFile(path.join(__dirname + '/about.html'));
});

app.get('/faq', function (req, res) {
    res.sendFile(path.join(__dirname + '/faq.html'));
});

app.get('/login', function (req, res) {
    res.sendFile(path.join(__dirname + '/login.html'));
});

app.get('/gdpr', function (req, res) {
    res.sendFile(path.join(__dirname + '/gdpr.html'));
});

app.post('/login', function (req, res) {
    //@TODO handle post login
});

app.get('/register', function (req, res) {
    res.sendFile(path.join(__dirname + '/register.html'));
});

app.post('/register', function (req, res) {
    //@TODO handle post register
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});
