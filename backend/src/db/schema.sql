-- Joineazy Database Schema (PostgreSQL)

-- Users table (Students & Admin Professors)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'admin')),
  student_id VARCHAR(100),
  department VARCHAR(100) DEFAULT 'Computer Science',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  join_code VARCHAR(20) UNIQUE NOT NULL,
  created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group Members table (Many-to-Many between users and groups)
CREATE TABLE IF NOT EXISTS group_members (
  id VARCHAR(50) PRIMARY KEY,
  group_id VARCHAR(50) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_in_group VARCHAR(50) DEFAULT 'member' CHECK (role_in_group IN ('leader', 'member')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMP NOT NULL,
  onedrive_link TEXT NOT NULL,
  target_type VARCHAR(50) DEFAULT 'ALL' CHECK (target_type IN ('ALL', 'SPECIFIC_GROUPS')),
  status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Specific group targets for assignments
CREATE TABLE IF NOT EXISTS assignment_target_groups (
  id VARCHAR(50) PRIMARY KEY,
  assignment_id VARCHAR(50) NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  group_id VARCHAR(50) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  UNIQUE(assignment_id, group_id)
);

-- Submissions table with two-step confirmation verification
CREATE TABLE IF NOT EXISTS submissions (
  id VARCHAR(50) PRIMARY KEY,
  assignment_id VARCHAR(50) NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  group_id VARCHAR(50) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  submitted_by_user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED')),
  submission_notes TEXT,
  onedrive_item_url TEXT,
  confirmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(assignment_id, group_id)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_submissions_group ON submissions(group_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
