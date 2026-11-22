const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// Helper to calculate group progress and badges
const calculateGroupMetrics = async (groupId) => {
  try {
    // Get all assignments applicable to this group (ALL or specifically targeted)
    const assignmentsRes = await db.query(
      `SELECT a.id, a.due_date, s.id as submission_id, s.status as submission_status
       FROM assignments a
       LEFT JOIN assignment_target_groups atg ON a.id = atg.assignment_id
       LEFT JOIN submissions s ON a.id = s.assignment_id AND s.group_id = $1
       WHERE (a.target_type = 'ALL' OR atg.group_id = $1)
         AND a.status = 'ACTIVE'`,
      [groupId]
    );

    // Deduplicate by assignment id in JS
    const uniqueAssignmentsMap = new Map();
    assignmentsRes.rows.forEach(r => {
      if (!uniqueAssignmentsMap.has(r.id)) {
        uniqueAssignmentsMap.set(r.id, r);
      }
    });

    const uniqueAssignments = Array.from(uniqueAssignmentsMap.values());
    const totalAssigned = uniqueAssignments.length;
    const completedCount = uniqueAssignments.filter(a => a.submission_id && a.submission_status === 'CONFIRMED').length;
    const pendingCount = totalAssigned - completedCount;
    const progressPercent = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

    // Determine badge
    let badge = 'Getting Started';
    let badgeColor = 'gray';
    if (totalAssigned > 0) {
      if (progressPercent === 100) {
        badge = 'All Completed';
        badgeColor = 'emerald';
      } else if (progressPercent >= 66) {
        badge = 'Top Performer';
        badgeColor = 'indigo';
      } else if (progressPercent >= 33) {
        badge = 'On Track';
        badgeColor = 'blue';
      } else {
        badge = 'Pending Work';
        badgeColor = 'amber';
      }
    }

    return {
      totalAssigned,
      completedCount,
      pendingCount,
      progressPercent,
      badge,
      badgeColor
    };
  } catch (err) {
    console.error('Error calculating group metrics for', groupId, err);
    return {
      totalAssigned: 0,
      completedCount: 0,
      pendingCount: 0,
      progressPercent: 0,
      badge: 'Getting Started',
      badgeColor: 'gray'
    };
  }
};

// Get groups
// Students get their joined groups (or all if explore requested); Admins get all groups
const getGroups = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const { all } = req.query;

    let groupsSql;
    let params = [];

    if (isAdmin || all === 'true') {
      groupsSql = `
        SELECT g.id, g.name, g.description, g.join_code, g.created_by, g.created_at, g.updated_at,
               u.name as leader_name, u.email as leader_email
        FROM groups g
        LEFT JOIN users u ON g.created_by = u.id
        ORDER BY g.created_at DESC
      `;
    } else {
      groupsSql = `
        SELECT g.id, g.name, g.description, g.join_code, g.created_by, g.created_at, g.updated_at,
               u.name as leader_name, u.email as leader_email,
               gm.role_in_group as my_role
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id AND gm.user_id = $1
        LEFT JOIN users u ON g.created_by = u.id
        ORDER BY g.created_at DESC
      `;
      params = [userId];
    }

    const groupsResult = await db.query(groupsSql, params);
    const groupsList = groupsResult.rows;

    // Fetch member counts for all groups in one fast aggregate query
    const memberCountsRes = await db.query(`
      SELECT group_id, COUNT(user_id) as count
      FROM group_members
      GROUP BY group_id
    `);
    const countMap = new Map();
    memberCountsRes.rows.forEach(r => {
      countMap.set(r.group_id, parseInt(r.count, 10));
    });

    // Enrich groups with live metrics
    const enrichedGroups = await Promise.all(
      groupsList.map(async (grp) => {
        const metrics = await calculateGroupMetrics(grp.id);
        return {
          ...grp,
          member_count: countMap.get(grp.id) || 0,
          metrics
        };
      })
    );

    res.json({
      success: true,
      count: enrichedGroups.length,
      groups: enrichedGroups
    });
  } catch (error) {
    next(error);
  }
};

