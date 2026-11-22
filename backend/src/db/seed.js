const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./index');

async function seedData() {
  console.log('🌱 Seeding database with initial data for Joineazy...');

  // Ensure DB initialized
  await db.initDb();

  // Check if users already exist
  const existingUsers = await db.query('SELECT COUNT(*) as count FROM users');
  const count = parseInt(existingUsers.rows[0].count, 10);
  if (count > 0) {
    console.log(`ℹ Database already contains ${count} users. Skipping seed.`);
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', salt);
  const studentPasswordHash = await bcrypt.hash('Student@123', salt);

  // 1. Create Admin (Professor)
  const profId = 'usr-prof-001';
  await db.query(
    `INSERT INTO users (id, name, email, password_hash, role, student_id, department)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      profId,
      'Prof. Dr. Alan Vance',
      'prof@joineazy.edu',
      adminPasswordHash,
      'admin',
      'FAC-CS-01',
      'Computer Science & Engineering'
    ]
  );

  // 2. Create Students
  const students = [
    {
      id: 'usr-stu-001',
      name: 'Alex Rivera',
      email: 'alex@joineazy.edu',
      studentId: 'STU-2026-001',
      department: 'Computer Science'
    },
    {
      id: 'usr-stu-002',
      name: 'Sara Chen',
      email: 'sara@joineazy.edu',
      studentId: 'STU-2026-002',
      department: 'Computer Science'
    },
    {
      id: 'usr-stu-003',
      name: 'John Doe',
      email: 'john@joineazy.edu',
      studentId: 'STU-2026-003',
      department: 'Information Technology'
    },
    {
      id: 'usr-stu-004',
      name: 'Emma Watson',
      email: 'emma@joineazy.edu',
      studentId: 'STU-2026-004',
      department: 'Software Engineering'
    },
    {
      id: 'usr-stu-005',
      name: 'Marcus Ray',
      email: 'marcus@joineazy.edu',
      studentId: 'STU-2026-005',
      department: 'Computer Science'
    },
    {
      id: 'usr-stu-006',
      name: 'Priya Sharma',
      email: 'priya@joineazy.edu',
      studentId: 'STU-2026-006',
      department: 'Data Science'
    }
  ];

  for (const s of students) {
    await db.query(
      `INSERT INTO users (id, name, email, password_hash, role, student_id, department)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [s.id, s.name, s.email, studentPasswordHash, 'student', s.studentId, s.department]
    );
  }

  // 3. Create Groups
  const group1Id = 'grp-alpha-001';
  await db.query(
    `INSERT INTO groups (id, name, description, join_code, created_by)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      group1Id,
      'Alpha Innovators',
      'Specialized in Cloud computing, microservices architecture, and scalable system design.',
      'ALPHA-88',
      'usr-stu-001'
    ]
  );

  const group2Id = 'grp-byte-002';
  await db.query(
    `INSERT INTO groups (id, name, description, join_code, created_by)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      group2Id,
      'Byte Crafters',
      'Focused on full stack web applications, UI/UX performance, and distributed databases.',
      'BYTE-99',
      'usr-stu-004'
    ]
  );

  // 4. Add Members to Groups
  // Group 1 Members: Alex (leader), Sara, John
  await db.query(
    `INSERT INTO group_members (id, group_id, user_id, role_in_group) VALUES ($1, $2, $3, $4)`,
    ['gm-1', group1Id, 'usr-stu-001', 'leader']
  );
  await db.query(
    `INSERT INTO group_members (id, group_id, user_id, role_in_group) VALUES ($1, $2, $3, $4)`,
    ['gm-2', group1Id, 'usr-stu-002', 'member']
  );
  await db.query(
    `INSERT INTO group_members (id, group_id, user_id, role_in_group) VALUES ($1, $2, $3, $4)`,
    ['gm-3', group1Id, 'usr-stu-003', 'member']
  );

  // Group 2 Members: Emma (leader), Marcus, Priya
  await db.query(
    `INSERT INTO group_members (id, group_id, user_id, role_in_group) VALUES ($1, $2, $3, $4)`,
    ['gm-4', group2Id, 'usr-stu-004', 'leader']
  );
  await db.query(
    `INSERT INTO group_members (id, group_id, user_id, role_in_group) VALUES ($1, $2, $3, $4)`,
    ['gm-5', group2Id, 'usr-stu-005', 'member']
  );
  await db.query(
    `INSERT INTO group_members (id, group_id, user_id, role_in_group) VALUES ($1, $2, $3, $4)`,
    ['gm-6', group2Id, 'usr-stu-006', 'member']
  );

  // 5. Create Assignments
  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  const asg1Id = 'asg-cloud-001';
  await db.query(
    `INSERT INTO assignments (id, title, description, due_date, onedrive_link, target_type, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      asg1Id,
      'Task 1: Cloud Architecture & High-Availability Design',
      'Design a resilient cloud architecture supporting 50k concurrent users. Include diagrams, auto-scaling configuration, cost estimation, and fault tolerance strategies. Upload your design document and slide deck to OneDrive.',
      in3Days.toISOString(),
      'https://onedrive.live.com/?cid=joineazy-cloud-arch-2026',
      'ALL',
      'ACTIVE',
      profId
    ]
  );

  const asg2Id = 'asg-micro-002';
  await db.query(
    `INSERT INTO assignments (id, title, description, due_date, onedrive_link, target_type, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      asg2Id,
      'Task 2: Distributed Microservices & Event Broker Pipeline',
      'Implement a modular backend pipeline using Docker containers, message queuing (Kafka or RabbitMQ), and role-based access control. Package your code into a zip and upload to the designated OneDrive folder.',
      in7Days.toISOString(),
      'https://onedrive.live.com/?cid=joineazy-microservices-2026',
      'ALL',
      'ACTIVE',
      profId
    ]
  );

  const asg3Id = 'asg-db-003';
  await db.query(
    `INSERT INTO assignments (id, title, description, due_date, onedrive_link, target_type, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      asg3Id,
      'Task 3: Deep Query Optimization & PostgreSQL Indexing Benchmarks',
      'Analyze query execution plans (EXPLAIN ANALYZE) across 1M+ rows. Implement composite indices, partition tables, and benchmark latency improvements. Specific assignment for Alpha Innovators group.',
      in10Days.toISOString(),
      'https://onedrive.live.com/?cid=joineazy-db-opt-2026',
      'SPECIFIC_GROUPS',
      'ACTIVE',
      profId
    ]
  );

  // Link specific group for Task 3
  await db.query(
    `INSERT INTO assignment_target_groups (id, assignment_id, group_id) VALUES ($1, $2, $3)`,
    ['atg-1', asg3Id, group1Id]
  );

  // 6. Seed Submissions (Pre-populate one submission so charts and badges immediately show data)
  await db.query(
    `INSERT INTO submissions (id, assignment_id, group_id, submitted_by_user_id, status, submission_notes, onedrive_item_url, confirmed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      'sub-001',
      asg1Id,
      group1Id,
      'usr-stu-001',
      'CONFIRMED',
      'Uploaded complete PDF report and architecture slides to folder: /AlphaInnovators_Task1_Submission.pdf',
      'https://onedrive.live.com/?cid=joineazy-cloud-arch-2026&folder=AlphaInnovators',
      new Date().toISOString()
    ]
  );

  console.log('✓ Initial seed completed successfully!');
  console.log('  Admin User: prof@joineazy.edu | Password: Admin@123');
  console.log('  Student User: alex@joineazy.edu | Password: Student@123');
}

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}

module.exports = { seedData };
