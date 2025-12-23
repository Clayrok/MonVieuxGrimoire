const config = require("./config.json")

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const cors = require('./middlewares/cors');
const errorHandler = require('./middlewares/errorHandler')

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

app.use(errorHandler);

module.exports = app;