const axios = require("axios");

const book = {
    fetchBook: (bookId) => {
        return axios.post('${app.locals.domain}/api/book', {bookId: bookId});
    }
}

module.exports = book;
