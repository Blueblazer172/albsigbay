const express = require('express');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const axios = require('axios');
const querystring = require('querystring');
const db = require('./db');

const port = 3000;

app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public/books/covers'));
app.use(express.static(__dirname + '/views'));
app.use("/public", express.static(path.join(__dirname, "public")))

// try parsing requests
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

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
    let sql = `SELECT
        bk.id, title, isbn, author, pages, description, category
        vendor, publicationDate, cover, userId, borrowedDate, returnDate
        FROM books AS bk
        LEFT JOIN borrowedBooks AS bbk
        ON bk.id = bbk.bookId`;

    db.all(sql, (err, rows) => {
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

app.get("/api/categories", (req, res, next) => {
    let sql = "select distinct category from books"
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

app.get("/api/user/:id", (req, res, next) => {
    let sql = "select * from users where id = ?"
    let params = [req.params.id]
    db.get(sql, params, (err, row) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            "message": "success",
            "data": row
        })
    });
});

app.put("/api/search", (req, res, next) => {
    let sql = `SELECT *
               FROM books
               WHERE title LIKE ?
                  OR isbn LIKE ?
                  OR author LIKE ?
                  OR category LIKE ?
                  OR publicationDate LIKE ?
                  OR vendor LIKE ?`;

    db.all(sql, [
        '%' + req.body.search + '%',
        '%' + req.body.search + '%',
        '%' + req.body.search + '%',
        '%' + req.body.search + '%',
        '%' + req.body.search + '%'
    ], (err, row) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            "message": "success",
            "data": row
        })
    });
});

app.get("/search/:query", (req, res, next) => {
    // unescape url query parameter
    req.params.query = querystring.unescape(req.params.query);
    if (req.params.query) {
        axios.put('http://localhost:3000/api/search', {search: req.params.query}).then((filteredBooks) => {
            if (filteredBooks.data.data.length > 0) {
                axios.get('http://localhost:3000/api/categories').then((categories) => {
                    res.render('pages/index', {books: filteredBooks.data.data, categories: categories.data.data});
                })
            } else {
                res.render('pages/index')
            }
        });
    } else {
        res.redirect('/');
    }
});

app.get("/search/", (req, res, next) => {
    res.redirect('/');
});

app.get("/book/:id", (req, res, next) => {
    let sql = "select * from books where id = ?"
    let params = [req.params.id]

    db.get(sql, params, (err, row) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }

        res.render('components/book', {data: row});
    });
});

app.get("/books/cat/:id", (req, res, next) => {
    let sql = "select * from books where category = ?"
    let params = [req.params.id]

    db.all(sql, params, (err, row) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }

        res.render('pages/index', {books: row, categories: [{category: req.params.id}]});
    });
});

app.get('/', function (req, res) {
    const getBooks = axios.get('http://localhost:3000/api/books');
    const getCategories = axios.get('http://localhost:3000/api/categories');

    axios.all([getBooks, getCategories]).then(axios.spread((...responses) => {
        const books = responses[0];
        const categories = responses[1];
        res.render('pages/index', {books: books.data.data, categories: categories.data.data});
    })).catch(errors => {
        console.error(errors);
    })
});

app.get('/about', function (req, res) {
    res.render('pages/about');
});

app.get('/faq', function (req, res) {
    res.render('pages/faq');
});

app.get('/login', function (req, res) {
    res.render('pages/login');
});

app.get('/gdpr', function (req, res) {
    res.render('pages/gdpr');
});

app.post('/login', function (req, res) {
    //@TODO handle post login
});

app.get('/register', function (req, res) {
    res.render('pages/register');
});

app.post('/register', function (req, res) {
    let errors = [];
    console.log(req.body)

    if (!req.body.surname) {
        errors.push("No Surname specified");
    }

    if (!req.body.email) {
        errors.push("No Email specified");
    }

    if (!req.body.password) {
        errors.push("No Password specified");
    }

    if (!req.body.city) {
        errors.push("No City specified");
    }

    if (!req.body.street) {
        errors.push("No Street specified");
    }

    if (!req.body.name) {
        errors.push("No Name specified");
    }

    if (!req.body.reMail) {
        errors.push("No RE-Email specified");
    }

    if (!req.body.rePassword) {
        errors.push("No RE-Password specified");
    }

    if (!req.body.zip) {
        errors.push("No Zip specified");
    }

    if (!req.body.streetNumber) {
        errors.push("No Street Number specified");
    }

    if (errors.length) {
        res.status(400).json({"error": errors.join(", ")});
        return;
    }

    let data = {
        surname: req.body.surname,
        city: req.body.city,
        email: req.body.email,
        street: req.body.street,
        name: req.body.name,
        reMail: req.body.reMail,
        password: req.body.password,
        rePassword: req.body.rePassword,
        zip: req.body.zip,
        streetNumber: req.body.streetNumber
    }

    bcrypt.hash(req.body.password, 10, function (err, hash) {
        data = {...data, hash: hash}
    });

    console.log(data)

    let sql = 'INSERT INTO user (name, email, password) VALUES (?,?,?)'
    let params = [data.name, data.email, data.hash]
    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({"error": err.message})
            return;
        }

        res.json({
            "message": "success",
            "data": data,
            "id": this.lastID
        })
    });
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});
