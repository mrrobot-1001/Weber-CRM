'use client'

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  Card,
  Grid,
  Avatar,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiUser, FiMail, FiCopy, FiCheck } from 'react-icons/fi';
import { Navbar } from '@/components/navbar';
import { apiService } from '@/services/api';
import { toaster } from '@/components/ui/toaster';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { StatusBadge, RoleBadge } from '@/components/ui/badges';
import { ListSkeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/common';

const ALL_ROLE_OPTIONS = [
  { label: 'CEO', id: 1 },
  { label: 'COO', id: 2 },
  { label: 'Departmental Head', id: 3 },
  { label: 'Senior Associate', id: 4 },
  { label: 'Associate', id: 5 },
];

const ROLE_ID_MAP: Record<string, number> = {
  CEO: 1, COO: 2, Departmental_Head: 3, DEPT_HEAD: 3,
  'Departmental Head': 3, Senior_Associate: 4, SENIOR: 4,
  'Senior Associate': 4, Associate: 5, ASSOCIATE: 5,
};

export default function UsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tempPassword, setTempPassword] = useState('');
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    roleId: '5',
    departmentId: '',
    managerId: '',
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token) {
      router.push('/login');
      return;
    }
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    loadUsers();
  }, [router, mounted]);

  const availableRoleOptions = useMemo(() => {
    if (!currentUser) return [];
    const userRole = currentUser.role;
    const userRoleId = currentUser.roleId;
    if (userRole === 'CEO' || userRoleId === 1) {
      return ALL_ROLE_OPTIONS;
    } else if (userRole === 'COO' || userRoleId === 2) {
      return ALL_ROLE_OPTIONS.filter(r => r.id >= 3);
    } else if (userRole === 'Departmental Head' || userRole === 'DEPT_HEAD' || userRoleId === 3) {
      return ALL_ROLE_OPTIONS.filter(r => r.id >= 4);
    }
    return [];
  }, [currentUser]);

  const canDeleteUserFn = (targetUser: any) => {
    if (!currentUser) return false;
    const currentRoleId = currentUser.roleId || ROLE_ID_MAP[currentUser.role] || 99;
    const targetRoleId = targetUser.role_id || ROLE_ID_MAP[targetUser.role] || 99;
    if (currentRoleId > 2) return false;
    if (targetUser.id === currentUser.id) return false;
    if (currentRoleId === 1) return targetRoleId !== 1;
    if (currentRoleId === 2) return targetRoleId >= 3;
    return false;
  };

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getUsers();
      setUsers(response.data || []);
    } catch (err: any) {
      toaster.create({
        title: 'Error loading users',
        description: err.response?.data?.message || err.message || 'Failed to load users',
        type: 'error',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteUser = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await apiService.deleteUser(deleteConfirm.id);
      toaster.create({
        title: 'User deleted',
        description: `User "${deleteConfirm.name}" has been deleted successfully`,
        type: 'success',
        duration: 3000,
      });
      setDeleteConfirm(null);
      loadUsers();
    } catch (err: any) {
      toaster.create({
        title: 'Delete failed',
        description: err.response?.data?.message || 'Failed to delete user',
        type: 'error',
        duration: 4000,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopiedPassword(true);
    toaster.create({
      title: 'Copied!',
      description: 'Temporary password copied to clipboard',
      type: 'success',
      duration: 2000,
    });
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setTempPassword('');
    setCreating(true);
    try {
      const payload: any = {
        email: form.email,
        username: form.username,
        firstName: form.firstName,
        lastName: form.lastName,
        roleId: Number(form.roleId),
      };
      if (form.departmentId) payload.departmentId = Number(form.departmentId);
      if (form.managerId) payload.managerId = Number(form.managerId);

      const response = await apiService.createUser(payload);
      toaster.create({
        title: 'User created!',
        description: `${form.firstName} ${form.lastName} has been added successfully`,
        type: 'success',
        duration: 3000,
      });
      setTempPassword(response.data?.tempPassword || '');
      setForm({ email: '', username: '', firstName: '', lastName: '', roleId: '5', departmentId: '', managerId: '' });
      loadUsers();
    } catch (err: any) {
      toaster.create({
        title: 'Failed to create user',
        description: err.response?.data?.message || 'An error occurred',
        type: 'error',
        duration: 4000,
      });
    } finally {
      setCreating(false);
    }
  };

  const canManageUsers = (currentUser?.roleId || ROLE_ID_MAP[currentUser?.role] || 99) <= 3;

  const roleOptions = availableRoleOptions.map(r => ({ label: r.label, value: String(r.id) }));

  const activeUsers = useMemo(() => users.filter(u => u.status !== 'deleted'), [users]);

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar 
        title="Users" 
        subtitle="Manage team" 
        user={currentUser} 
        showBack={true} 
      />
      
      <Container maxW="container.xl" py={{ base: 4, md: 8 }} className="page-enter">
        <VStack gap={{ base: 3, md: 6 }} align="stretch">
          {tempPassword && (
            <Card.Root borderRadius="xl" bg="blue.50" borderColor="blue.200" borderWidth="1px">
              <Card.Body>
                <HStack justify="space-between" flexWrap="wrap" gap={4}>
                  <VStack align="start" gap={1}>
                    <Text fontWeight="semibold" color="blue.800">Temporary Password Generated</Text>
                    <Text fontFamily="mono" fontSize="lg" color="blue.900" fontWeight="bold">{tempPassword}</Text>
                    <Text fontSize="sm" color="blue.700">Share this password securely with the new user</Text>
                  </VStack>
                  <Button onClick={handleCopyPassword} colorScheme="blue" variant="solid" borderRadius="lg">
                    <HStack gap={2}>
                      {copiedPassword ? <FiCheck /> : <FiCopy />}
                      <Text>{copiedPassword ? 'Copied!' : 'Copy Password'}</Text>
                    </HStack>
                  </Button>
                </HStack>
              </Card.Body>
            </Card.Root>
          )}

          {canManageUsers && (
            <Card.Root borderRadius="xl" borderWidth="1px" borderColor="gray.100">
              <Card.Header pb={2}>
                <HStack gap={2}>
                  <Box p={1.5} borderRadius="lg" bg="gray.50" color="gray.600"><FiPlus size={16} /></Box>
                  <VStack align="start" gap={0}>
                    <Heading size={{ base: 'sm', md: 'md' }} color="gray.900" fontWeight="600">Create New User</Heading>
                    <Text fontSize="xs" color="gray.500">Add a new team member to the system</Text>
                  </VStack>
                </HStack>
              </Card.Header>
              <Card.Body pt={2}>
                <form onSubmit={handleCreateUser}>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={{ base: 2, md: 4 }}>
                    <Box>
                      <HStack gap={1} mb={1}>
                        <FiMail size={12} />
                        <Text fontWeight="medium" fontSize="xs">Email</Text>
                      </HStack>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@company.com" borderRadius="lg" size={{ base: 'sm', md: 'md' }} required />
                    </Box>
                    <Box>
                      <HStack gap={1} mb={1}>
                        <FiUser size={12} />
                        <Text fontWeight="medium" fontSize="xs">Username</Text>
                      </HStack>
                      <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="john_doe" borderRadius="lg" size={{ base: 'sm', md: 'md' }} required />
                    </Box>
                    <Box>
                      <Text mb={1} fontWeight="medium" fontSize="xs">First Name</Text>
                      <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="John" borderRadius="lg" size={{ base: 'sm', md: 'md' }} required />
                    </Box>
                    <Box>
                      <Text mb={1} fontWeight="medium" fontSize="xs">Last Name</Text>
                      <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" borderRadius="lg" size={{ base: 'sm', md: 'md' }} required />
                    </Box>
                    <Box>
                      <Select label="Role" value={form.roleId} onChange={(value) => setForm({ ...form, roleId: value })} options={roleOptions} required />
                    </Box>
                    <Box>
                      <Text mb={1} fontWeight="medium" fontSize="xs">Department ID (optional)</Text>
                      <Input type="number" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} placeholder="1" borderRadius="lg" size={{ base: 'sm', md: 'md' }} />
                    </Box>
                    <Box>
                      <Text mb={1} fontWeight="medium" fontSize="xs">Manager ID (optional)</Text>
                      <Input type="number" value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })} placeholder="1" borderRadius="lg" size={{ base: 'sm', md: 'md' }} />
                    </Box>
                  </Grid>
                  <Button 
                    mt={{ base: 3, md: 6 }} 
                    type="submit" 
                    bg="gray.900"
                    color="white"
                    size={{ base: 'sm', md: 'md' }} 
                    borderRadius="md" 
                    loading={creating}
                    _hover={{ bg: 'gray.800' }} 
                    transition="all 0.15s"
                  >
                    <HStack gap={2}>
                      <FiPlus size={14} />
                      <Text fontSize={{ base: 'xs', md: 'sm' }}>Create User</Text>
                    </HStack>
                  </Button>
                </form>
              </Card.Body>
            </Card.Root>
          )}

          <Card.Root borderRadius="xl" borderWidth="1px" borderColor="gray.100">
            <Card.Header pb={2}>
              <HStack justify="space-between">
                <HStack gap={2}>
                  <Box p={1.5} borderRadius="lg" bg="gray.50" color="gray.600" display={{ base: 'none', md: 'block' }}><FiUser size={18} /></Box>
                  <VStack align="start" gap={0}>
                    <Heading size={{ base: 'sm', md: 'md' }} fontWeight="600">All Users</Heading>
                    <Text fontSize="xs" color="gray.500">{activeUsers.length} active users</Text>
                  </VStack>
                </HStack>
              </HStack>
            </Card.Header>
            <Card.Body pt={4}>
              {loading ? (
                <ListSkeleton count={4} />
              ) : activeUsers.length === 0 ? (
                <EmptyState icon={<FiUser size={40} />} title="No users found" description="Create your first user to get started" />
              ) : (
                <VStack gap={3} align="stretch">
                  {activeUsers.map((u) => (
                    <Box key={u.id} p={{ base: 3, md: 4 }} borderWidth="1px" borderRadius="xl" bg="white" transition="all 0.2s" _hover={{ boxShadow: 'md', borderColor: 'gray.300' }}>
                      <HStack justify="space-between" align="center" flexWrap="wrap" gap={{ base: 2, md: 4 }}>
                        <HStack gap={{ base: 2.5, md: 4 }}>
                          <Avatar.Root 
                            size="sm"
                          >
                            <Avatar.Fallback bg="brand.500" color="white" fontSize="xs">
                              {getInitials(u.first_name || u.firstName, u.last_name || u.lastName)}
                            </Avatar.Fallback>
                          </Avatar.Root>
                          <Box>
                            <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>{(u.first_name || u.firstName)} {(u.last_name || u.lastName)}</Text>
                            <Text fontSize="xs" color="gray.500">{u.email}</Text>
                            <Text fontSize="xs" color="gray.400" display={{ base: 'none', md: 'block' }}>@{u.username}</Text>
                          </Box>
                        </HStack>
                        <HStack gap={{ base: 2, md: 4 }} flexWrap="wrap">
                          <VStack align="end" gap={1}>
                            <RoleBadge role={u.role} size="sm" />
                            <StatusBadge status={u.status || 'active'} size="sm" />
                          </VStack>
                          {canDeleteUserFn(u) && (
                            <Button 
                              size="xs" 
                              colorScheme="red" 
                              variant="outline" 
                              borderRadius="lg"
                              onClick={() => setDeleteConfirm({ id: u.id, name: `${u.first_name || u.firstName} ${u.last_name || u.lastName}` })} 
                              _hover={{ bg: 'red.50' }}
                            >
                              <HStack gap={1}>
                                <FiTrash2 size={12} />
                                <Text display={{ base: 'none', md: 'inline' }}>Delete</Text>
                              </HStack>
                            </Button>
                          )}
                        </HStack>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </Card.Body>
          </Card.Root>

          <ConfirmModal
            isOpen={!!deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            onConfirm={handleDeleteUser}
            title="Delete User"
            message={<>Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?<br /><Text as="span" fontSize="sm" color="gray.500">This action cannot be undone.</Text></>}
            confirmText="Delete User"
            isLoading={deleting}
            variant="danger"
          />
        </VStack>
      </Container>
    </Box>
  );
}
