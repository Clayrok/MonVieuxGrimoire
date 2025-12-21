const express = require('express');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload')

const router = express.Router();

const booksController = require('../controllers/books');

router.get('/', booksController.getAll);
router.get('/:id', booksController.getById);
router.get('/bestrating', booksController.getBestRatedTrio);
router.post('/', auth, upload, booksController.create);

module.exports = router;