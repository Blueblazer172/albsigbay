const Sequelize = require('sequelize');

// create a sequelize instance with our local postgres database information.
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'db.sqlite',
    logging: false // @TODO needs to be commented in before release
});

// setup Book model and its fields.
let Book = sequelize.define('books', {
    title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    isbn: {
        type: Sequelize.STRING,
        allowNull: false
    },
    author: {
        type: Sequelize.STRING,
        allowNull: false
    },
    pages: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    description: {
        type: Sequelize.STRING,
        allowNull: false
    },
    category: {
        type: Sequelize.STRING,
        allowNull: false
    },
    vendor: {
        type: Sequelize.STRING,
        allowNull: false
    },
    publicationDate: {
        type: Sequelize.STRING,
        allowNull: false
    },
    cover: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

// create the defined table in the specified database.
sequelize.sync().catch(error => console.log('This error occured', error));

// export Book model for use in other files.
module.exports = Book;
