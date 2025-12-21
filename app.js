const config = require("./config.json")
const express = require('express');
const mongoose = require('mongoose');
const cors = require('./middlewares/cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');

mongoose.connect(config["mongodb-connection-string"])
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch((error) => console.log('Connexion à MongoDB échouée !', error));

const app = express();

app.use(express.json());

app.use(cors);

app.use('/upload', express.static(path.join(__dirname, 'upload')));

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);

module.exports = app;