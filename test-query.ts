import pool from './src/lib/db/pool';

async function testQuery() {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.username, u.first_name, u.last_name, u.status,
             r.name as role, d.name as department, u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY u.created_at DESC
    `);
    console.log('Query successful:', result.rows);
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await pool.end();
  }
}

testQuery();
