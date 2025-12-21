const express = require('express');
const auth = require('../middlewares/auth');
const router = express.Router();

const authController = require('../controllers/auth');

router.post('/signup', authController.signup);
router.post('/login', authController.login);

module.exports = router;