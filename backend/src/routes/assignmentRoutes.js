const express = require('express');
const { body } = require('express-validator');
const assignmentController = require('../controllers/assignmentController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.use(authenticateToken);

// Get assignments (filtered by role and group target)
router.get('/', assignmentController.getAssignments);

// Get single assignment
router.get('/:id', assignmentController.getAssignmentById);

// Create assignment (Admin/Professor only)
router.post(
  '/',
  requireAdmin,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('dueDate').isISO8601().withMessage('Valid due date is required'),
    body('onedriveLink').isURL().withMessage('Valid OneDrive URL is required'),
    body('targetType').optional().isIn(['ALL', 'SPECIFIC_GROUPS']).withMessage('Invalid target type'),
    validate
  ],
  assignmentController.createAssignment
);

// Update assignment (Admin/Professor only)
router.put(
  '/:id',
  requireAdmin,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('dueDate').isISO8601().withMessage('Valid due date is required'),
    body('onedriveLink').isURL().withMessage('Valid OneDrive URL is required'),
    validate
  ],
  assignmentController.updateAssignment
);

// Delete assignment (Admin/Professor only)
router.delete('/:id', requireAdmin, assignmentController.deleteAssignment);

module.exports = router;
