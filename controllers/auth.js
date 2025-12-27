const config = require('../config.json')
const logger = require('../config/logger');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

exports.signup = (req, res, next) => {
    logger.info(`Tentative de création de compte : ${req.body.email}`);

    logger.info("Chiffrage du mot de passe...");
    bcrypt.hash(req.body.password, 10)
        .then(hashedPassword => {
            logger.info("Chiffrage du mot de passe réussi.");

            const user = new User({
                email: req.body.email,
                password: hashedPassword
            });

            logger.info("Création du nouvel utilisation en base de données...");
            user.save()
                .then(() => {
                    logger.info("Création du nouvel utilisation en base de données réussie.");
                    return res.status(201).json({ message: "Utilisateur créé." });
                })
                .catch(error => {
                    logger.error("Une erreur est servenue lors de la création du nouvel utilisateur.", error);
                    next({ status: 500, message: error.message });
                });
        })
        .catch(error => {
            logger.error("Une erreur est servenue lors du chiffrage du mot de passe.", error);
            next({ status: 500, message: error.message });
        });
};

exports.login = (req, res, next) => {
    logger.info(`Tentative de connexion : ${req.body.email}`);

    const loginErrorMessage = 'Identifiant/Mot de passe incorrect.';

    logger.info("Recherche de l'utilisateur en base de données...");
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user) {
                logger.warn("Utilisateur introuvable.");
                return next({ status: 401, message: loginErrorMessage });
            }
            else {
                logger.info("Utilisateur trouvé.");

                logger.info("Comparaison du mot de passe sécurisé...");
                bcrypt.compare(req.body.password, user.password)
                    .then(valid => {
                        if (!valid) {
                            logger.info("Mot de passe invalide.");
                            return next({ status: 401, message: loginErrorMessage });
                        }
                        else {
                            logger.info("Mot de passe validé.");
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
                    .catch(error => {
                        logger.error("Une erreur est survenue lors de la comparaison du mot de passe sécurisé.", error);
                        next({ status: 500, message: error.message });
                    })
            }
        })
        .catch(error => {
            logger.error("Une erreur est survenue lors de la recherche de l'utilisateur en base de données.", error);
            next({ status: 500, message: error.message });
        });
};