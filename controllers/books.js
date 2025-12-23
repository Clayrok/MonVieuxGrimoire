const path = require('path');
const fs = require('fs');

const Book = require('../models/Book');

exports.getAll = (req, res, next) => {
    Book.find()
        .then(books => res.status(200).json(books))
        .catch(error => next({ status: 400, message: error.message }));
};

exports.getById = (req, res, next) => {
    if (req.params.id) {
        Book.findOne({ _id: req.params.id })
            .then(book => res.status(200).json(book))
            .catch(error => next({ status: 500, message: error.message }));
    }
    else {
        return next({ status: 500 });
    }
};

exports.getBestRatedTrio = (req, res, next) => {
    Book.find()
        .sort({ averageRating: -1 })
        .limit(3)
        .then(books => res.status(200).json(books))
        .catch(error => next({ status: 400, message: error.message }));
};

exports.create = (req, res, next) => {
    try {
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
            .then(() => res.status(201).json("Livre créé."))
            .catch(error => next({ status: 500, message: error.message }));
    } catch (error) {
        return next({ status: 500 });
    }
};

exports.update = (req, res, next) => {
    if (req.params.id && req.auth.userId) {
        Book.findOne({ _id: req.params.id, userId: req.auth.userId })
            .then(book => {
                if (book) {
                    try {
                        let reqBook = req.file ? JSON.parse(req.body.book) : req.body;
                        if (req.file) reqBook.imageUrl = `${req.protocol}://${req.get('host')}/upload/${req.file.filename}`;

                        if (book.imageUrl) {
                            fs.promises.rm(getImagePath(book.imageUrl), { force: true });
                        }

                        Book.findOneAndUpdate({ _id: req.params.id, userId: req.auth.userId }, reqBook, { new: true })
                            .then(updatedBook => res.status(200).json(updatedBook));
                    } catch (error) {
                        return next({ status: 500, message: error.message });
                    }
                }
                else {
                    return next({ status: 500, message: "Ce livre n'existe pas." });
                }
            })
            .catch(error => next({ status: 500, message: error.message }));
    }
    else {
        return next({ status: 500 });
    }
};

exports.delete = (req, res, next) => {
    if (req.params.id && req.auth.userId) {
        Book.findOne({ _id: req.params.id, userId: req.auth.userId })
            .then(book => {
                if (book) {
                    Book.deleteOne({ _id: req.params.id, userId: req.auth.userId })
                        .then(response => {
                            const imagePath = getImagePath(book.imageUrl);
                            if (imagePath) fs.promises.rm(imagePath, { force: true });
                            return res.status(200).json("Livre supprimé avec succès");
                        })
                }
                else {
                    return next({ status: 400, message: "Ce livre n'existe pas." });
                }
            })
            .catch(error => next({ status: 500 }))

    }
    else {
        return next({ status: 500 });
    }
};

exports.rating = (req, res, next) => {
    if (req.body.rating && req.params.id) {
        if (req.body.rating < 0 || req.body.rating > 5) {
            return next({ status: 400 });
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
                    return next({ status: 400, message: "Cet utilisateur a déjà noté ce livre." });
                }
                else {
                    totalRatings += req.body.rating;
                    book.ratings.push({
                        userId: req.auth.userId,
                        grade: req.body.rating
                    });
                    book.averageRating = Math.round(totalRatings / book.ratings.length);
                    book.save();
                    return res.status(200).json(book)
                }
            })
            .catch(error => next({ status: 500, message: error.message }))
    }
    else {
        return next({ status: 500 });
    }
}

const getImagePath = (imageUrl) => {
    if (!imageUrl) return null;
    const filename = path.basename(imageUrl);
    return path.join(__dirname, '..', 'upload', filename);
};