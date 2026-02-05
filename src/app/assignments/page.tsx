'use client'

import { useEffect, useState } from 'react';
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
  Textarea,
  Card,
  Grid,
  Flex,
  Avatar,
} from '@chakra-ui/react';
import { FiArrowLeft, FiPlus, FiTrash2, FiClipboard, FiCalendar, FiUser, FiAlertCircle, FiCheckSquare } from 'react-icons/fi';
import { apiService } from '@/services/api';
import { toaster } from '@/components/ui/toaster';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { StatusBadge, PriorityBadge } from '@/components/ui/badges';
import { ListSkeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/common';

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
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

export default function AssignmentsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
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
    loadAssignments();
  }, [router, mounted]);

  const canDeleteAssignmentFn = (assignment: any) => {
    if (!currentUser) return false;
    const currentRoleId = currentUser.roleId || ROLE_NAME_TO_ID[currentUser.role] || 99;
    if (currentRoleId > 4) return false;
    if (currentRoleId <= 2) return true;
    const isCreator = assignment.assigned_by_username === currentUser.username;
    const isAssignee = assignment.assigned_to_username === currentUser.username;
    return isCreator || isAssignee;
  };

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAssignments();
      setAssignments(response.data || []);
    } catch (err: any) {
      toaster.create({
        title: 'Error loading assignments',
        description: err.response?.data?.message || 'Failed to load assignments',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiService.getUsers();
      const allUsers = response.data || [];
      
      // Filter users based on current user's role
      // CEO can assign to anyone except other CEOs
      // COO can assign to DEPT_HEAD, SENIOR, ASSOCIATE
      // DEPT_HEAD can assign to SENIOR, ASSOCIATE
      // SENIOR can assign to ASSOCIATE
      let filteredUsers = allUsers;
      
      if (currentUser) {
        const currentRoleId = currentUser.roleId || ROLE_NAME_TO_ID[currentUser.role] || 999;
        
        if (currentRoleId === 1) {
          // CEO: Can assign to anyone except other CEOs
          filteredUsers = allUsers.filter((u: any) => {
            const userRoleId = u.role_id || ROLE_NAME_TO_ID[u.role] || 999;
            return userRoleId !== 1;
          });
        } else if (currentRoleId === 2) {
          // COO: Can assign to DEPT_HEAD, SENIOR, ASSOCIATE
          filteredUsers = allUsers.filter((u: any) => {
            const userRoleId = u.role_id || ROLE_NAME_TO_ID[u.role] || 999;
            return userRoleId >= 3;
          });
        } else if (currentRoleId === 3) {
          // DEPT_HEAD: Can assign to SENIOR, ASSOCIATE
          filteredUsers = allUsers.filter((u: any) => {
            const userRoleId = u.role_id || ROLE_NAME_TO_ID[u.role] || 999;
            return userRoleId >= 4;
          });
        } else if (currentRoleId === 4) {
          // SENIOR: Can assign to ASSOCIATE
          filteredUsers = allUsers.filter((u: any) => {
            const userRoleId = u.role_id || ROLE_NAME_TO_ID[u.role] || 999;
            return userRoleId >= 5;
          });
        }
      }
      
      setUsers(filteredUsers);
    } catch (err: any) {
      toaster.create({
        title: 'Error loading users',
        description: err.response?.data?.message || 'Failed to load users',
        type: 'error',
        duration: 5000,
      });
    }
  };

  useEffect(() => {
    const canManageUsers = currentUser?.role === 'CEO' || currentUser?.role === 'COO';
    if (canManageUsers) {
      loadUsers();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    await apiService.logout();
    router.push('/login');
  };

  const handleDeleteAssignment = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await apiService.deleteAssignment(deleteConfirm.id);
      toaster.create({
        title: 'Assignment deleted',
        description: `Assignment "${deleteConfirm.title}" has been deleted successfully`,
        type: 'success',
        duration: 4000,
      });
      setDeleteConfirm(null);
      loadAssignments();
    } catch (err: any) {
      toaster.create({
        title: 'Delete failed',
        description: err.response?.data?.message || 'Failed to delete assignment',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate assignedTo field
    if (!form.assignedTo || form.assignedTo === '') {
      toaster.create({
        title: 'Validation Error',
        description: 'Please select a team member to assign the work to',
        type: 'error',
        duration: 5000,
      });
      return;
    }
    
    setCreating(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        assignedTo: Number(form.assignedTo),
        priority: form.priority,
        dueDate: form.dueDate || undefined,
      };
      await apiService.createAssignment(payload);
      toaster.create({
        title: 'Assignment created!',
        description: `"${form.title}" has been assigned successfully`,
        type: 'success',
        duration: 4000,
      });
      setForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
      loadAssignments();
    } catch (err: any) {
      toaster.create({
        title: 'Failed to create assignment',
        description: err.response?.data?.message || 'An error occurred',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setCreating(false);
    }
  };

  const canAssignWork = ['CEO', 'COO', 'Departmental_Head', 'Senior_Associate', 'Departmental Head', 'Senior Associate', 'DEPT_HEAD', 'SENIOR'].includes(currentUser?.role || '') || [1, 2, 3, 4].includes(currentUser?.roleId);
  const canManageUsers = currentUser?.role === 'CEO' || currentUser?.role === 'COO' || [1, 2].includes(currentUser?.roleId);

  const formatDate = (value?: string) => {
    if (!value) return 'No due date';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (username?: string) => {
    if (!username) return '?';
    return username.slice(0, 2).toUpperCase();
  };

  const userOptions = users.map(u => ({ label: `${u.username} (${u.role})`, value: String(u.id) }));

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
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
            <VStack align="start" gap={0}>
              <Heading size="lg" color="gray.800">Assignments</Heading>
              <Text fontSize="sm" color="gray.500">Manage and track work assignments</Text>
            </VStack>
          </HStack>
          <HStack gap={4}>
            <HStack gap={2} display={{ base: 'none', md: 'flex' }}>
              <Avatar.Root size="sm">
                <Avatar.Fallback bg="brand.500" color="white">
                  {getInitials(currentUser?.username)}
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
          {canAssignWork ? (
            <Card.Root borderRadius="lg" borderWidth="1px" borderColor="gray.200" bg="white" boxShadow="none">
              <Card.Header pb={2}>
                <HStack gap={3}>
                  <Box p={2} borderRadius="md" bg="gray.50" color="gray.700"><FiPlus size={18} /></Box>
                  <VStack align="start" gap={0}>
                    <Heading size="md" color="gray.900" fontWeight="600">Create Assignment</Heading>
                    <Text fontSize="sm" color="gray.500">Assign work to team members</Text>
                  </VStack>
                </HStack>
              </Card.Header>
              <Card.Body pt={4}>
                <form onSubmit={handleCreateAssignment}>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                    <Box>
                      <Text mb={2} fontWeight="medium" fontSize="sm"><HStack gap={1}><FiClipboard size={14} /><span>Title</span></HStack></Text>
                      <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Enter assignment title" borderRadius="lg" required />
                    </Box>
                    <Box>
                      <Select label="Priority" value={form.priority} onChange={(value) => setForm({ ...form, priority: value })} options={PRIORITY_OPTIONS} />
                    </Box>
                    <Box>
                      {canManageUsers ? (
                        <Select label="Assign To" value={form.assignedTo} onChange={(value) => setForm({ ...form, assignedTo: value })} options={userOptions} placeholder="Select team member" required />
                      ) : (
                        <>
                          <Text mb={2} fontWeight="medium" fontSize="sm"><HStack gap={1}><FiUser size={14} /><span>Assign To (User ID)</span></HStack></Text>
                          <Input type="number" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} placeholder="Enter user ID" borderRadius="lg" required />
                        </>
                      )}
                    </Box>
                    <Box>
                      <Text mb={2} fontWeight="medium" fontSize="sm"><HStack gap={1}><FiCalendar size={14} /><span>Due Date</span></HStack></Text>
                      <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} borderRadius="lg" />
                    </Box>
                    <Box gridColumn={{ base: 'auto', md: '1 / -1' }}>
                      <Text mb={2} fontWeight="medium" fontSize="sm">Description</Text>
                      <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the assignment..." borderRadius="lg" rows={3} />
                    </Box>
                  </Grid>
                  <Button mt={6} type="submit" bg="gray.900" color="white" size="md" borderRadius="md" loading={creating} _hover={{ bg: 'gray.800' }} transition="all 0.2s">
                    <HStack gap={2}>
                      <FiPlus size={16} />
                      <span>Create Assignment</span>
                    </HStack>
                  </Button>
                </form>
              </Card.Body>
            </Card.Root>
          ) : (
            <Card.Root borderRadius="lg" bg="gray.50" borderColor="gray.200" borderWidth="1px" boxShadow="none">
              <Card.Body>
                <HStack gap={3}>
                  <Box p={2} borderRadius="md" bg="white" color="gray.600"><FiAlertCircle size={18} /></Box>
                  <Text color="gray.700" fontSize="sm">You can view assignments assigned to you. Only managers can create new assignments.</Text>
                </HStack>
              </Card.Body>
            </Card.Root>
          )}

          <Card.Root borderRadius="lg" borderWidth="1px" borderColor="gray.200" bg="white" boxShadow="none">
            <Card.Header pb={2}>
              <HStack justify="space-between">
                <VStack align="start" gap={0}>
                  <Heading size="md" color="gray.900" fontWeight="600">Your Assignments</Heading>
                  <Text fontSize="sm" color="gray.500">{assignments.length} assignments</Text>
                </VStack>
              </HStack>
            </Card.Header>
            <Card.Body pt={4}>
              {loading ? (
                <ListSkeleton count={4} />
              ) : assignments.length === 0 ? (
                <EmptyState icon={<FiClipboard size={40} />} title="No assignments found" description="There are no assignments to display" />
              ) : (
                <VStack gap={3} align="stretch">
                  {assignments.map((assignment) => (
                    <Box key={assignment.id} p={4} borderWidth="1px" borderRadius="md" bg="white" transition="all 0.15s" _hover={{ borderColor: 'gray.300' }} borderLeftWidth="3px" borderLeftColor={assignment.status === 'completed' ? 'gray.400' : isOverdue(assignment.due_date) ? 'gray.900' : 'gray.300'}>
                      <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
                        <Box flex={1}>
                          <HStack mb={2} gap={2}>
                            <Text fontWeight="600" fontSize="md" color="gray.900">{assignment.title}</Text>
                            <PriorityBadge priority={assignment.priority} />
                          </HStack>
                          <Text fontSize="sm" color="gray.600" mb={3}>{assignment.description || 'No description provided'}</Text>
                          <HStack gap={4} flexWrap="wrap" fontSize="sm" color="gray.500">
                            <HStack gap={1}>
                              <FiUser size={14} />
                              <Text>From: <strong>{assignment.assigned_by_username}</strong></Text>
                            </HStack>
                            <HStack gap={1}>
                              <FiUser size={14} />
                              <Text>To: <strong>{assignment.assigned_to_username}</strong></Text>
                            </HStack>
                            <HStack gap={1}>
                              <FiCalendar size={14} />
                              <Text color={isOverdue(assignment.due_date) && assignment.status !== 'completed' ? 'red.500' : 'inherit'} fontWeight={isOverdue(assignment.due_date) ? 'semibold' : 'normal'}>
                                {formatDate(assignment.due_date)}
                              </Text>
                            </HStack>
                          </HStack>
                        </Box>
                        <VStack align="end" gap={2}>
                          <StatusBadge status={assignment.status} />
                          <HStack gap={2}>
                            {assignment.status !== 'completed' && assignment.assigned_to_username === currentUser?.username && (
                              <Button size="sm" bg="gray.900" color="white" variant="solid" borderRadius="md"
                                onClick={() => router.push(`/submissions?assignmentId=${assignment.id}`)} _hover={{ bg: 'gray.800' }}>
                                <HStack gap={1}>
                                  <FiCheckSquare size={14} />
                                  <span>Submit</span>
                                </HStack>
                              </Button>
                            )}
                            {canDeleteAssignmentFn(assignment) && (
                              <Button size="sm" bg="white" color="gray.700" variant="outline" borderRadius="md" borderColor="gray.300"
                                onClick={() => setDeleteConfirm({ id: assignment.id, title: assignment.title })} _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}>
                                <HStack gap={1}>
                                  <FiTrash2 size={14} />
                                  <span>Delete</span>
                                </HStack>
                              </Button>
                            )}
                          </HStack>
                        </VStack>
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
            onConfirm={handleDeleteAssignment}
            title="Delete Assignment"
            message={<>Are you sure you want to delete <strong>"{deleteConfirm?.title}"</strong>?<br /><Text as="span" fontSize="sm" color="gray.500">This action cannot be undone.</Text></>}
            confirmText="Delete Assignment"
            isLoading={deleting}
            variant="danger"
          />
        </VStack>
      </Container>
    </Box>
  );
}
