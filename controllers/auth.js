const config = require('../config.json')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

exports.signup = (req, res, next) => {
    if (!validateEmail(req.body.email)) {
        return next({ status: 400, message: "Adresse email non conforme." });
    }

    bcrypt.hash(req.body.password, 10)
        .then(hashedPassword => {
            const user = new User({
                email: req.body.email,
                password: hashedPassword
            });

            user.save()
                .then(() => {
                    res.status(201).json({ message: "Utilisateur créé." });
                })
                .catch(error => {
                    next({ status: 500, message: error.message });
                });
        })
        .catch(error => next({ status: 500, message: error.message }));
};

exports.login = (req, res, next) => {
    if (!validateEmail(req.body.email)) {
        return next({ status: 400, message: "Adresse email non conforme." });
    }

    const loginErrorMessage = 'Identifiant/Mot de passe incorrect.';

    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user) {
                return next({ status: 401, message: loginErrorMessage });
            }
            else {
                bcrypt.compare(req.body.password, user.password)
                    .then(valid => {
                        if (!valid) {
                            return next({ status: 401, message: loginErrorMessage });
                        }
                        else {
                            return res.status(200).json({
                                userId: user._id,
                                token: jwt.sign(
                                    { userId: user._id},
                                    config['secret-token'],
                                    { expiresIn: '24h' }
                                ) 
                            });
                        }
                    })
                    .catch(error => next({ status: 500, message: error.message }))
            }
        })
        .catch(error => next({ status: 500, message: error.message }));
};

function validateEmail(email) {
    if (!email) return null;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}