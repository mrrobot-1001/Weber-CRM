import dotenv from 'dotenv';
// Load from .env.local if present, or .env
dotenv.config({ path: '.env.local' });
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    console.error('Error: DATABASE_URL or POSTGRES_URL environment variable is not defined.');
    console.log('Please create a .env.local file with your Neon database connection string.');
    process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDatabase() {
  console.log('🚀 Starting database initialization...');
  
  try {
    // Test connection
    const testResult = await pool.query('SELECT version()');
    console.log('✅ Database connected:', testResult.rows[0].version.substring(0, 50) + '...');

    // Create Departments table (referenced by users)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS departments (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✅ Departments table created');

    // Create Roles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        permissions JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Roles table created');

    // Create Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role_id INTEGER REFERENCES roles(id),
        department_id INTEGER REFERENCES departments(id),
        manager_id INTEGER REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'active',
        is_departmental_head BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Create Sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) NOT NULL UNIQUE,
        ip_address VARCHAR(50),
        user_agent TEXT,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        logout_time TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMP NOT NULL
      )
    `);
    console.log('✅ Sessions table created');

    // Create Audit Log table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        changes JSONB,
        ip_address VARCHAR(50),
        user_agent TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Audit Logs table created');

    // Create Work Assignments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS work_assignments (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assigned_by INTEGER NOT NULL REFERENCES users(id),
        assigned_to INTEGER NOT NULL REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'medium',
        due_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);
    console.log('✅ Work Assignments table created');

    // Create Work Submissions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS work_submissions (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER NOT NULL REFERENCES work_assignments(id) ON DELETE CASCADE,
        submitted_by INTEGER NOT NULL REFERENCES users(id),
        submission_notes TEXT,
        attachments JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'submitted',
        submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Work Submissions table created');

    // Create Evaluations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS evaluations (
        id SERIAL PRIMARY KEY,
        submission_id INTEGER NOT NULL REFERENCES work_submissions(id) ON DELETE CASCADE,
        evaluated_by INTEGER NOT NULL REFERENCES users(id),
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        comments TEXT,
        feedback JSONB,
        status VARCHAR(50) DEFAULT 'completed',
        evaluation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Evaluations table created');

    // Insert Default Roles if not exist
    await pool.query(`
      INSERT INTO roles (id, name, description) VALUES 
      (1, 'CEO', 'Chief Executive Officer'),
      (2, 'COO', 'Chief Operating Officer'),
      (3, 'Departmental_Head', 'Head of Department'),
      (4, 'Senior_Associate', 'Senior Level Employee'),
      (5, 'Associate', 'Entry Level Employee')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Default roles inserted');

    console.log('🎉 Database initialization completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();
