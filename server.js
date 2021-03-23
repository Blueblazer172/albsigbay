const express = require('express');
const app = express();
const path = require('path');
const port = 3000;

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/about', function(req, res) {
    res.sendFile(path.join(__dirname + '/about.html'));
});

app.get('/faq', function(req, res) {
    res.sendFile(path.join(__dirname + '/faq.html'));
});

app.get('/login', function(req, res) {
    res.sendFile(path.join(__dirname + '/login.html'));
});

app.get('/gdpr', function(req, res) {
    res.sendFile(path.join(__dirname + '/gdpr.html'));
});

app.post('/login', function(req, res) {
    //@TODO handle post login
});

app.get('/register', function(req, res) {
    res.sendFile(path.join(__dirname + '/register.html'));
});

app.post('/register', function(req, res) {
    //@TODO handle post register
});

app.use(express.static(__dirname + '/plain-html-prototype'));

app.get('/proto', function(req, res) {
    res.sendFile(path.join(__dirname + '/plain-html-prototype/index.html'));
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
