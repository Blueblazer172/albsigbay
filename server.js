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
const multer = require('multer');
const crypto = require('crypto');
const moment = require('moment');
const port = 3000;

// Models
let User = require('./models/user');
let Book = require('./models/book');
let BorrowedBook = require('./models/BorrowedBook');

// Relations
BorrowedBook.hasMany(Book, {foreignKey: 'id', onDelete: 'NO ACTION'});
User.hasMany(BorrowedBook, {foreignKey: 'id', onDelete: 'NO ACTION'});
Book.hasMany(BorrowedBook, {foreignKey: 'id', onDelete: 'NO ACTION'});

// set template engine to ejs
app.set('view engine', 'ejs');

// include file directories
app.use(express.static(__dirname + '/public/books/covers'));
app.use(express.static(__dirname + '/views'));
app.use("/public", express.static(path.join(__dirname, "public")));

// set morgan to log info about our requests for development use.
app.use(morgan('dev'));

// parse requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// set filter for uploading images
const fileFilter = (req, file, cb) => {
    if (file.mimetype == 'image/png' || file.mimetype == 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

// set multer upload dir
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/books/covers')
    },
    filename: (req, file, cb) => {
        // generate random suffix for filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

// multer config
const upload = multer({
    fileFilter,
    storage: storage
});

// initialize cookie-parser to allow us access the cookies stored in the browser.
app.use(cookieParser());

// initialize express-session to allow to track the logged-in user across sessions.
app.use(session({
    key: 'user_sid',
    secret: crypto.randomBytes(20).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));

// This middleware will check if user's cookie is still saved in browser and
// user is not set, then automatically log the user out.
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
        res.render('pages/index', {books: books.data.data, categories: categories.data.data, isAdmin: app.locals.user.isAdmin});
    })).catch(errors => {
        console.error(errors);
    });
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

                if (req.session.user.isAdmin) {
                    res.redirect('/admin');
                } else {
                    res.redirect(`/profile/${userValues.id}`);
                }
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

        if (!req.body.state) {
            errors.push("No State specified");
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
            state: req.body.state,
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
            ['password', 'registerDate', 'createdAt', 'updatedAt'].forEach(e => delete userValues[e]);
            app.locals.user = userValues;

            res.redirect(`/profile/${userValues.id}`);
        }).catch(error => {
            res.redirect('/register');
        });
    });

// user's profile
app.get('/profile/:id', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        // check if user is actually the user who wants to access its profile
        if (req.session.user.id == req.params.id) {
            const getUser = axios.get(`http://localhost:3000/api/user/${req.params.id}`);
            const getBorrowedBooks = axios.get(`http://localhost:3000/api/user/${req.params.id}/books`);
            const getBorrowedBooksHistory = axios.get(`http://localhost:3000/api/user/${req.params.id}/books/history`);

            axios.all([getUser, getBorrowedBooks, getBorrowedBooksHistory]).then(axios.spread((...responses) => {
                const user = responses[0];
                const borrowedBooks = responses[1];
                const borrowedBooksHistory = responses[2];

                let userValues = user.data.data;
                ['password', 'registerDate', 'createdAt', 'updatedAt'].forEach(e => delete userValues[e]);
                res.render('components/profile', {
                    user: user.data.data,
                    books: borrowedBooks.data.data,
                    booksHistory: borrowedBooksHistory.data.data,
                    moment: moment
                });
            })).catch(errors => {
                console.error(errors);
            });
        } else {
            // if not redirect to user profile of logged in user
            res.redirect(`/profile/${req.session.user.id}`);
        }
    } else {
        res.redirect('/');
    }
});

