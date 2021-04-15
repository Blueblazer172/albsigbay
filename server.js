const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const port = 3000;

app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/assets'));
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());
app.use((request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname + '/views/pages/about.html'));
});

app.get('/faq', (req, res) => {
    res.sendFile(path.join(__dirname + '/views/pages/faq.html'));
});

app.get('/datenschutz', (req, res) => {
    res.sendFile(path.join(__dirname + '/views/pages/datenschutz.html'));
});

app.get('/impressum', (req, res) => {
    res.sendFile(path.join(__dirname + '/views/pages/impressum.html'));
});

app.get('/book', (req, res) => {
    res.sendFile(path.join(__dirname + '/views/components/book.html'));
});

app.get('/edit-book', (req, res) => {
    res.sendFile(path.join(__dirname + '/views/components/edit-book.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname + '/views/components/profile.html'));
});

app.get('/verwaltung', (req, res) => {
    res.sendFile(path.join(__dirname + '/views/components/verwaltung.html'));
});


// Handle login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname + '/views/pages/login.html'));
});

app.post('/login', (req, res) => {
    //@TODO handle post login
});

// Handle register
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname + '/views/pages/register.html'));
});

app.post('/register', (req, res) => {
    let errors = [];

    if (!req.body.firstname || req.body.firstname === '') {
        errors.push('No firstname given');
    }

    if (!req.body.name || req.body.name === '') {
        errors.push('No name given');
    }

    if (!req.body.email || req.body.email === '') {
        errors.push('No email given');
    }

    if (req.body.email !== req.body.reEmail) {
        errors.push('Emails are not the same');
    }

    if (!req.body.password || req.body.password === '') {
        errors.push('No password given');
    }

    if (req.body.password !== req.body.rePassword) {
        errors.push('Passwords are not the same');
    }

    if (!req.body.city || req.body.city === '') {
        errors.push('No city given');
    }

    if (!req.body.street || req.body.street === '') {
        errors.push('No street given');
    }

    if (!req.body.zip || req.body.zip === '') {
        errors.push('No zip given');
    }

    if (!req.body.streetNumber || req.body.streetNumber === '') {
        errors.push('No street number given');
    }

    if (errors.length > 0) {
        res.status(400).json({errors: errors});
        return;
    }

    // handle register and connect database
    let userData = {
        firstname: req.body.firstname,
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        city: req.body.city,
        street: req.body.street,
        zip: req.body.zip,
        streetNumber: req.body.streetNumber
    }


});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
