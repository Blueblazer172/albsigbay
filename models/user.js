let Sequelize = require('sequelize');
let bcrypt = require('bcrypt');

// create a sequelize instance with our local postgres database information.
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'db.sqlite'
});

// setup User model and its fields.
let User = sequelize.define('users', {
    username: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true
    },
    email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    firstname: {
        type: Sequelize.STRING,
        allowNull: false
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    state: {
        type: Sequelize.STRING,
        allowNull: false
    },
    city: {
        type: Sequelize.STRING,
        allowNull: false
    },
    street: {
        type: Sequelize.STRING,
        allowNull: false
    },
    streetNumber: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    zip: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    registerDate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },
    isAdmin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
}, {
    hooks: {
        beforeCreate: (user) => {
            const salt = bcrypt.genSaltSync();
            user.password = bcrypt.hashSync(user.password, salt);
        }
    },
    paranoid: true
});

User.prototype.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

// create all the defined tables in the specified database.
sequelize.sync()
    .then(() => console.log('users table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export User model for use in other files.
module.exports = User;
