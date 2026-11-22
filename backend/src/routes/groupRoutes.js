const express = require('express');
const { body } = require('express-validator');
const groupController = require('../controllers/groupController');
const { authenticateToken, requireStudent } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.use(authenticateToken);

// Get groups (students see their groups; admins see all)
router.get('/', groupController.getGroups);

// Get single group details
router.get('/:id', groupController.getGroupById);

// Create new group (students only)
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Group name is required'),
    validate
  ],
  groupController.createGroup
);

// Add member by email or student ID
router.post(
  '/:id/members',
  [
    body('identifier').trim().notEmpty().withMessage('Student email or ID is required'),
    validate
  ],
  groupController.addMember
);

// Remove member
router.delete('/:id/members/:userId', groupController.removeMember);

// Join group via join code
router.post(
  '/join',
  [
    body('joinCode').trim().notEmpty().withMessage('Group join code is required'),
    validate
  ],
  groupController.joinByCode
);

module.exports = router;
