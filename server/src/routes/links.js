const express = require('express');
const router = express.Router();
const linksController = require('../controllers/linksController');

router.get('/', linksController.getLinks);
router.post('/', linksController.createLink);
router.delete('/:id', linksController.deleteLink);

module.exports = router;
