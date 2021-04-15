const express = require('express');
const app = express();
const path = require('path');
const port = 3000;

app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/assets'));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/about', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/pages/about.html'));
});

app.get('/faq', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/pages/faq.html'));
});

app.get('/datenschutz', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/pages/datenschutz.html'));
});

app.get('/impressum', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/pages/impressum.html'));
});

app.get('/book', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/components/book.html'));
});

app.get('/edit-book', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/components/edit-book.html'));
});

app.get('/profile', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/components/profile.html'));
});

app.get('/verwaltung', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/components/verwaltung.html'));
});


// Handle login
app.get('/login', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/pages/login.html'));
});

app.post('/login', function(req, res) {
    //@TODO handle post login
});

// Handle register
app.get('/register', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/pages/register.html'));
});

app.post('/register', function(req, res) {
    //@TODO handle post register
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
