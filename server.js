const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');
const querystring = require('querystring');
const {Op} = require("sequelize");
const cookieParser = require('cookie-parser');
const session = require('express-session');
const morgan = require('morgan');
const port = 3000;

// Models
let User = require('./models/user');
let Book = require('./models/book');
let BorrowedBook = require('./models/BorrowedBook');

// set template engine to ejs
app.set('view engine', 'ejs');

// include file directories
app.use(express.static(__dirname + '/public/books/covers'));
app.use(express.static(__dirname + '/views'));
app.use("/public", express.static(path.join(__dirname, "public")))

// set morgan to log info about our requests for development use.
app.use(morgan('dev'));

// try parsing requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// initialize cookie-parser to allow us access the cookies stored in the browser.
app.use(cookieParser());

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: 'user_sid',
    secret: '289rfoiwjf0923hfgp395024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');
        res.redirect('/')
    } else {
        next();
    }
});


// middleware function to check for logged-in users
let sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
        let userValues = req.session.user;
        // remove values that should not be able to be seen in template or session
        ['password', 'registerDate', "createdAt", "updatedAt"].forEach(e => delete userValues[e]);
        app.locals.user = userValues;

        if (req.originalUrl.includes('login')) {
            // if logged in as user deny access to login route
            res.redirect('/');
        } else if (req.originalUrl.includes('register')) {
            // if logged in as user deny access to login register
            res.redirect('/');
        } else {
            // let active user still see Home route;
            next();
        }
    } else {
        app.locals.user = false;
        next();
    }
};

// SITE ENDPOINTS