// Get single group details with members and assignments
const getGroupById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const groupRes = await db.query(
      `SELECT g.id, g.name, g.description, g.join_code, g.created_by, g.created_at, g.updated_at,
              u.name as leader_name, u.email as leader_email
       FROM groups g
       LEFT JOIN users u ON g.created_by = u.id
       WHERE g.id = $1`,
      [id]
    );

    if (groupRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const group = groupRes.rows[0];

    // Get members
    const membersRes = await db.query(
      `SELECT u.id, u.name, u.email, u.student_id, u.department, gm.role_in_group, gm.joined_at
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1
       ORDER BY CASE WHEN gm.role_in_group = 'leader' THEN 0 ELSE 1 END, u.name ASC`,
      [id]
    );

    // Get assignments and group submission details
    const assignmentsRes = await db.query(
      `SELECT a.id, a.title, a.description, a.due_date, a.onedrive_link, a.target_type, a.status,
              s.id as submission_id,
              s.status as submission_status,
              s.confirmed_at as submission_time,
              s.submission_notes,
              s.onedrive_item_url,
              sub_user.name as confirmed_by_name,
              sub_user.email as confirmed_by_email
       FROM assignments a
       LEFT JOIN assignment_target_groups atg ON a.id = atg.assignment_id
       LEFT JOIN submissions s ON a.id = s.assignment_id AND s.group_id = $1
       LEFT JOIN users sub_user ON s.submitted_by_user_id = sub_user.id
       WHERE (a.target_type = 'ALL' OR atg.group_id = $1)
         AND a.status = 'ACTIVE'
       ORDER BY a.due_date ASC`,
      [id]
    );

    // Deduplicate assignments by id in JS
    const uniqueAsgMap = new Map();
    assignmentsRes.rows.forEach(r => {
      if (!uniqueAsgMap.has(r.id)) {
        uniqueAsgMap.set(r.id, r);
      }
    });

    const metrics = await calculateGroupMetrics(id);

    res.json({
      success: true,
      group: {
        ...group,
        members: membersRes.rows,
        assignments: Array.from(uniqueAsgMap.values()),
        metrics
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create a new group (creator is assigned as 'leader')
const createGroup = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Group name is required.' });
    }

    const groupId = 'grp-' + uuidv4().slice(0, 8);
    // Generate clean join code (e.g. ALPHA-789)
    const prefix = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'GRP';
    const randNum = Math.floor(100 + Math.random() * 900);
    const joinCode = `${prefix}-${randNum}`;

    await db.query(
      `INSERT INTO groups (id, name, description, join_code, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [groupId, name.trim(), description ? description.trim() : '', joinCode, userId]
    );

    // Add creator as leader
    const gmId = 'gm-' + uuidv4().slice(0, 8);
    await db.query(
      `INSERT INTO group_members (id, group_id, user_id, role_in_group)
       VALUES ($1, $2, $3, 'leader')`,
      [gmId, groupId, userId]
    );

    const metrics = await calculateGroupMetrics(groupId);

    res.status(201).json({
      success: true,
      message: 'Group created successfully.',
      group: {
        id: groupId,
        name: name.trim(),
        description: description ? description.trim() : '',
        join_code: joinCode,
        created_by: userId,
        metrics
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add or invite member to group by email or student_id
const addMember = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const { identifier } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Student email or Student ID is required.'
      });
    }

    const trimmed = identifier.trim().toLowerCase();

    // Check group exists
    const groupRes = await db.query('SELECT * FROM groups WHERE id = $1', [groupId]);
    if (groupRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    // Find student
    const studentRes = await db.query(
      `SELECT id, name, email, student_id, role FROM users
       WHERE LOWER(email) = $1 OR LOWER(COALESCE(student_id, '')) = $1`,
      [trimmed]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No student found with email or ID "${identifier}".`
      });
    }

    const student = studentRes.rows[0];

    // Check if already in this group
    const memberCheck = await db.query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, student.id]
    );

    if (memberCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${student.name} is already a member of this group.`
      });
    }

    // Add to group
    const gmId = 'gm-' + uuidv4().slice(0, 8);
    await db.query(
      `INSERT INTO group_members (id, group_id, user_id, role_in_group)
       VALUES ($1, $2, $3, 'member')`,
      [gmId, groupId, student.id]
    );

    res.status(201).json({
      success: true,
      message: `${student.name} has been added to the group.`,
      member: {
        id: student.id,
        name: student.name,
        email: student.email,
        student_id: student.student_id,
        role_in_group: 'member'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Remove member from group
const removeMember = async (req, res, next) => {
  try {
    const { id: groupId, userId } = req.params;
    const requesterId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Verify permissions: Must be admin, group leader, or the user removing themselves
    if (!isAdmin && requesterId !== userId) {
      const leaderCheck = await db.query(
        `SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2 AND role_in_group = 'leader'`,
        [groupId, requesterId]
      );
      if (leaderCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Only the group leader or an admin can remove other members.'
        });
      }
    }

    await db.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    res.json({
      success: true,
      message: 'Member removed from group successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// Join group via join code
const joinByCode = async (req, res, next) => {
  try {
    const { joinCode } = req.body;
    const userId = req.user.id;

    if (!joinCode || !joinCode.trim()) {
      return res.status(400).json({ success: false, message: 'Join code is required.' });
    }

    const groupRes = await db.query(
      'SELECT id, name FROM groups WHERE UPPER(join_code) = UPPER($1)',
      [joinCode.trim()]
    );

    if (groupRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid group join code.' });
    }

    const group = groupRes.rows[0];

    // Check if already in group
    const memberCheck = await db.query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [group.id, userId]
    );

    if (memberCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this group.'
      });
    }

    const gmId = 'gm-' + uuidv4().slice(0, 8);
    await db.query(
      `INSERT INTO group_members (id, group_id, user_id, role_in_group)
       VALUES ($1, $2, $3, 'member')`,
      [gmId, group.id, userId]
    );

    res.status(201).json({
      success: true,
      message: `Joined group "${group.name}" successfully!`,
      groupId: group.id
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGroups,
  getGroupById,
  createGroup,
  addMember,
  removeMember,
  joinByCode
};
