// ============================================================
// middleware/auth.middleware.js — Vérification du token JWT
//
// Un middleware Express est une fonction (req, res, next) placée
// entre la réception de la requête et son traitement final.
// Celui-ci vérifie que l'utilisateur est authentifié avant de
// laisser passer la requête vers le contrôleur.
// ============================================================


const jwt = require('jsonwebtoken');

//      TODO ---- Fonctionnement du JWT (JSON Web Token) ---- 
// * Un JWT est une chaîne encodée en base64 composée de 3 parties :
// * Header.Payload.Signature
// *
// * Le serveur génère un token lors du login et le signe avec JWT_SECRET.
// * Le client le stocke (localStorage) et l'envoie dans chaque requête :
// * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
// *
// * Pour vérifier, on re-signe le header+payload avec JWT_SECRET et on
// * compare : si ça correspond, le token est authentique et non modifié. *

//      TODO ---- Importation de la bibliothèque JSON Web Token ---- 
// * const jwt = require('jsonwebtoken');
// * // * require('jsonwebtoken') : Charge le module tiers installé via npm (jsonwebtoken).
// * Ce package fournit toutes les méthodes nécessaires pour manipuler les JWT.
// ? À quoi ça sert concrètement ? ?
// ? 1. Générer et signer des tokens sécurisés (jwt.sign) lors de la connexion.
// ? 2. Décoder et vérifier l'authenticité des tokens (jwt.verify) reçus sur les routes protégées.
// ! Sécurité : Ce module se base sur une clé secrète (JWT_SECRET) pour valider l'intégrité des données !


const authMiddleware = (req, res, next) => {
  // ? Lecture du header Authorization de la requête entrante ?
  const authHeader = req.headers.authorization;

  // ! Vérification de la présence et du format "Bearer <token>" !
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
    // ! 401 = Non authentifié (le token est absent ou malformé) !
  }

  // * On extrait uniquement le token (on retire le préfixe "Bearer ") *
  const token = authHeader.split(' ')[1];

  try {
    // * jwt.verify() décode ET vérifie la signature avec la clé secrète. *
    // ! Si le token a été modifié ou signé avec une autre clé → exception. !
    // ! Si la date d'expiration est dépassée → exception TokenExpiredError. !
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // * On attache l'identité décodée à req.user pour que les contrôleurs *
    // * puissent savoir quel utilisateur fait la requête (req.user.id etc.) *
    req.user = { id: decoded.id, email: decoded.email, username: decoded.username };

    // * next() passe la main au prochain middleware ou au contrôleur *
    next();
  } catch (err) {
    // ? Distinction entre token expiré et token invalide pour un meilleur retour utilisateur ?
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = authMiddleware;