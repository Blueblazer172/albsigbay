const express = require('express');
const app = express();
const path = require('path');
const port = 3000;

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/bt', function(req, res) {
    res.sendFile(path.join(__dirname + '/index2.html'));
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
