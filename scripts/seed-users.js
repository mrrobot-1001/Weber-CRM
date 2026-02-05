import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import pkg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pkg;

if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    console.error('Error: DATABASE_URL or POSTGRES_URL environment variable is not defined.');
    process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedUsers() {
  console.log('🌱 Seeding test users...');

  try {
    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const users = [
      { id: 1, email: 'ceo@weberinnovation.com', username: 'ceo_weber', password: 'ceo_password_2026', first: 'Chief', last: 'Executive', role: 1 },
      { id: 2, email: 'coo@weberinnovation.com', username: 'coo_weber', password: 'coo_password_2026', first: 'Chief', last: 'Operating', role: 2 },
      { id: 3, email: 'depthead@weberinnovation.com', username: 'depthead_weber', password: 'depthead_password_2026', first: 'Department', last: 'Head', role: 3 },
      { id: 4, email: 'senior@weberinnovation.com', username: 'senior_weber', password: 'senior_password_2026', first: 'Senior', last: 'Associate', role: 4 },
      { id: 5, email: 'associate@weberinnovation.com', username: 'associate_weber', password: 'associate_password_2026', first: 'Junior', last: 'Associate', role: 5 }
    ];

    for (const u of users) {
      const hash = await bcrypt.hash(u.password, salt);
      await pool.query(`
        INSERT INTO users (id, email, username, password_hash, first_name, last_name, role_id, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          role_id = EXCLUDED.role_id,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name
      `, [u.id, u.email, u.username, hash, u.first, u.last, u.role]);
    }
    
    console.log('✅ Test users created with hashed passwords');

    // Verify users
    const result = await pool.query('SELECT id, username, email, role_id FROM users ORDER BY id');
    console.log('\n📋 Created users:');
    result.rows.forEach(user => {
      console.log(`  ${user.id}. ${user.username} (${user.email}) - Role: ${user.role_id}`);
    });

    console.log('\n🎉 Seeding completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

seedUsers();
