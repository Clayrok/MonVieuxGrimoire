const logger = require('../config/logger');

const path = require('path');
const fs = require('fs');

const Book = require('../models/Book');

exports.getAll = (req, res, next) => {
    logger.info("Récupération des livres...");
    Book.find()
        .then(books => {
            logger.info("Livres trouvés.");
            return res.status(200).json(books);
        })
        .catch(error => {
            logger.error("Une erreur est survenue lors de la récupération des livres.", error);
            next({ status: 400, message: error.message })
        });
};

exports.getById = (req, res, next) => {
    if (req.params.id) {
        logger.info("Récupération du livre...");
        Book.findOne({ _id: req.params.id })
            .then(book => {
                logger.info("Livre trouvé.");
                return res.status(200).json(book);
            })
            .catch(error => {
                logger.error("Une erreur est survenue lors de la récupération du livre.", error);
                next({ status: 500, message: error.message });
            });
    }
    else {
        logger.error("ID invalide.");
        next({ status: 500 });
    }
};

exports.getBestRatedTrio = (req, res, next) => {
    logger.info("Récupération des 3 meilleurs livres...");
    Book.find()
        .sort({ averageRating: -1 })
        .limit(3)
        .then(books => {
            logger.info("Livres trouvés.");
            return res.status(200).json(books);
        })
        .catch(error => {
            logger.error("Une erreur est survenue lors de la récupération des livres.", error);
            next({ status: 400, message: error.message });
        });
};

exports.create = (req, res, next) => {
    try {
        logger.info("Parsing des données du livre reçues...");
        const bookObject = JSON.parse(req.body.book);
        logger.info("Parsing des données du livre réussi.");

        const imageUrl = `${req.protocol}://${req.get('host')}/upload/${req.file.filename}`;

        const book = new Book({
            userId: bookObject.userId,
            title: bookObject.title,
            author: bookObject.author,
            imageUrl: imageUrl,
            year: bookObject.year,
            genre: bookObject.genre,
            ratings: bookObject.ratings,
            averageRating: bookObject.ratings[0].grade
        });

        logger.info("Ajout du nouveau livre en base de données...");
        book.save()
            .then(() => {
                logger.info("Livre ajouté.");
                return res.status(201).json("Livre créé.");
            })
            .catch(error => {
                logger.error("Une erreur est survenue lors de l'ajout du livre.", error);
                next({ status: 500, message: error.message });
            });
    } catch (error) {
        logger.error("Une erreur est survenue lors de la création du livre.", error);
        return next({ status: 500 });
    }
};

exports.update = (req, res, next) => {
    if (req.params.id && req.auth.userId) {
        logger.info("Récupération du livre...");
        Book.findOne({ _id: req.params.id, userId: req.auth.userId })
            .then(book => {
                if (book) {
                    logger.info("Livre trouvé.");
                    try {
                        logger.info("Parsing des données du livre reçues...");
                        let reqBook = req.file ? JSON.parse(req.body.book) : req.body;
                        logger.info("Parsing des données du livre réussi.");

                        if (req.file) reqBook.imageUrl = `${req.protocol}://${req.get('host')}/upload/${req.file.filename}`;

                        if (book.imageUrl) {
                            fs.promises.rm(getImagePath(book.imageUrl), { force: true });
                        }

                        logger.info("Mise à jour du livre...");
                        Book.findOneAndUpdate({ _id: req.params.id, userId: req.auth.userId }, reqBook, { new: true })
                            .then(updatedBook => {
                                logger.info("Mise à jour du livre réussie.");
                                return res.status(200).json(updatedBook);
                            });
                    } catch (error) {
                        logger.error("Une erreur est survenue lors de la mise à jour du livre.", error);
                        return next({ status: 500, message: error.message });
                    }
                }
                else {
                    logger.warn("Ce livre n'existe pas.", error);
                    return next({ status: 500, message: "Ce livre n'existe pas." });
                }
            })
            .catch(error => {
                logger.error("Une erreur est survenue lors de la récupération du livre.", error);
                next({ status: 500, message: error.message });
            });
    }
    else {
        logger.error("ID utilisateur ou du livre invalide.");
        return next({ status: 500 });
    }
};

exports.delete = (req, res, next) => {
    if (req.params.id && req.auth.userId) {
        logger.info("Récupération du livre...");
        Book.findOne({ _id: req.params.id, userId: req.auth.userId })
            .then(book => {
                if (book) {
                    logger.info("Récupération du livre réussie.");

                    logger.info("Suppression du livre...");
                    Book.deleteOne({ _id: req.params.id, userId: req.auth.userId })
                        .then(response => {
                            const imagePath = getImagePath(book.imageUrl);
                            if (imagePath) fs.promises.rm(imagePath, { force: true });

                            logger.info("Suppression du livre réussie.");
                            return res.status(200).json("Livre supprimé avec succès");
                        })
                }
                else {
                    logger.warn("Ce livre n'existe pas.");
                    return next({ status: 400, message: "Ce livre n'existe pas." });
                }
            })
            .catch(error => {
                logger.error("Une erreur est survenue lors de la suppression du livre.", error);
                next({ status: 500 });
            })

    }
    else {
        logger.error("ID utilisateur ou du livre invalide.");
        return next({ status: 500 });
    }
};

exports.rating = (req, res, next) => {
    if (req.body.rating && req.params.id) {
        if (req.body.rating < 0 || req.body.rating > 5) {
            logger.error(`Notation < 0 ou > 5 (${req.body.rating}).`);
            return next({ status: 400 });
        }

        logger.info("Récupération du livre...");
        Book.findOne({ _id: req.params.id })
            .then(book => {
                logger.info("Livre trouvé.");

                let hasUserAlreadyRated = false;
                let totalRatings = 0;
                book.ratings.forEach(rating => {
                    totalRatings += rating.grade;

                    if (rating.userId == req.auth.userId) hasUserAlreadyRated = true;
                });

                if (hasUserAlreadyRated) {
                    logger.warn("Cet utilisateur a déjà noté ce livre.");
                    return next({ status: 400, message: "Cet utilisateur a déjà noté ce livre." });
                }
                else {
                    totalRatings += req.body.rating;
                    book.ratings.push({
                        userId: req.auth.userId,
                        grade: req.body.rating
                    });
                    book.averageRating = Math.round(totalRatings / book.ratings.length);

                    logger.info("Sauvegarde des changements de notation...");
                    book.save();
                    logger.info("Sauvegarde des changements de notation réussie.");
                    return res.status(200).json(book)
                }
            })
            .catch(error => {
                logger.error("Une erreur est survenue lors de la notation du livre.", error);
                next({ status: 500, message: error.message });
            })
    }
    else {
        logger.error("ID du livre ou note invalide.");
        return next({ status: 500 });
    }
}

const getImagePath = (imageUrl) => {
    if (!imageUrl) return null;
    const filename = path.basename(imageUrl);
    return path.join(__dirname, '..', 'upload', filename);
};