// index page
app.get('/', sessionChecker, (req, res) => {
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

// route for user login
app.route('/login')
    .get(sessionChecker, (req, res) => {
        res.render('pages/login');
    })
    .post((req, res) => {
        let emailOrUsername = req.body.emailOrUsername,
            password = req.body.password;

        User.findOne({
            where: {
                [Op.or]: [
                    {email: emailOrUsername},
                    {username: emailOrUsername}
                ]
            }
        }).then(function (user) {
            if (!user) {
                res.redirect('/login');
            } else if (!user.validPassword(password)) {
                res.redirect('/login');
            } else {
                let userValues = user.dataValues;
                req.session.user = user.dataValues;

                // remove values that should not be able to be seen in template or session
                ['password', 'registerDate', "createdAt", "updatedAt"].forEach(e => delete userValues[e]);
                app.locals.user = userValues;

                res.redirect('/profile');
            }
        });
    });

// route for user registration
app.route('/register')
    .get(sessionChecker, (req, res) => {
        res.render('pages/register');
    })
    .post((req, res) => {
        let errors = [];
        if (!req.body.firstname) {
            errors.push("No First Name specified");
        }

        if (!req.body.email) {
            errors.push("No Email specified");
        }

        if (!req.body.password) {
            errors.push("No Password specified");
        }

        if (!req.body.rePassword) {
            errors.push("No RE-Password specified");
        }

        if (req.body.password !== req.body.rePassword) {
            errors.push("Passwords do not match.");
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

        if (!req.body.zip) {
            errors.push("No Zip specified");
        }

        if (!req.body.streetNumber) {
            errors.push("No Street Number specified");
        }

        if (errors.length) {
            // @TODO render errors in template
            res.status(400).json({"error": errors.join(", ")});
            return;
        }

        User.create({
            firstname: req.body.firstname,
            city: req.body.city,
            email: req.body.email,
            street: req.body.street,
            name: req.body.name,
            reMail: req.body.reMail,
            password: req.body.password,
            rePassword: req.body.rePassword,
            zip: req.body.zip,
            streetNumber: req.body.streetNumber,
            username: req.body.username ? req.body.username : null
        }).then(user => {
            req.session.user = user.dataValues;
            let userValues = req.session.user;

            // remove values that should not be able to be seen in template or session
            ['password', 'registerDate', "createdAt", "updatedAt"].forEach(e => delete userValues[e]);
            app.locals.user = userValues;
            res.redirect('/profile');
        }).catch(error => {
            res.redirect('/register');
        });
    });

// route for user's profile
app.get('/profile', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.render('pages/profile');
    } else {
        res.redirect('/login');
    }
});

// admin route
app.get('/admin', sessionChecker, function (req, res) {
    if (req.session.user && req.cookies.user_sid) {
        if (req.session.user.isAdmin) {
            res.render('pages/admin');
        } else {
            res.redirect('/profile');
        }
    } else {
        res.redirect('/');
    }
});

// route for user logout
app.get('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

app.get("/search/:query", (req, res, next) => {
    // unescape url query parameter
    req.params.query = querystring.unescape(req.params.query);
    if (req.params.query) {
        axios.put('http://localhost:3000/api/search', {search: req.params.query}).then((filteredBooks) => {
            if (filteredBooks.data.data.length > 0) {
                axios.get('http://localhost:3000/api/categories').then((categories) => {
                    res.render('pages/index', {books: filteredBooks.data.data, categories: categories.data.data});
                });
            } else {
                res.render('pages/index')
            }
        });
    } else {
        res.redirect('/');
    }
});

app.get("/book/:id", (req, res, next) => {
    Book.findOne({where: {id: req.params.id}}).then(function (book) {
        if (!book) {
            res.redirect('/');
        } else {
            res.render('components/book', {data: book});
        }
    });
});

app.get("/books/cat/:category", (req, res, next) => {
    Book.findAll({where: {category: req.params.category}}).then(function (books) {
        if (!books) {
            res.redirect('/');
        } else {
            res.render('pages/index', {books: books, categories: [{category: req.params.category}]});
        }
    });
});

app.get("/search", (req, res, next) => {
    res.redirect('/');
});

app.get('/about', sessionChecker, function (req, res) {
    res.render('pages/about');
});

app.get('/faq', sessionChecker, function (req, res) {
    res.render('pages/faq');
});

app.get('/gdpr', sessionChecker, function (req, res) {
    res.render('pages/gdpr');
});

// API Endpoints

app.get("/api/users", (req, res, next) => {
    User.findAll().then((users) => {
        res.json({
            "message": "success",
            "data": users
        });
    })
});

app.get("/api/books", (req, res, next) => {
    Book.findAll({
        include: [{model: BorrowedBook, required: false}]
    }).then((books) => {
        res.json({
            "message": "success",
            "data": books
        })
    });
});

app.get("/api/categories", (req, res, next) => {
    Book.findAll().then(() => {
        Book.aggregate('category', 'DISTINCT', {plain: false}).then((categories) => {
            // [ { DISTINCT: 'it' }, { DISTINCT: 'test' }, { DISTINCT: 'test2' } ] to
            // [ { category: 'it' }, { category: 'test' }, { category: 'test2' } ]
            const mappedCategories = categories.map(({DISTINCT: category}) => ({category}));

            res.json({
                "message": "success",
                "data": mappedCategories
            });
        });
    });
});

app.put("/api/search", (req, res, next) => {
    Book.findAll({
        where: {
            [Op.or]: [
                {
                    title: {
                        [Op.substring]: req.body.search
                    }
                },
                {
                    isbn: {
                        [Op.substring]: req.body.search
                    }
                },
                {
                    author: {
                        [Op.substring]: req.body.search
                    }
                },
                {
                    category: {
                        [Op.substring]: req.body.search
                    }
                },
                {
                    publicationDate: {
                        [Op.substring]: req.body.search
                    }
                },
                {
                    vendor: {
                        [Op.substring]: req.body.search
                    }
                },
                {
                    description: {
                        [Op.substring]: req.body.search
                    }
                }
            ]
        }
    }).then((books) => {
        res.json({
            "message": "success",
            "data": books
        });
    });
});

// route for handling 404 requests(unavailable routes)
app.use(function (req, res, next) {
    res.status(404).send("Sorry diese Seite gibt es nicht!")
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});
