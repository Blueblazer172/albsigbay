const sqlite3 = require('sqlite3').verbose();
const DB_NAME = 'db.sqlite';

let db = new sqlite3.Database(DB_NAME, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`
            CREATE TABLE users
            (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                surname      text,
                name         text,
                email        text NOT NULL UNIQUE,
                password     text,
                city         text,
                zip          INTEGER,
                street       text,
                streetNumber INTEGER,
                rights       text,
                CONSTRAINT email_unique UNIQUE (email)
            )`, (err) => {
            if (err) console.log('Already created users Table');
        });

        db.run(`
            CREATE TABLE books
            (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                title           text,
                isbn            INTEGER NOT NULL UNIQUE,
                author          text,
                pages           INTEGER,
                description     text,
                category        text,
                vendor          text,
                publicationDate text,
                cover           text,
                CONSTRAINT isbn_unique UNIQUE (isbn)
            )`, (err) => {
            if (err) console.log('Already created books Table');
        });

        db.run(`
            CREATE TABLE borrowedBooks
            (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                bookId       INTEGER NOT NULL,
                userId       INTEGER NOT NULL,
                borrowedDate text,
                returnDate   text,
                FOREIGN KEY (bookId) REFERENCES books (bookId)
                FOREIGN KEY (userId) REFERENCES users(userId)
            )`, (err) => {
            if (err) console.log('Already created borrowedBooks Table');
        });
    }
});

module.exports = db;
