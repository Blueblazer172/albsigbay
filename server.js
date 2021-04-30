// Server Endpoints
const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');
const querystring = require('querystring');
const {Op} = require('sequelize');
const morgan = require('morgan');
const multer = require('multer');
const moment = require('moment');
const port = 3000;

// import jwt auth file
const jwt = require('./jwt');

// Models
let User = require('./models/user');
let Book = require('./models/book');
let BorrowedBook = require('./models/BorrowedBook');

// Relations
BorrowedBook.hasMany(Book, {foreignKey: 'id', onDelete: 'NO ACTION'});
Book.hasMany(BorrowedBook, {foreignKey: 'id', onDelete: 'NO ACTION'});

User.hasMany(BorrowedBook, {foreignKey: 'id'});
BorrowedBook.hasMany(User, {foreignKey: 'id', onDelete: 'NO ACTION'})

// set template engine to ejs
app.set('view engine', 'ejs');

// include file directories
app.use(express.static(__dirname + '/public/books/covers'));
app.use(express.static(__dirname + '/views'));
app.use('/public', express.static(path.join(__dirname, 'public')));

// set morgan to log info about our requests for development use.
app.use(morgan('dev'));

// parse requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// set filter for uploading images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.toString() === 'image/png' || file.mimetype.toString() === 'image/jpeg') {
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

// This middleware will check if user's token is still valid and
// user is not set, then automatically log the user out.
app.use((req, res, next) => {
    if (!app.locals.user && app.locals.token) {
        app.locals.token = null;
        res.redirect('/');
    } else {
        // initialize global var
        // globally set payload options
        if (app.locals.token) {
            let decodedOptions = jwt.decode(app.locals.token);
            app.locals.payload = decodedOptions.payload;
            app.locals.isAdmin = decodedOptions.payload.isAdmin;
        } else {
            app.locals.payload = null
            app.locals.isAdmin = null
        }

        next();
    }
});

// // middleware function to check for logged-in users
let tokenChecker = (req, res, next) => {
    if (app.locals.user && app.locals.token) {
        let verifyOptions = {
            issuer: 'AlbsigBay',
            subject: app.locals.user.email,
            audience: app.locals.user.id.toString()
        };

        let isValid = jwt.verify(app.locals.token, verifyOptions);

        if (!isValid) {
            // remove token
            app.locals.token = null;
            res.redirect('/');
        }

        if (req.originalUrl.includes('login')) {
            // if logged in as user deny access to login route
            res.redirect('/');
        } else if (req.originalUrl.includes('register')) {
            // if logged in as user deny access to login register
            res.redirect('/');
        } else {
            // redirect to called page if not register or login;
            next();
        }
    } else {
        next();
    }
};

// index page
app.get('/', tokenChecker, (req, res, next) => {
    const getBooks = axios.get('http://localhost:4000/api/books');
    const getCategories = axios.get('http://localhost:4000/api/categories');

    axios.all([getBooks, getCategories]).then(axios.spread((...responses) => {
        const books = responses[0];
        const categories = responses[1];
        res.render('pages/index', {
            books: books.data.data,
            categories: categories.data.data,
            isAdmin: app.locals.isAdmin
        });
    })).catch(errors => {
        console.error(errors);
    });
});

// route for user login
app.route('/login')
    .get((req, res) => {
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
        }).then((user) => {
            if (!user) {
                res.redirect('/login');
            } else if (!user.validPassword(password)) {
                res.redirect('/login');
            } else {
                let signOptions = {
                    issuer: 'AlbsigBay',
                    subject: user.email,
                    audience: user.id.toString()
                };

                let payload = {
                    isAdmin: user.isAdmin,
                }

                // set global required vars
                app.locals.token = jwt.sign(payload, signOptions);
                app.locals.user = user.dataValues;

                if (app.locals.user.isAdmin) {
                    res.redirect('/admin');
                } else {
                    res.redirect(`/profile/${app.locals.user.id}`);
                }
            }
        });
    });

// route for user registration
app.route('/register')
    .get((req, res) => {
        res.render('pages/register');
    })
    .post((req, res) => {
        let errors = [];

        if (!req.body.firstname) {
            errors.push('No First Name specified');
        }

        if (!req.body.email) {
            errors.push('No Email specified');
        }

        if (!req.body.password) {
            errors.push('No Password specified');
        }

        if (!req.body.rePassword) {
            errors.push('No RE-Password specified');
        }

        if (req.body.password !== req.body.rePassword) {
            errors.push('Passwords do not match.');
        }

        if (!req.body.city) {
            errors.push('No City specified');
        }

        if (!req.body.street) {
            errors.push('No Street specified');
        }

        if (!req.body.state) {
            errors.push('No State specified');
        }

        if (!req.body.name) {
            errors.push('No Name specified');
        }

        if (!req.body.zip) {
            errors.push('No Zip specified');
        }

        if (!req.body.streetNumber) {
            errors.push('No Street Number specified');
        }

        if (errors.length) {
            // @TODO render errors in template
            res.status(400).json({'error': errors.join(', ')});
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
            let signOptions = {
                issuer: 'AlbsigBay',
                subject: user.email,
                audience: user.id.toString()
            };

            let payload = {
                isAdmin: user.isAdmin,
            }

            // generate jwt token and set global vars
            app.locals.token = jwt.sign(payload, signOptions);
            app.locals.user = user.dataValues;

            // redirect to profile page
            res.redirect(`/profile/${app.locals.user.id}`);
        }).catch(error => {
            res.redirect('/register');
        });
    });

