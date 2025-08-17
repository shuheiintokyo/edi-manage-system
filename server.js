// server.js - Fixed for Vercel serverless deployment
require('dotenv').config();
const app = require('./app');

// For Vercel, export the app instead of calling listen()
module.exports = app;