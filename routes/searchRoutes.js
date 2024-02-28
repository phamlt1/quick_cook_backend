const express = require('express');
const { searchItems } = require('../services/searchServices');

const router = express.Router();

router.post('/search', searchItems);

module.exports = router;
