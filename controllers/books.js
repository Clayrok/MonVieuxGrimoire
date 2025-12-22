const path = require('path');
const fs = require('fs');
const Book = require('../models/Book');

exports.getAll = (req, res) => {
    Book.find()
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }));
};

exports.getById = (req, res) => {
    Book.findOne({ _id: req.params.id })
        .then(book => res.status(200).json(book))
        .catch(error => res.status(400).json({ error }));
};

exports.getBestRatedTrio = (req, res) => {
    Book.find()
        .sort({ averageRating: -1 })
        .limit(3)
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }));
};

exports.create = (req, res) => {
    const bookObject = JSON.parse(req.body.book);
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

    book.save()
        .then(() => {
            res.status(201).json("Livre créé.");
        })
        .catch(error => {
            res.status(400).json({ error });
        });
};

exports.update = (req, res) => {
    let reqBook = req.file ? JSON.parse(req.body.book) : req.body;
    if (req.file) reqBook.imageUrl = `${req.protocol}://${req.get('host')}/upload/${req.file.filename}`;
    Book.findOne({ _id: req.params.id, userId: req.auth.userId })
        .then(book => {
            if (book.imageUrl) {
                fs.promises.rm(getImagePath(book.imageUrl));
            }

            Book.findOneAndUpdate({ _id: req.params.id, userId: req.auth.userId }, reqBook, { new: true })
                .then(updatedBook => res.status(200).json(updatedBook));
        })
        .catch(error => res.status(400).json("Erreur lors de la mise à jour du livre sélectionné."))
};

const getImagePath = (imageUrl) => {
    if (!imageUrl) return null;
    const filename = path.basename(imageUrl);
    return path.join(__dirname, '..', 'upload', filename);

};

exports.delete = (req, res) => {
    Book.findOne({ _id: req.params.id, userId: req.auth.userId })
        .then(book => {
            Book.deleteOne({ _id: req.params.id, userId: req.auth.userId })
                .then(() => {
                    fs.promises.rm(getImagePath(book.imageUrl));
                    res.status(200).json("Livre supprimé avec succès");
            })
        })
        .catch(error => res.status(400).json("Une erreur est survenue lors de la tentative de suppression."))
};

exports.rating = (req, res) => {
    const error = "Une erreur est survenue lors de la tentative de notation.";
    if (req.body.rating < 0 || req.body.rating > 5) {
        res.status(400).json(error);
    }

    Book.findOne({ _id: req.params.id })
        .then(book => {
            let hasUserAlreadyRated = false;
            let totalRatings = 0;
            book.ratings.forEach(rating => {
                totalRatings += rating.grade;

                if (rating.userId == req.auth.userId) hasUserAlreadyRated = true;
            });

            if (hasUserAlreadyRated) {
                res.status(400).json(error);
            }
            else {
                totalRatings += req.body.rating;
                book.ratings.push({
                    userId: req.auth.userId,
                    grade: req.body.rating
                });
                book.averageRating = Math.round(totalRatings / book.ratings.length);
                book.save();
                res.status(200).json(book)
            }
        })
        .catch(error => res.status(400).json(error))
}