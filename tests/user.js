const axios = require("axios");

const user = {
    createUser: () => {
        return {
            firstName: "Hannes",
            secondName: "Stefani"
        };
    },

    fetchUser: (userId) => {
        return axios.get('${app.locals.domain}/api/user/' + userId);
    }
}

module.exports = user;
