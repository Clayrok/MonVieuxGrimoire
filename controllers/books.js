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