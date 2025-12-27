const ExpressBrute = require('express-brute');

const store = new ExpressBrute.MemoryStore();
const bruteforce = new ExpressBrute(store);

module.exports = bruteforce;
