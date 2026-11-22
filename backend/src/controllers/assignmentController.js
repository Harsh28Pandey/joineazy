const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// List assignments
// Students: Only assignments applicable to them (target_type = 'ALL' OR targeted to one of their groups)
// Admins: All assignments with target group details and completion counts
const getAssignments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // 1. Fetch all assignments with professor information
    const allAsgRes = await db.query(`
      SELECT a.id, a.title, a.description, a.due_date, a.onedrive_link,
             a.target_type, a.status, a.created_by, a.created_at, a.updated_at,
             u.name as professor_name, u.email as professor_email
      FROM assignments a
      LEFT JOIN users u ON a.created_by = u.id
      ORDER BY a.due_date ASC
    `);
    const allAssignments = allAsgRes.rows;

    // 2. Fetch all target groups associations
    const targetsRes = await db.query(`
      SELECT atg.assignment_id, atg.group_id, g.name as group_name
      FROM assignment_target_groups atg
      JOIN groups g ON atg.group_id = g.id
    `);
    const targetsMap = new Map();
    targetsRes.rows.forEach(t => {
      if (!targetsMap.has(t.assignment_id)) {
        targetsMap.set(t.assignment_id, []);
      }
      targetsMap.get(t.assignment_id).push({ id: t.group_id, name: t.group_name });
    });

    // 3. Fetch all submissions
    const subsRes = await db.query(`
      SELECT s.id, s.assignment_id, s.group_id, s.submitted_by_user_id, s.status,
             s.submission_notes, s.onedrive_item_url, s.confirmed_at,
             g.name as group_name, u.name as confirmed_by_name, u.email as confirmed_by_email
      FROM submissions s
      JOIN groups g ON s.group_id = g.id
      LEFT JOIN users u ON s.submitted_by_user_id = u.id
    `);
    const subsMap = new Map();
    subsRes.rows.forEach(s => {
      if (!subsMap.has(s.assignment_id)) {
        subsMap.set(s.assignment_id, []);
      }
      subsMap.get(s.assignment_id).push(s);
    });

    // 4. Fetch total groups count
    const totalGroupsRes = await db.query('SELECT COUNT(*) as count FROM groups');
    const totalGroupsCount = parseInt(totalGroupsRes.rows[0].count, 10) || 0;

    let assignments = [];

    if (isAdmin) {
      // Admin sees all assignments with full metrics
      assignments = allAssignments.map(asg => {
        const targetGroups = targetsMap.get(asg.id) || [];
        const asgSubs = (subsMap.get(asg.id) || []).filter(s => s.status === 'CONFIRMED');

        const totalExpectedGroups = asg.target_type === 'ALL'
          ? totalGroupsCount
          : targetGroups.length;

        const confirmedCount = asgSubs.length;
        const isOverdue = new Date(asg.due_date) < new Date();
        const submissionRate = totalExpectedGroups > 0
          ? Math.round((confirmedCount / totalExpectedGroups) * 100)
          : 0;

        return {
          ...asg,
          target_groups: targetGroups,
          total_expected_groups: totalExpectedGroups,
          confirmed_submissions: confirmedCount,
          submission_rate: submissionRate,
          is_overdue: isOverdue
        };
      });
    } else {
      // Student: find user's groups
      const userGroupsRes = await db.query(
        'SELECT group_id FROM group_members WHERE user_id = $1',
        [userId]
      );
      const userGroupIds = new Set(userGroupsRes.rows.map(r => r.group_id));

      // Filter: ACTIVE and (target_type = ALL or student's group targeted)
      const applicable = allAssignments.filter(asg => {
        if (asg.status !== 'ACTIVE') return false;
        if (asg.target_type === 'ALL') return true;
        const targets = targetsMap.get(asg.id) || [];
        return targets.some(t => userGroupIds.has(t.id));
      });

      assignments = applicable.map(asg => {
        const asgSubs = subsMap.get(asg.id) || [];
        const mySubmissions = asgSubs.filter(s => userGroupIds.has(s.group_id));
        const isSubmitted = mySubmissions.some(s => s.status === 'CONFIRMED');
        const isOverdue = new Date(asg.due_date) < new Date();

        return {
          ...asg,
          is_submitted: isSubmitted,
          is_overdue: isOverdue,
          my_submissions: mySubmissions
        };
      });
    }

    res.json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch (error) {
    next(error);
  }
};

