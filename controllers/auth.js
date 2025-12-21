const config = require('../config.json')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

exports.signup = (req, res) => {
    bcrypt.hash(req.body.password, 10)
        .then(hashedPassword => {
            const user = new User({
                email: req.body.email,
                password: hashedPassword
            });

            user.save()
                .then(() => {
                    res.status(201).json("Utilisateur créé.");
                })
                .catch(error => {
                    res.status(400).json({ error });
                });
        })
        .catch(error => res.status(500).json({ error }));
};

exports.login = (req, res) => {
    const loginErrorMessage = 'Identifiant/Mot de passe incorrect.';

    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user) {
                res.status(401).json({ message: loginErrorMessage });
            }
            else {
                bcrypt.compare(req.body.password, user.password)
                    .then(valid => {
                        if (!valid) {
                            res.status(401).json({ message: loginErrorMessage });
                        }
                        else {
                            res.status(200).json({
                                userId: user._id,
                                token: jwt.sign(
                                    { userId: user._id},
                                    config['secret-token'],
                                    { expiresIn: '24h' }
                                ) 
                            });
                        }
                    })
                    .catch(error => res.status(500).json({ error }))
            }
        })
        .catch(error => res.status(500).json({ error }));
};