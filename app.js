const config = require("./config.json");
const logger = require("./config/logger");

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");

const cors = require("./middlewares/cors");
const errorHandler = require("./middlewares/errorHandler");

const authRoutes = require("./routes/auth");
const bookRoutes = require("./routes/books");

const app = express();

app.use(morgan("combined", {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));

mongoose.connect(config["mongodb-connection-string"])
    .then(() => logger.info("Connexion à MongoDB réussie !"))
    .catch((error) => logger.error("Connexion à MongoDB échouée !", error));

app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
}));

app.use(express.json());
app.use(cors);

app.use("/upload", express.static(path.join(__dirname, "upload")));
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

app.use(errorHandler);

module.exports = app;