// Get single assignment by ID
const getAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const asgRes = await db.query(
      `SELECT a.id, a.title, a.description, a.due_date, a.onedrive_link,
              a.target_type, a.status, a.created_by, a.created_at, a.updated_at,
              u.name as professor_name, u.email as professor_email
       FROM assignments a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (asgRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const assignment = asgRes.rows[0];

    // Fetch target groups
    const tgRes = await db.query(
      `SELECT g.id, g.name, g.join_code
       FROM assignment_target_groups atg
       JOIN groups g ON atg.group_id = g.id
       WHERE atg.assignment_id = $1`,
      [id]
    );
    assignment.target_groups = tgRes.rows;

    // Fetch submissions
    const subRes = await db.query(
      `SELECT s.id, s.assignment_id, s.group_id, s.submitted_by_user_id, s.status,
              s.submission_notes, s.onedrive_item_url, s.confirmed_at,
              g.name as group_name, u.name as confirmed_by_name, u.email as confirmed_by_email
       FROM submissions s
       JOIN groups g ON s.group_id = g.id
       LEFT JOIN users u ON s.submitted_by_user_id = u.id
       WHERE s.assignment_id = $1
       ORDER BY s.confirmed_at DESC`,
      [id]
    );
    assignment.submissions = subRes.rows;

    // If student, check if user's group has submitted
    if (!isAdmin) {
      const userGroupRes = await db.query(
        `SELECT g.id, g.name FROM groups g
         JOIN group_members gm ON g.id = gm.group_id
         WHERE gm.user_id = $1`,
        [userId]
      );
      assignment.user_groups = userGroupRes.rows;
    }

    res.json({
      success: true,
      assignment
    });
  } catch (error) {
    next(error);
  }
};

// Create assignment (Admin only)
const createAssignment = async (req, res, next) => {
  try {
    const {
      title,
      description,
      dueDate,
      onedriveLink,
      targetType = 'ALL',
      targetGroupIds = []
    } = req.body;
    const adminId = req.user.id;

    if (!title || !description || !dueDate || !onedriveLink) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, due date, and OneDrive link are all required.'
      });
    }

    // Basic URL validation
    try {
      new URL(onedriveLink);
    } catch (_) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid OneDrive URL (starting with http:// or https://).'
      });
    }

    const assignmentId = 'asg-' + uuidv4().slice(0, 8);

    await db.query(
      `INSERT INTO assignments (id, title, description, due_date, onedrive_link, target_type, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7)`,
      [assignmentId, title.trim(), description.trim(), new Date(dueDate).toISOString(), onedriveLink.trim(), targetType, adminId]
    );

    // If specific groups targeted, insert associations
    if (targetType === 'SPECIFIC_GROUPS' && Array.isArray(targetGroupIds)) {
      for (const grpId of targetGroupIds) {
        const atgId = 'atg-' + uuidv4().slice(0, 8);
        await db.query(
          `INSERT INTO assignment_target_groups (id, assignment_id, group_id)
           VALUES ($1, $2, $3)`,
          [atgId, assignmentId, grpId]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Assignment published successfully.',
      assignmentId
    });
  } catch (error) {
    next(error);
  }
};

// Update assignment (Admin only)
const updateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      dueDate,
      onedriveLink,
      targetType = 'ALL',
      targetGroupIds = [],
      status = 'ACTIVE'
    } = req.body;

    // Check assignment exists
    const existing = await db.query('SELECT id FROM assignments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    await db.query(
      `UPDATE assignments
       SET title = $1, description = $2, due_date = $3, onedrive_link = $4,
           target_type = $5, status = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [title.trim(), description.trim(), new Date(dueDate).toISOString(), onedriveLink.trim(), targetType, status, id]
    );

    // Update target groups
    await db.query('DELETE FROM assignment_target_groups WHERE assignment_id = $1', [id]);
    if (targetType === 'SPECIFIC_GROUPS' && Array.isArray(targetGroupIds)) {
      for (const grpId of targetGroupIds) {
        const atgId = 'atg-' + uuidv4().slice(0, 8);
        await db.query(
          `INSERT INTO assignment_target_groups (id, assignment_id, group_id)
           VALUES ($1, $2, $3)`,
          [atgId, id, grpId]
        );
      }
    }

    res.json({
      success: true,
      message: 'Assignment updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// Delete assignment (Admin only)
const deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await db.query('SELECT id FROM assignments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    await db.query('DELETE FROM assignments WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Assignment deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment
};
