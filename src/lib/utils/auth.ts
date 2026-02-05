import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import config from '../config';
import logger from '../db/logger';
import { query } from '../db/pool';

// Fallback hardcoded users for demo/development
const DEMO_USERS: Record<string, any> = {
  'ceo_weber': {
    id: 1, username: 'ceo_weber', email: 'ceo@weberinnovation.com',
    password: 'ceo_password_2026', firstName: 'Chief', lastName: 'Executive',
    roleId: 1, roleName: 'CEO'
  },
  'coo_weber': {
    id: 2, username: 'coo_weber', email: 'coo@weberinnovation.com',
    password: 'coo_password_2026', firstName: 'Chief', lastName: 'Operating',
    roleId: 2, roleName: 'COO'
  },
  'depthead_weber': {
    id: 3, username: 'depthead_weber', email: 'depthead@weberinnovation.com',
    password: 'depthead_password_2026', firstName: 'Department', lastName: 'Head',
    roleId: 3, roleName: 'Department Head'
  },
  'senior_weber': {
    id: 4, username: 'senior_weber', email: 'senior@weberinnovation.com',
    password: 'senior_password_2026', firstName: 'Senior', lastName: 'Associate',
    roleId: 4, roleName: 'Senior Associate'
  },
  'associate_weber': {
    id: 5, username: 'associate_weber', email: 'associate@weberinnovation.com',
    password: 'associate_password_2026', firstName: 'Junior', lastName: 'Associate',
    roleId: 5, roleName: 'Associate'
  }
};

export const generateToken = (userId: number, username: string, roleId: number, roleName: string) => {
  return jwt.sign(
    {
      userId,
      username,
      roleId,
      roleName,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiry as any,
      issuer: 'weber-crm-api',
      algorithm: 'HS256',
    }
  );
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'],
    });
  } catch (error: any) {
    logger.warn('Token verification failed:', error.message);
    return null;
  }
};

export const validateCredentials = async (username: string, password: string) => {
  try {
    // Try database first if available
    const result = await query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.username = $1 OR u.email = $1`,
      [username]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isValid = await bcryptjs.compare(password, user.password_hash);

      if (isValid) {
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          roleId: user.role_id,
          roleName: user.role_name,
        };
      }
    }
  } catch (error: any) {
    // console.warn('Database authentication failed, falling back to demo users:', error.message);
  }

  // Fallback to demo users
  const demoUser = DEMO_USERS[username];
  if (demoUser && demoUser.password === password) {
    return {
      id: demoUser.id,
      username: demoUser.username,
      email: demoUser.email,
      firstName: demoUser.firstName,
      lastName: demoUser.lastName,
      roleId: demoUser.roleId,
      roleName: demoUser.roleName,
    };
  }

  return null;
};
