export const ROLES = {
  CEO: 1,
  COO: 2,
  DEPT_HEAD: 3,
  SENIOR: 4,
  ASSOCIATE: 5
};

export function canManageUsers(roleId: number) {
  return [ROLES.CEO, ROLES.COO, ROLES.DEPT_HEAD].includes(roleId);
}

export function canAssignWork(roleId: number) {
  return [ROLES.CEO, ROLES.COO, ROLES.DEPT_HEAD, ROLES.SENIOR].includes(roleId);
}

export function canEvaluate(roleId: number) {
  return [ROLES.CEO, ROLES.COO, ROLES.DEPT_HEAD, ROLES.SENIOR].includes(roleId);
}

// Delete permissions - only CEO and COO can delete users
export function canDeleteUser(roleId: number) {
  return [ROLES.CEO, ROLES.COO].includes(roleId);
}

// Check if a user can delete a specific user based on role hierarchy
export function canDeleteUserWithRole(deleterRoleId: number, targetRoleId: number): boolean {
  // CEO can delete anyone except themselves (handled in route)
  if (deleterRoleId === ROLES.CEO) return targetRoleId !== ROLES.CEO;
  
  // COO can delete DEPT_HEAD and below
  if (deleterRoleId === ROLES.COO) return targetRoleId >= ROLES.DEPT_HEAD;
  
  return false;
}

// Delete assignments - creator or higher roles can delete
export function canDeleteAssignment(roleId: number) {
  return [ROLES.CEO, ROLES.COO, ROLES.DEPT_HEAD, ROLES.SENIOR].includes(roleId);
}
