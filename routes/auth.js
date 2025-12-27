const express = require('express');
const { body, validationResult } = require('express-validator');

const bruteforce = require('../middlewares/bruteForce');

const authController = require('../controllers/auth');

const router = express.Router();

router.post('/signup', 
    bruteforce.prevent,
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    authController.signup);

router.post('/login',
    bruteforce.prevent,
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    authController.login);

module.exports = router;