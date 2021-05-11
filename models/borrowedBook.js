let Sequelize = require('sequelize');
const moment = require('moment');
const Book = require('./book');
const User = require('./user');

// create a sequelize instance with our local postgres database information.
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'db.sqlite',
    logging: false // @TODO needs to be commented in before release
});

// setup Book model and its fields.
let BorrowedBook = sequelize.define('borrowedBooks', {
    bookId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: false,
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

// create the defined table in the specified database.
sequelize.sync().catch(error => console.log('This error occured', error));

// export BorrowedBook model for use in other files.
module.exports = BorrowedBook;
