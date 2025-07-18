// server/routes/lists.js
const express        = require('express');
const requireAuth    = require('../middleware/requireAuth');
const requireListRole= require('../middleware/requireListRole');
const listsController= require('../controllers/listsController');
const router         = express.Router();

// invite someone to a list (only owners can do this)
router.post(
  '/:listId/invite',
  requireAuth,
  requireListRole('owner'),
  listsController.inviteMember
);

module.exports = router;
