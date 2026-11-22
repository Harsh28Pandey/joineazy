const db = require('../db');

// Get Unified Dashboard Analytics for Professors
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const now = new Date();

    // 1. Total counts
    const studentsCountRes = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const totalStudents = parseInt(studentsCountRes.rows[0].count, 10);

    const groupsCountRes = await db.query("SELECT COUNT(*) as count FROM groups");
    const totalGroups = parseInt(groupsCountRes.rows[0].count, 10);

    const assignmentsCountRes = await db.query("SELECT COUNT(*) as count FROM assignments");
    const totalAssignments = parseInt(assignmentsCountRes.rows[0].count, 10);

    const activeAssignmentsRes = await db.query("SELECT COUNT(*) as count FROM assignments WHERE status = 'ACTIVE'");
    const activeAssignments = parseInt(activeAssignmentsRes.rows[0].count, 10);

    // 2. All assignments and submissions
    const allAssignmentsRes = await db.query("SELECT id, title, due_date, target_type FROM assignments WHERE status = 'ACTIVE'");
    const assignments = allAssignmentsRes.rows;

    const allGroupsRes = await db.query("SELECT id, name FROM groups");
    const groups = allGroupsRes.rows;

    const targetsRes = await db.query("SELECT assignment_id, group_id FROM assignment_target_groups");
    const targetSet = new Set(targetsRes.rows.map(t => `${t.assignment_id}:${t.group_id}`));

    const submissionsRes = await db.query(`
      SELECT s.*, g.name as group_name, u.name as student_name, a.title as assignment_title
      FROM submissions s
      JOIN groups g ON s.group_id = g.id
      JOIN assignments a ON s.assignment_id = a.id
      LEFT JOIN users u ON s.submitted_by_user_id = u.id
      ORDER BY s.confirmed_at DESC
    `);
    const submissions = submissionsRes.rows;
    const confirmedSet = new Set(submissions.map(s => `${s.assignment_id}:${s.group_id}`));

    // 3. Compute overall expected pairs and breakdown
    let totalExpectedSubmissions = 0;
    let totalConfirmed = submissions.length;
    let totalOverdue = 0;

    const assignmentBarData = [];

    assignments.forEach(asg => {
      let expectedForThis = 0;
      let confirmedForThis = 0;
      let overdueForThis = 0;

      const isAsgPastDue = new Date(asg.due_date) < now;

      groups.forEach(grp => {
        const isTargeted = asg.target_type === 'ALL' || targetSet.has(`${asg.id}:${grp.id}`);
        if (isTargeted) {
          expectedForThis++;
          totalExpectedSubmissions++;

          if (confirmedSet.has(`${asg.id}:${grp.id}`)) {
            confirmedForThis++;
          } else if (isAsgPastDue) {
            overdueForThis++;
            totalOverdue++;
          }
        }
      });

      const pendingForThis = expectedForThis - confirmedForThis - overdueForThis;

      assignmentBarData.push({
        id: asg.id,
        title: asg.title.length > 25 ? asg.title.slice(0, 25) + '...' : asg.title,
        fullTitle: asg.title,
        confirmed: confirmedForThis,
        pending: Math.max(0, pendingForThis),
        overdue: overdueForThis,
        total: expectedForThis,
        rate: expectedForThis > 0 ? Math.round((confirmedForThis / expectedForThis) * 100) : 0
      });
    });

    const totalPending = Math.max(0, totalExpectedSubmissions - totalConfirmed - totalOverdue);
    const overallCompletionRate = totalExpectedSubmissions > 0
      ? Math.round((totalConfirmed / totalExpectedSubmissions) * 100)
      : 0;

    // 4. Group Performance Comparison
    const groupPerformanceData = groups.map(grp => {
      let grpAssigned = 0;
      let grpConfirmed = 0;
      let grpOverdue = 0;

      assignments.forEach(asg => {
        const isTargeted = asg.target_type === 'ALL' || targetSet.has(`${asg.id}:${grp.id}`);
        if (isTargeted) {
          grpAssigned++;
          if (confirmedSet.has(`${asg.id}:${grp.id}`)) {
            grpConfirmed++;
          } else if (new Date(asg.due_date) < now) {
            grpOverdue++;
          }
        }
      });

      const grpPending = Math.max(0, grpAssigned - grpConfirmed - grpOverdue);
      const rate = grpAssigned > 0 ? Math.round((grpConfirmed / grpAssigned) * 100) : 0;

      let badge = 'Needs Work';
      if (rate === 100) badge = 'Completed';
      else if (rate >= 66) badge = 'High Achiever';
      else if (rate >= 33) badge = 'On Track';

      return {
        id: grp.id,
        name: grp.name,
        totalAssigned: grpAssigned,
        confirmed: grpConfirmed,
        pending: grpPending,
        overdue: grpOverdue,
        rate,
        badge
      };
    });

    // 5. Pie / Donut Chart Data
    const statusPieData = [
      { name: 'Confirmed', value: totalConfirmed, color: '#10B981' },
      { name: 'Pending', value: totalPending, color: '#3B82F6' },
      { name: 'Overdue', value: totalOverdue, color: '#EF4444' }
    ];

    // 6. Recent Submissions Activity
    const recentActivity = submissions.slice(0, 8).map(s => ({
      id: s.id,
      studentName: s.student_name,
      groupName: s.group_name,
      assignmentTitle: s.assignment_title,
      confirmedAt: s.confirmed_at,
      onedriveItemUrl: s.onedrive_item_url,
      notes: s.submission_notes
    }));

    res.json({
      success: true,
      kpis: {
        totalStudents,
        totalGroups,
        totalAssignments,
        activeAssignments,
        totalConfirmed,
        totalPending,
        totalOverdue,
        overallCompletionRate
      },
      charts: {
        statusBreakdown: statusPieData,
        groupPerformance: groupPerformanceData,
        assignmentBreakdown: assignmentBarData
      },
      recentActivity
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics
};
