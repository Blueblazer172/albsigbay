let Sequelize = require('sequelize');
const Book = require("./book");
const User = require("./user");
const moment = require("moment");

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
        unique: true
    },
    userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: false,
        onDelete: 'CASCADE',
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
});

User.hasMany(BorrowedBook, {foreignKey: 'id'});
BorrowedBook.belongsTo(User, {foreignKey: 'id'});

Book.hasOne(BorrowedBook);
BorrowedBook.hasMany(Book, {foreignKey: 'id', onDelete: 'RESTRICT'})

// create all the defined tables in the specified database.
sequelize.sync()
    .then(() => console.log('users table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export BorrowedBook model for use in other files.
module.exports = BorrowedBook;
