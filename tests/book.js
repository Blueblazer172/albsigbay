const axios = require("axios");

const book = {
    fetchBook: (bookId) => {
        return axios.post(`http://localhost:4000/api/book`, {bookId: bookId});
    }
}

module.exports = book;