// user's profile
app.get('/profile/:id', tokenChecker, (req, res) => {
    if (!app.locals.user || (app.locals.user && (parseInt(app.locals.user.id) !== parseInt(req.params.id)))) {
        res.redirect('/');
    } else {
        const getUser = axios.get(`http://localhost:4000/api/user/${req.params.id}`);
        const getBorrowedBooks = axios.get(`http://localhost:4000/api/user/${req.params.id}/books`);
        const getBorrowedBooksHistory = axios.get(`http://localhost:4000/api/user/${req.params.id}/books/history`);

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
    }

});

// admin route
app.get('/admin', tokenChecker, (req, res, next) => {
    if (!app.locals.isAdmin) {
        res.redirect('/');
    } else {
        axios.get('http://localhost:4000/api/books').then((books) => {
            res.render('pages/admin', {books: books.data.data});
        });
    }
});

// route for user logout
app.get('/logout', (req, res) => {
    app.locals.token = null;
    app.locals.user = null;
    res.redirect('/');
});

app.get('/search/:query', (req, res, next) => {
    // unescape url query parameter
    req.params.query = querystring.unescape(req.params.query);
    if (req.params.query) {
        axios.put('http://localhost:4000/api/search', {
            search: req.params.query
        }).then((filteredBooks) => {
            if (filteredBooks.data.data.length > 0) {
                axios.get('http://localhost:4000/api/categories').then((categories) => {
                    res.render('pages/index', {
                        books: filteredBooks.data.data,
                        categories: categories.data.data,
                        isAdmin: app.locals.isAdmin
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

app.get('/book/:id', (req, res, next) => {
    Book.findOne({where: {id: req.params.id}}).then((book) => {
        if (!book) {
            res.redirect('/');
        } else {
            res.render('components/book', {book: book, isAdmin: app.locals.isAdmin});
        }
    });
});

app.get('/books/cat/:category', (req, res, next) => {
    Book.findAll({where: {category: req.params.category}}).then((books) => {
        if (!books) {
            res.redirect('/');
        } else {
            res.render('pages/index', {
                books: books,
                categories: [
                    {category: req.params.category}
                ],
                isAdmin: app.locals.isAdmin
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
            const error = new Error('Bitte eine Datei hochladen!');
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
    Book.findOne({where: {id: req.params.id}}).then((book) => {
        if (!book) {
            res.redirect('/');
        } else {
            res.render('components/book/edit', {book: book.dataValues});
        }
    });
});

app.post('/book/update/:id', upload.single('cover'), (req, res, next) => {
    const file = req.file;
    if (!file) {
        const error = new Error('Bitte eine Datei hochladen!');
        error.httpStatusCode = 400;
        return next(error);
    }

    const formValues = {
        title: req.body.title,
        isbn: req.body.isbn,
        author: req.body.author,
        pages: req.body.pages,
        description: req.body.description,
        category: req.body.category.toLowerCase(),
        vendor: req.body.vendor,
        publicationDate: req.body.publicationDate,
        cover: file.filename
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

app.post('/profile/name/:id', (req, res, next) => {
    User.findOne({where: {id: req.params.id}}).then((user) => {
        if (!user) {
            res.json({
                'message': 'failure',
                'data': null
            });
        } else {
            User.update({firstname: req.body.firstname, name: req.body.name}, {where: {id: req.params.id}})
                .then(() => {
                    res.redirect(`/profile/${req.params.id}`);
                });
        }
    });
});

app.post('/profile/password/:id', (req, res, next) => {
    User.findOne({where: {id: req.params.id}}).then(async (user) => {
        if (!user) {
            res.json({
                'message': 'failure',
                'data': null
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
                res.status(400).json({'error': errors.join(', ')});
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

app.get('/search', (req, res, next) => {
    res.redirect('/');
});

app.get('/about', (req, res, next) => {
    res.render('pages/about');
});

app.get('/faq', (req, res, next) => {
    res.render('pages/faq');
});

app.get('/gdpr', (req, res, next) => {
    res.render('pages/gdpr');
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});
