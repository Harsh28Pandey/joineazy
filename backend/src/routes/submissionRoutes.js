const express = require('express');
const { body } = require('express-validator');
const submissionController = require('../controllers/submissionController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.use(authenticateToken);

// Two-step verification submission confirmation
router.post(
  '/confirm',
  [
    body('assignmentId').notEmpty().withMessage('Assignment ID is required'),
    body('groupId').notEmpty().withMessage('Group ID is required'),
    body('twoStepVerified').custom(val => val === true || val === 'true').withMessage('Two-step verification must be confirmed'),
    validate
  ],
  submissionController.confirmSubmission
);

// Revoke/Undo submission
router.delete('/:assignmentId/:groupId', submissionController.undoSubmission);

// Admin tracking: Group-wise and student-wise matrix
router.get('/tracking', requireAdmin, submissionController.getTracking);

module.exports = router;
