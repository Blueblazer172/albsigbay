let Sequelize = require('sequelize');
const moment = require('moment');
const Book = require('./book');
const User = require('./user');

// create a sequelize instance with our local postgres database information.
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'db.sqlite'
});

// setup Book model and its fields.
let BorrowedBook = sequelize.define('borrowedBooks', {
    bookId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        onDelete: 'No ACTION',
        references: {
            model: Book,
            key: 'id'
        }
    },
    userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: false,
        onDelete: 'No ACTION',
        references: {
            model: User,
            key: 'id'
        }
    },
    borrowedDate: {
        type: Sequelize.DATE,
        defaultValue: moment()
    },
    returnDate: {
        type: Sequelize.DATE,
        defaultValue: moment().add(4, 'weeks')
    }
}, {
    paranoid: true
});

// create all the defined tables in the specified database.
sequelize.sync()
    .then(() => console.log('users table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export BorrowedBook model for use in other files.
module.exports = BorrowedBook;
