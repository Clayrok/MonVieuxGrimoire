const express = require('express');

const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const booksController = require('../controllers/books');

const router = express.Router();

router.get('/', booksController.getAll);
router.get('/bestrating', booksController.getBestRatedTrio);
router.get('/:id', booksController.getById);

router.post('/', auth, upload, upload.compressImage, booksController.create);
router.post('/:id/rating', auth, booksController.rating);

router.put('/:id', auth, upload, upload.compressImage, booksController.update);

router.delete('/:id', auth, booksController.delete);

module.exports = router;