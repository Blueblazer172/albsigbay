const axios = require("axios");

const user = {
    createUser: () => {
        return {
            firstName: "Hannes",
            secondName: "Stefani"
        };
    },

    fetchUser: (userId) => {
        return axios.get('http://localhost:4000/api/user/' + userId);
    }
}

module.exports = user;
