// API Endpoints
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = 4000;

// Models
let User = require('./models/user');
let Book = require('./models/book');
let BorrowedBook = require('./models/BorrowedBook');

// Relations
BorrowedBook.hasMany(Book, {foreignKey: 'id', onDelete: 'NO ACTION'});
Book.hasMany(BorrowedBook, {foreignKey: 'id', onDelete: 'NO ACTION'});

User.hasMany(BorrowedBook, {foreignKey: 'id'});
BorrowedBook.hasMany(User, {foreignKey: 'id', onDelete: 'NO ACTION'})

// parse requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', (req, res, next) => {
   return res.status(404).json({
       'message': 'failure',
       'data': 'Not Logged In!'
   });
});

app.get('/api/users', (req, res, next) => {
    User.findAll({
        attributes: [
            'id',
            'firstname',
            'name',
            'username',
            'email',
            'city',
            'state',
            'zip',
            'street',
            'streetNumber',
            'isAdmin',
            'registerDate'
        ]
    }).then((users) => {
        res.json({
            'message': 'success',
            'data': users
        });
    })
});

app.get('/api/books', (req, res, next) => {
    Book.findAll({
        include: [{model: BorrowedBook, required: false}]
    }).then((books) => {
        res.json({
            'message': 'success',
            'data': books
        })
    });
});

app.get('/api/categories', (req, res, next) => {
    Book.findAll().then(() => {
        Book.aggregate('category', 'DISTINCT', {plain: false}).then((categories) => {
            // [ { DISTINCT: 'it' }, { DISTINCT: 'test' }, { DISTINCT: 'test2' } ] to
            // [ { category: 'it' }, { category: 'test' }, { category: 'test2' } ]
            const mappedCategories = categories.map(({DISTINCT: category}) => ({category}));

            res.json({
                'message': 'success',
                'data': mappedCategories
            });
        });
    });
});

app.put('/api/search', (req, res, next) => {
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
            'message': 'success',
            'data': books
        });
    });
});

app.get('/api/user/:id', (req, res, next) => {
    User.findOne({
        attributes: [
            'id',
            'firstname',
            'name',
            'username',
            'email',
            'city',
            'state',
            'zip',
            'street',
            'streetNumber',
            'isAdmin',
            'registerDate'
        ],
        where: {id: req.params.id}
    }).then((user) => {
        if (!user) {
            res.json({
                'message': 'failure',
                'data': null
            });
        } else {
            res.json({
                'message': 'success',
                'data': user
            });
        }
    });
});

app.get('/api/user/:id/books', (req, res, next) => {
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
                'message': 'failure',
                'data': {
                    message: 'Keine ausgeliehene Bücher!'
                }
            });
        } else {
            res.json({
                'message': 'success',
                'data': borrowedBooks
            });
        }
    });
});

app.get('/api/user/:id/books/history', (req, res, next) => {
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
                'message': 'failure',
                'data': {
                    message: 'Keine vergangen Ausleihen!'
                }
            });
        } else {
            res.json({
                'message': 'success',
                'data': borrowedBooks
            });
        }
    });
});

app.delete('/api/user/:id', (req, res, next) => {
    // check if user is actually the user who wants to delete its profile
    if (app.locals.user && parseInt(app.locals.user.id) === parseInt(req.params.id)) {
        // soft delete user
        User.destroy({where: {id: req.params.id}}).then(() => {
            // @TODO fix relations when user deleted profile
            BorrowedBook.destroy({where: {userId: req.params.id}});
            res.redirect(303, '/logout');
        });
    } else {
        res.redirect('/');
    }
});

app.post('/api/book/borrow/:bookId', (req, res, next) => {
    if (!app.locals.isAdmin) {
        if (app.locals.user) {
            const borrowedBook = {
                bookId: req.params.bookId,
                userId: app.locals.user.id,
            }

            // @TODO write RAW SQL for borrow book
            BorrowedBook.create(borrowedBook).then(() => {
                res.json({
                    'message': 'success',
                    'data': {
                        userId: app.locals.user.id
                    }
                });
            }).catch((error) => {
                res.json({
                    'message': 'failure',
                    'data': {
                        message: error.message
                    }
                });
            });
        } else {
            res.json({
                'message': 'failure',
                'data': {
                    message: 'Not logged in!'
                }
            });
        }
    } else {
        res.json({
            'message': 'failure',
            'data': {
                message: 'Admins can\'t borrow books!'
            }
        });
    }
});

app.delete('/api/book/return/:bookId', (req, res, next) => {
    // check if user is really the user who borrowed the book
    if (app.locals.user && parseInt(app.locals.user.id) === parseInt(req.params.id)) {
        // @TODO write RAW SQL for return book
        BorrowedBook.destroy({where: {bookId: req.params.bookId, userId: app.locals.user.id}}).then(() => {
            res.json({
                'message': 'success',
                'data': {
                    userId: app.locals.user.id
                }
            });
        }).catch((error) => {
            res.json({
                'message': 'failure',
                'data': {
                    message: error.message
                }
            });
        });
    } else {
        res.json({
            'message': 'failure',
            'data': {
                message: 'You are not the user who borrowed the book!'
            }
        });
    }
});

app.listen(port, () => {
    console.log(`Api listening at http://localhost:${port}`)
});
