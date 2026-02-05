'use client'

import { useEffect, useState, useMemo } from 'react';
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
  Flex,
  Avatar,
} from '@chakra-ui/react';
import { FiArrowLeft, FiPlus, FiTrash2, FiUser, FiMail, FiCopy, FiCheck } from 'react-icons/fi';
import { Logo } from '@/components/logo';
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

const ROLE_NAME_TO_ID: Record<string, number> = {
  'CEO': 1,
  'COO': 2,
  'Departmental Head': 3,
  'DEPT_HEAD': 3,
  'Senior Associate': 4,
  'SENIOR': 4,
  'Associate': 5,
  'ASSOCIATE': 5,
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
    const currentRoleId = currentUser.roleId || ROLE_NAME_TO_ID[currentUser.role] || 99;
    const targetRoleId = targetUser.role_id || ROLE_NAME_TO_ID[targetUser.role] || 99;
    if (currentRoleId > 2) return false;
    if (targetUser.id === currentUser.id) return false;
    if (currentRoleId === 1) return targetRoleId !== 1;
    if (currentRoleId === 2) return targetRoleId >= 3;
    return false;
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUsers();
      setUsers(response.data || []);
    } catch (err: any) {
      toaster.create({
        title: 'Error loading users',
        description: err.response?.data?.message || err.message || 'Failed to load users',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await apiService.logout();
    router.push('/login');
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await apiService.deleteUser(deleteConfirm.id);
      toaster.create({
        title: 'User deleted',
        description: `User "${deleteConfirm.name}" has been deleted successfully`,
        type: 'success',
        duration: 4000,
      });
      setDeleteConfirm(null);
      loadUsers();
    } catch (err: any) {
      toaster.create({
        title: 'Delete failed',
        description: err.response?.data?.message || 'Failed to delete user',
        type: 'error',
        duration: 5000,
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
        duration: 4000,
      });
      setTempPassword(response.data?.tempPassword || '');
      setForm({ email: '', username: '', firstName: '', lastName: '', roleId: '5', departmentId: '', managerId: '' });
      loadUsers();
    } catch (err: any) {
      toaster.create({
        title: 'Failed to create user',
        description: err.response?.data?.message || 'An error occurred',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setCreating(false);
    }
  };

  const canManageUsers = currentUser?.role === 'CEO' || currentUser?.role === 'COO' || 
                         currentUser?.role === 'Departmental Head' || currentUser?.role === 'DEPT_HEAD' ||
                         [1, 2, 3].includes(currentUser?.roleId);

  const roleOptions = availableRoleOptions.map(r => ({ label: r.label, value: String(r.id) }));

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="white" borderBottom="1px" borderColor="gray.200" px={{ base: 4, md: 6 }} py={4} position="sticky" top={0} zIndex={10} boxShadow="sm">
        <Flex justify="space-between" align="center" maxW="container.xl" mx="auto">
          <HStack gap={4}>
            <Button variant="ghost" onClick={() => router.push('/dashboard')} borderRadius="lg" _hover={{ bg: 'gray.100' }}>
              <HStack gap={2}>
                <FiArrowLeft />
                <span>Back</span>
              </HStack>
            </Button>
            <HStack gap={3} align="center">
              <Box borderRadius="lg" overflow="hidden">
                <Logo size="sm" />
              </Box>
              <VStack align="start" gap={0} display={{ base: 'none', md: 'flex' }}>
                <Heading size="md" color="gray.800">Users</Heading>
                <Text fontSize="xs" color="gray.500">Manage team</Text>
              </VStack>
            </HStack>
          </HStack>
          <HStack gap={4}>
            <HStack gap={2} display={{ base: 'none', md: 'flex' }}>
              <Avatar.Root 
                size="sm"
              >
                <Avatar.Fallback bg="brand.500" color="white">
                  {getInitials(currentUser?.firstName, currentUser?.lastName)}
                </Avatar.Fallback>
              </Avatar.Root>
              <VStack gap={0} align="end">
                <Text fontWeight="semibold" fontSize="sm">{currentUser?.firstName} {currentUser?.lastName}</Text>
                <Text fontSize="xs" color="gray.500">{currentUser?.role}</Text>
              </VStack>
            </HStack>
            <Button variant="ghost" size="sm" onClick={handleLogout} borderRadius="lg">Logout</Button>
          </HStack>
        </Flex>
      </Box>

      <Container maxW="container.xl" py={8}>
        <VStack gap={6} align="stretch">
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
                      <span>{copiedPassword ? 'Copied!' : 'Copy Password'}</span>
                    </HStack>
                  </Button>
                </HStack>
              </Card.Body>
            </Card.Root>
          )}

          {canManageUsers && (
            <Card.Root borderRadius="xl" boxShadow="sm">
              <Card.Header pb={2}>
                <HStack gap={3}>
                  <Box p={2} borderRadius="lg" bg="brand.100" color="brand.600"><FiPlus size={20} /></Box>
                  <VStack align="start" gap={0}>
                    <Heading size="md" color="gray.800">Create New User</Heading>
                    <Text fontSize="sm" color="gray.500">Add a new team member to the system</Text>
                  </VStack>
                </HStack>
              </Card.Header>
              <Card.Body pt={4}>
                <form onSubmit={handleCreateUser}>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                    <Box>
                      <Text mb={2} fontWeight="medium" fontSize="sm"><HStack gap={1}><FiMail size={14} /><span>Email</span></HStack></Text>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@company.com" borderRadius="lg" required />
                    </Box>
                    <Box>
                      <Text mb={2} fontWeight="medium" fontSize="sm"><HStack gap={1}><FiUser size={14} /><span>Username</span></HStack></Text>
                      <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="john_doe" borderRadius="lg" required />
                    </Box>
                    <Box>
                      <Text mb={2} fontWeight="medium" fontSize="sm">First Name</Text>
                      <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="John" borderRadius="lg" required />
                    </Box>
                    <Box>
                      <Text mb={2} fontWeight="medium" fontSize="sm">Last Name</Text>
                      <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" borderRadius="lg" required />
                    </Box>
                    <Box>
                      <Select label="Role" value={form.roleId} onChange={(value) => setForm({ ...form, roleId: value })} options={roleOptions} required />
                    </Box>
                    <Box>
                      <Text mb={2} fontWeight="medium" fontSize="sm">Department ID (optional)</Text>
                      <Input type="number" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} placeholder="1" borderRadius="lg" />
                    </Box>
                    <Box>
                      <Text mb={2} fontWeight="medium" fontSize="sm">Manager ID (optional)</Text>
                      <Input type="number" value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })} placeholder="1" borderRadius="lg" />
                    </Box>
                  </Grid>
                  <Button 
                    mt={6} 
                    type="submit" 
                    bg="gray.900"
                    color="white"
                    size="md" 
                    borderRadius="md" 
                    loading={creating}
                    _hover={{ bg: 'gray.800' }} 
                    transition="all 0.15s"
                  >
                    <HStack gap={2}>
                      <FiPlus size={16} />
                      <span>Create User</span>
                    </HStack>
                  </Button>
                </form>
              </Card.Body>
            </Card.Root>
          )}

          <Card.Root borderRadius="xl" boxShadow="sm">
            <Card.Header pb={2}>
              <HStack justify="space-between">
                <HStack gap={3}>
                  <Box p={2} borderRadius="lg" bg="gray.100" color="gray.600"><FiUser size={20} /></Box>
                  <VStack align="start" gap={0}>
                    <Heading size="md">All Users</Heading>
                    <Text fontSize="sm" color="gray.500">{users.filter(u => u.status !== 'deleted').length} active users</Text>
                  </VStack>
                </HStack>
              </HStack>
            </Card.Header>
            <Card.Body pt={4}>
              {loading ? (
                <ListSkeleton count={4} />
              ) : users.filter(u => u.status !== 'deleted').length === 0 ? (
                <EmptyState icon={<FiUser size={40} />} title="No users found" description="Create your first user to get started" />
              ) : (
                <VStack gap={3} align="stretch">
                  {users.filter(u => u.status !== 'deleted').map((u) => (
                    <Box key={u.id} p={4} borderWidth="1px" borderRadius="xl" bg="white" transition="all 0.2s" _hover={{ boxShadow: 'md', borderColor: 'gray.300' }}>
                      <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
                        <HStack gap={4}>
                          <Avatar.Root 
                            size="md"
                          >
                            <Avatar.Fallback bg="brand.500" color="white">
                              {getInitials(u.first_name || u.firstName, u.last_name || u.lastName)}
                            </Avatar.Fallback>
                          </Avatar.Root>
                          <Box>
                            <Text fontWeight="bold" fontSize="md">{(u.first_name || u.firstName)} {(u.last_name || u.lastName)}</Text>
                            <Text fontSize="sm" color="gray.500">{u.email}</Text>
                            <Text fontSize="xs" color="gray.400">@{u.username}</Text>
                          </Box>
                        </HStack>
                        <HStack gap={4} flexWrap="wrap">
                          <VStack align="end" gap={1}>
                            <RoleBadge role={u.role} />
                            <StatusBadge status={u.status || 'active'} size="sm" />
                          </VStack>
                          {canDeleteUserFn(u) && (
                            <Button 
                              size="sm" 
                              colorScheme="red" 
                              variant="outline" 
                              borderRadius="lg"
                              onClick={() => setDeleteConfirm({ id: u.id, name: `${u.first_name || u.firstName} ${u.last_name || u.lastName}` })} 
                              _hover={{ bg: 'red.50' }}
                            >
                              <HStack gap={1}>
                                <FiTrash2 size={14} />
                                <span>Delete</span>
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
