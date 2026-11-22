const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// Two-step verification submission confirmation
const confirmSubmission = async (req, res, next) => {
  try {
    const { assignmentId, groupId, confirmationNote, onedriveItemUrl, twoStepVerified } = req.body;
    const userId = req.user.id;

    // Two-step verification check
    if (twoStepVerified !== true) {
      return res.status(400).json({
        success: false,
        message: 'Two-step verification required: You must explicitly confirm that the assignment has been submitted to OneDrive.'
      });
    }

    if (!assignmentId || !groupId) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID and Group ID are required.'
      });
    }

    // Verify student is member of the specified group
    const membershipCheck = await db.query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (membershipCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not a registered member of this group.'
      });
    }

    // Check assignment exists
    const asgRes = await db.query('SELECT * FROM assignments WHERE id = $1', [assignmentId]);
    if (asgRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    // Check if submission already confirmed
    const existingSub = await db.query(
      'SELECT id FROM submissions WHERE assignment_id = $1 AND group_id = $2',
      [assignmentId, groupId]
    );

    const submissionId = existingSub.rows.length > 0 ? existingSub.rows[0].id : 'sub-' + uuidv4().slice(0, 8);

    if (existingSub.rows.length > 0) {
      // Update existing
      await db.query(
        `UPDATE submissions
         SET status = 'CONFIRMED',
             submitted_by_user_id = $1,
             submission_notes = $2,
             onedrive_item_url = $3,
             confirmed_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [userId, confirmationNote || 'Confirmed via two-step verification.', onedriveItemUrl || null, submissionId]
      );
    } else {
      // Insert new
      await db.query(
        `INSERT INTO submissions (id, assignment_id, group_id, submitted_by_user_id, status, submission_notes, onedrive_item_url, confirmed_at)
         VALUES ($1, $2, $3, $4, 'CONFIRMED', $5, $6, CURRENT_TIMESTAMP)`,
        [submissionId, assignmentId, groupId, userId, confirmationNote || 'Confirmed via two-step verification.', onedriveItemUrl || null]
      );
    }

    // Fetch user and group details for receipt
    const groupRes = await db.query('SELECT name FROM groups WHERE id = $1', [groupId]);

    res.status(201).json({
      success: true,
      message: 'Assignment submission successfully confirmed with two-step verification!',
      receipt: {
        submissionId,
        assignmentId,
        assignmentTitle: asgRes.rows[0].title,
        groupId,
        groupName: groupRes.rows[0]?.name,
        confirmedBy: req.user.name,
        confirmedAt: new Date().toISOString(),
        onedriveFolder: asgRes.rows[0].onedrive_link
      }
    });
  } catch (error) {
    next(error);
  }
};

// Revoke/Undo submission confirmation
const undoSubmission = async (req, res, next) => {
  try {
    const { assignmentId, groupId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Verify permission: caller must be member of group or admin
    if (!isAdmin) {
      const memCheck = await db.query(
        'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );
      if (memCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are not authorized to modify this group\'s submission.'
        });
      }
    }

    await db.query(
      'DELETE FROM submissions WHERE assignment_id = $1 AND group_id = $2',
      [assignmentId, groupId]
    );

    res.json({
      success: true,
      message: 'Submission confirmation has been reset.'
    });
  } catch (error) {
    next(error);
  }
};

// Admin Tracking: Group-wise and Student-wise unified matrix
const getTracking = async (req, res, next) => {
  try {
    const { assignmentId, groupId, status } = req.query;

    // 1. Fetch all assignments
    let assignmentsQuery = 'SELECT id, title, due_date, target_type, onedrive_link FROM assignments WHERE status = $1 ORDER BY due_date ASC';
    const assignmentsRes = await db.query(assignmentsQuery, ['ACTIVE']);
    const allAssignments = assignmentsRes.rows;

    // 2. Fetch all groups
    const groupsRes = await db.query('SELECT id, name, join_code FROM groups ORDER BY name ASC');
    const allGroups = groupsRes.rows;

    // 3. Fetch all group-assignment targets
    const targetsRes = await db.query('SELECT assignment_id, group_id FROM assignment_target_groups');
    const targetMap = new Set(targetsRes.rows.map(t => `${t.assignment_id}:${t.group_id}`));

    // 4. Fetch all submissions
    const subsRes = await db.query(`
      SELECT s.*, u.name as confirmed_by_name, u.email as confirmed_by_email, u.student_id as confirmed_by_student_id
      FROM submissions s
      LEFT JOIN users u ON s.submitted_by_user_id = u.id
      WHERE s.status = 'CONFIRMED'
    `);
    const subMap = new Map();
    subsRes.rows.forEach(s => {
      subMap.set(`${s.assignment_id}:${s.group_id}`, s);
    });

    // 5. Fetch all group members
    const membersRes = await db.query(`
      SELECT gm.group_id, u.id as user_id, u.name, u.email, u.student_id, u.department, gm.role_in_group
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      ORDER BY u.name ASC
    `);

    const groupMembersMap = new Map();
    membersRes.rows.forEach(m => {
      if (!groupMembersMap.has(m.group_id)) {
        groupMembersMap.set(m.group_id, []);
      }
      groupMembersMap.get(m.group_id).push(m);
    });

    // Build Group-wise Tracking Matrix
    const now = new Date();
    let groupTracking = allGroups.map(grp => {
      const members = groupMembersMap.get(grp.id) || [];
      
      const assignmentsStatus = allAssignments
        .filter(asg => asg.target_type === 'ALL' || targetMap.has(`${asg.id}:${grp.id}`))
        .map(asg => {
          const submission = subMap.get(`${asg.id}:${grp.id}`);
          const isSubmitted = !!submission;
          const isOverdue = !isSubmitted && new Date(asg.due_date) < now;

          let submissionStatus = 'PENDING';
          if (isSubmitted) submissionStatus = 'CONFIRMED';
          else if (isOverdue) submissionStatus = 'OVERDUE';

          return {
            assignmentId: asg.id,
            assignmentTitle: asg.title,
            dueDate: asg.due_date,
            status: submissionStatus,
            submissionDetails: submission ? {
              submissionId: submission.id,
              confirmedBy: submission.confirmed_by_name,
              confirmedByEmail: submission.confirmed_by_email,
              confirmedAt: submission.confirmed_at,
              notes: submission.submission_notes,
              onedriveUrl: submission.onedrive_item_url
            } : null
          };
        });

      const totalAssigned = assignmentsStatus.length;
      const confirmedCount = assignmentsStatus.filter(a => a.status === 'CONFIRMED').length;
      const overdueCount = assignmentsStatus.filter(a => a.status === 'OVERDUE').length;
      const pendingCount = totalAssigned - confirmedCount;
      const progressPercent = totalAssigned > 0 ? Math.round((confirmedCount / totalAssigned) * 100) : 0;

      return {
        groupId: grp.id,
        groupName: grp.name,
        joinCode: grp.join_code,
        memberCount: members.length,
        members,
        totalAssigned,
        confirmedCount,
        pendingCount,
        overdueCount,
        progressPercent,
        assignments: assignmentsStatus
      };
    });

    // Filter group tracking if filters supplied
    if (groupId) {
      groupTracking = groupTracking.filter(g => g.groupId === groupId);
    }

    // Build Student-wise Tracking Matrix
    // List all students
    const studentsRes = await db.query(`
      SELECT id, name, email, student_id, department, created_at
      FROM users WHERE role = 'student'
      ORDER BY name ASC
    `);

    let studentTracking = studentsRes.rows.map(stu => {
      // Find all groups this student belongs to
      const stuGroups = allGroups.filter(grp => {
        const mems = groupMembersMap.get(grp.id) || [];
        return mems.some(m => m.user_id === stu.id);
      });

      // Find all assignments for this student's groups
      let stuAssignments = [];
      stuGroups.forEach(grp => {
        const grpTrack = groupTracking.find(gt => gt.groupId === grp.id);
        if (grpTrack) {
          grpTrack.assignments.forEach(asg => {
            stuAssignments.push({
              groupId: grp.id,
              groupName: grp.name,
              ...asg
            });
          });
        }
      });

      const totalAssigned = stuAssignments.length;
      const confirmedCount = stuAssignments.filter(a => a.status === 'CONFIRMED').length;
      const overdueCount = stuAssignments.filter(a => a.status === 'OVERDUE').length;
      const progressPercent = totalAssigned > 0 ? Math.round((confirmedCount / totalAssigned) * 100) : 0;

      return {
        studentId: stu.id,
        studentCode: stu.student_id,
        name: stu.name,
        email: stu.email,
        department: stu.department,
        groups: stuGroups.map(g => ({ id: g.id, name: g.name })),
        totalAssigned,
        confirmedCount,
        overdueCount,
        progressPercent,
        assignments: stuAssignments
      };
    });

    res.json({
      success: true,
      data: {
        totalGroups: allGroups.length,
        totalAssignments: allAssignments.length,
        totalStudents: studentsRes.rows.length,
        groupTracking,
        studentTracking
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  confirmSubmission,
  undoSubmission,
  getTracking
};
