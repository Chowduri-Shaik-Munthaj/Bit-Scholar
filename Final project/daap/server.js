const express = require('express');
const path = require('path');

const app = express();
const port = 3010;

function setContentTypeForJS(res, path) {
    if (path.endsWith('.js')) {
        res.set('Content-Type', 'application/javascript');
    }
}

function setContentTypeForJSON(res, path) {
    if (path.endsWith('.json')) {
        res.set('Content-Type', 'application/json');
    }
}

app.use(express.static(path.join(__dirname, '/js_files'), setContentTypeForJS));
app.use(express.static(path.join(__dirname, '/js_libraries'), setContentTypeForJS));
app.use(express.static(path.join(__dirname, '/contracts_json'), setContentTypeForJS));
app.get('/web3j-function-library.js', (req, res) => res.sendFile(path.join(__dirname, 'web3j-function-library.js')));
// app.get('/login-page-initializer.js', (req, res) => res.sendFile(path.join(__dirname, 'login-page-initializer.js')));
//app.get('/Users.json', (req, res) => res.sendFile(path.join(__dirname, 'Users.json')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/submit', (req, res) => res.sendFile(path.join(__dirname, 'submit.html')));
app.get('/review', (req, res) => res.sendFile(path.join(__dirname, 'review.html')));
app.get('/list', (req, res) => res.sendFile(path.join(__dirname, 'list.html')));
app.get('/modify', (req, res) => res.sendFile(path.join(__dirname, 'modify.html')));

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
