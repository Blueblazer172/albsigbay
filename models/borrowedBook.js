let Sequelize = require('sequelize');
const Book = require("./book");
const User = require("./user");


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
        references: {
            model: Book,
            key: 'id'
        }
    },
    userId: {
        type: Sequelize.INTEGER,
        references: {
            model: User,
            key: 'id'
        },
        allowNull: false,
        unique: false
    },
    borrowedDate: {
        type: Sequelize.DATEONLY,
        defaultValue: Sequelize.NOW
    },
    returnDate: {
        type: Sequelize.DATEONLY,
        defaultValue: Sequelize.NOW // @TODO add 4 weeks here
    },
});

User.hasMany(BorrowedBook);
BorrowedBook.belongsTo(User);
Book.hasOne(BorrowedBook);

// create all the defined tables in the specified database.
sequelize.sync()
    .then(() => console.log('users table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export BorrowedBook model for use in other files.
module.exports = BorrowedBook;