// admin route
app.get('/admin', sessionChecker, function (req, res) {
    if (req.session.user && req.cookies.user_sid) {
        if (req.session.user.isAdmin) {
            axios.get('http://localhost:3000/api/books').then((books) => {
                res.render('pages/admin', {books: books.data.data});
            });
        } else {
            res.redirect(`/profile/${req.session.user.id}`);
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

app.get("/search/:query", sessionChecker, (req, res, next) => {
    // unescape url query parameter
    req.params.query = querystring.unescape(req.params.query);
    if (req.params.query) {
        axios.put('http://localhost:3000/api/search', {
            search: req.params.query
        }).then((filteredBooks) => {
            if (filteredBooks.data.data.length > 0) {
                axios.get('http://localhost:3000/api/categories').then((categories) => {
                    res.render('pages/index', {
                        books: filteredBooks.data.data,
                        categories: categories.data.data,
                        isAdmin: app.locals.user.isAdmin
                    });
                });
            } else {
                res.render('pages/index');
            }
        });
    } else {
        res.redirect('/');
    }
});

app.get("/book/:id", sessionChecker, (req, res, next) => {
    Book.findOne({where: {id: req.params.id}}).then(function (book) {
        if (!book) {
            res.redirect('/');
        } else {
            res.render('components/book', {book: book, user: app.locals.user});
        }
    });
});

app.get("/books/cat/:category", sessionChecker, (req, res, next) => {
    Book.findAll({where: {category: req.params.category}}).then(function (books) {
        if (!books) {
            res.redirect('/');
        } else {
            res.render('pages/index', {
                books: books,
                categories: [
                    {category: req.params.category}
                ],
                isAdmin: app.locals.user.isAdmin
            });
        }
    });
});

app.route('/books/add')
    .get((req, res) => {
        res.render('components/book/add');
    })
    .post(upload.single('cover'), (req, res, next) => {
        const file = req.file;
        if (!file) {
            const error = new Error("Bitte eine Datei hochladen!");
            error.httpStatusCode = 400;
            return next(error);
        }

        const book = {
            title: req.body.title,
            isbn: req.body.isbn,
            author: req.body.author,
            pages: req.body.pages,
            description: req.body.description,
            category: req.body.category,
            vendor: req.body.vendor,
            publicationDate: req.body.publicationDate,
            cover: file.filename
        };

        Book.create(book).then((res) => {
            res.redirect('/admin');
        }).catch((error) => {
            console.error(error.message)
        });
});

app.get('/book/edit/:id', (req, res, next) => {
    Book.findOne({where: {id: req.params.id}}).then(function (book) {
        if (!book) {
            res.redirect('/');
        } else {
            res.render('components/book/edit', {book: book.dataValues});
        }
    });
});

app.post('/book/update/:id', upload.single('cover'), (req, res, next) => {
    const formValues = {
        title: req.body.title,
        isbn: req.body.isbn,
        author: req.body.author,
        pages: req.body.pages,
        description: req.body.description,
        category: req.body.category.toLowerCase(),
        vendor: req.body.vendor,
        publicationDate: req.body.publicationDate
    };

    let updatedValuesForModel = [];
    Book.findOne({where: {id: req.params.id}}).then((book) => {
        Object.entries(formValues).forEach(([key, value]) => {
            // update only changed values
            if (book.dataValues[key] != value) {
                updatedValuesForModel[key] = value;
            }
        });

        Book.update(updatedValuesForModel, {where: {id: req.params.id}}).then(() => {
            res.redirect('/admin');
        }).catch((error) => {
            console.error(error.message)
        });
    });
});

app.post("/profile/name/:id", (req, res, next) => {
    User.findOne({where: {id: req.params.id}}).then((user) => {
        if (!user) {
            res.json({
                "message": "failure",
                "data": null
            });
        } else {
            User.update({firstname: req.body.firstname, name: req.body.name}, {where: {id: req.params.id}})
                .then(() => {
                    res.redirect(`/profile/${req.params.id}`);
                });
        }
    });
});

app.post("/profile/password/:id", (req, res, next) => {
    User.findOne({where: {id: req.params.id}}).then(async (user) => {
        if (!user) {
            res.json({
                "message": "failure",
                "data": null
            });
        } else {
            let errors = [];

            // check old password is actually old password py comparing the hash
            if (!user.validPassword(req.body.oldPassword)) {
                errors.push('oldPassword is not current user password');
            }

            // check for password has changed from old password
            // @TODO fix this bug not working as expected
            // if (user.validPassword(req.body.oldPassword) === user.validPassword(req.body.newPassword)) {
            //     errors.push('oldPassword cannot be the new password');
            // }

            // check if newPassword is reNewPassword
            if (req.body.newPassword !== req.body.reNewPassword) {
                errors.push('reNewPassword is not the same as newPassword');
            }

            if (errors.length) {
                // @TODO render errors in template
                res.status(400).json({"error": errors.join(", ")});
                return;
            }

            // generate hash for newPassword and update password column in user table
            let newPassword = await user.generateHash(req.body.newPassword);
            User.update({password: newPassword}, {where: {id: req.params.id}}).then(() => {
                // logout user after successful changed password
                res.redirect('/logout');
            });
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

app.get("/api/user/:id", (req, res, next) => {
    User.findOne({where: {id: req.params.id}}).then((user) => {
        if (!user) {
            res.json({
                "message": "failure",
                "data": null
            });
        } else {
            res.json({
                "message": "success",
                "data": user
            });
        }
    });
});

app.get("/api/user/:id/books", (req, res, next) => {
    Book.findAll({
        include: [{
            model: BorrowedBook,
            required: true,
            where: {
                userId: req.params.id
            }
        }]
    }).then((borrowedBooks) => {
        if (!borrowedBooks || borrowedBooks.length <= 0) {
            res.json({
                "message": 'failure',
                "data": {
                    message: 'Keine ausgeliehene Bücher!'
                }
            });
        } else {
            res.json({
                "message": 'success',
                "data": borrowedBooks
            });
        }
    });
});

app.get("/api/user/:id/books/history", (req, res, next) => {
    Book.findAll({
        include: [{
            model: BorrowedBook,
            required: true,
            paranoid: false, // get only soft-deleted rows
            where: {
                userId: req.params.id
            }
        }]
    }).then((borrowedBooks) => {
        if (!borrowedBooks || borrowedBooks.length <= 0) {
            res.json({
                "message": 'failure',
                "data": {
                    message: 'Keine vergangen Ausleihen!'
                }
            });
        } else {
            res.json({
                "message": 'success',
                "data": borrowedBooks
            });
        }
    });
});

app.delete("/api/user/:id", (req, res, next) => {
    if (app.locals.user) {
        // check if user is actually the user who wants to delete its profile
        if (req.session.user.id == req.params.id) {
            // soft delete user
            User.destroy({where: {id: req.params.id}}).then(() => {
                // @TODO fix relations when user deleted profile
                BorrowedBook.destroy({where: {userId: req.params.id}});
                res.redirect(303, '/logout');
            });
        }
    } else {
        res.redirect(`/profile/${req.session.user.id}`);
    }
});

app.post('/api/book/borrow/:bookId', sessionChecker, (req, res, next) => {
    if (!app.locals.user.isAdmin) {
        const borrowedBook = {
            bookId: req.params.bookId,
            userId: app.locals.user.id,
        }

        BorrowedBook.create(borrowedBook).then(() => {
            res.json({
                "message": 'success',
                "data": {
                    userId: req.session.user.id
                }
            });
        }).catch((error) => {
            res.json({
                "message": 'failure',
                "data": {
                    message: error.message
                }
            });
        });
    } else {
        res.json({
            "message": 'failure',
            "data": {
                message: 'Admins can\'t borrow books!'
            }
        });
    }
});

app.delete('/api/book/return/:bookId', sessionChecker, (req, res, next) => {
    // @TODO check if user is really the user who borrowed the book
    if (req.session.user.id === app.locals.user.id) {
        BorrowedBook.destroy({where: {bookId: req.params.bookId, userId: app.locals.user.id}}).then(() => {
            res.json({
                "message": 'success',
                "data": {
                    userId: req.session.user.id
                }
            });
        }).catch((error) => {
            res.json({
                "message": 'failure',
                "data": {
                    message: error.message
                }
            });
        });
    } else {
        res.json({
            "message": 'failure',
            "data": {
                message: 'You are not the user who borrowed the book!'
            }
        });
    }
});

// route for handling 404 requests(unavailable routes)
app.use(function (req, res, next) {
    res.status(404).send("Sorry diese Seite gibt es nicht!")
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});
