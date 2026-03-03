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
  Textarea,
  Card,
  Grid,
  Flex,
  Avatar,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiClipboard, FiCalendar, FiUser, FiAlertCircle, FiCheckSquare, FiSearch } from 'react-icons/fi';
import { Navbar } from '@/components/navbar';
import { apiService } from '@/services/api';
import { toaster } from '@/components/ui/toaster';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { StatusBadge, PriorityBadge } from '@/components/ui/badges';
import { ListSkeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/common';
import { useWebSocket, useWebSocketEvent } from '@/hooks/useWebSocket';

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

const ROLE_ID_MAP: Record<string, number> = {
  'CEO': 1, 'COO': 2, 'Departmental_Head': 3, 'Departmental Head': 3, 'DEPT_HEAD': 3,
  'Senior_Associate': 4, 'Senior Associate': 4, 'SENIOR': 4,
  'Associate': 5, 'ASSOCIATE': 5,
};

function getRoleId(user: any): number {
  if (!user) return 99;
  return user.roleId || ROLE_ID_MAP[user.role] || 99;
}

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

  // Sort and filter states
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [mounted, setMounted] = useState(false);
  const currentDate = useMemo(() => new Date(), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // WebSocket connection & real-time updates
  useWebSocket();
  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getAssignments(sortBy, sortOrder, filterStatus || undefined);
      setAssignments(response.data || []);
    } catch (err: any) {
      toaster.create({
        title: 'Error loading assignments',
        description: err.response?.data?.message || 'Failed to load assignments',
        type: 'error',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, filterStatus]);

  useWebSocketEvent('assignment_created', loadAssignments);
  useWebSocketEvent('assignment_updated', loadAssignments);
  useWebSocketEvent('assignment_deleted', loadAssignments);

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
  }, [router, mounted, loadAssignments]);

  const canDeleteAssignmentFn = (assignment: any) => {
    if (!currentUser) return false;
    const rid = getRoleId(currentUser);
    if (rid > 4) return false;
    if (rid <= 2) return true;
    return assignment.assigned_by_username === currentUser.username ||
           assignment.assigned_to_username === currentUser.username;
  };

  const loadUsers = useCallback(async () => {
    try {
      const response = await apiService.getUsers();
      const allUsers = response.data || [];
      const rid = getRoleId(currentUser);
      
      const filteredUsers = allUsers.filter((u: any) => {
        const userRoleId = u.role_id || ROLE_ID_MAP[u.role] || 999;
        if (rid === 1) return userRoleId !== 1;
        if (rid === 2) return userRoleId >= 3;
        if (rid === 3) return userRoleId >= 4;
        if (rid === 4) return userRoleId >= 5;
        return false;
      });
      
      setUsers(filteredUsers);
    } catch (err: any) {
      toaster.create({
        title: 'Error loading users',
        description: err.response?.data?.message || 'Failed to load users',
        type: 'error',
        duration: 4000,
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && getRoleId(currentUser) <= 4) {
      loadUsers();
    }
  }, [currentUser, loadUsers]);

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
    
    // Validate required fields
    if (!form.title || form.title.trim() === '') {
      toaster.create({
        title: 'Validation Error',
        description: 'Please enter an assignment title',
        type: 'error',
        duration: 5000,
      });
      return;
    }

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
        title: form.title.trim(),
        description: form.description.trim() || '',
        assignedTo: Number(form.assignedTo),
        priority: form.priority,
        dueDate: form.dueDate || null,
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

  const canAssignWork = getRoleId(currentUser) <= 4;
  const canManageUsers = getRoleId(currentUser) <= 2;

  const userOptions = users.map(u => ({ label: `${u.username} (${u.role})`, value: String(u.id) }));

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < currentDate;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Memoize the filtered list so it's computed once per render
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!a.title.toLowerCase().includes(term) &&
            !a.assigned_to_username.toLowerCase().includes(term) &&
            !a.assigned_by_username.toLowerCase().includes(term)) return false;
      }
      if (filterStatus && a.status !== filterStatus) return false;
      return true;
    });
  }, [assignments, searchTerm, filterStatus]);

  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar 
        title="Assignments" 
        subtitle="Manage work" 
        user={currentUser} 
        showBack={true} 
      />

      <Container maxW="container.xl" py={8} className="page-enter">
        <VStack gap={6} align="stretch">
        {currentUser?.role !== 'ASSOCIATE' ? (
          <Box mb={8}>
            <Card.Root borderRadius="xl" borderWidth="1px" borderColor="gray.100" bg="white" boxShadow="none">
              <Card.Header pb={2}>
                <HStack gap={3}>
                  <Box p={2} borderRadius="lg" bg="gray.50" color="gray.700"><FiPlus size={18} /></Box>
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
                      <HStack gap={1} mb={2}>
                        <FiClipboard size={14} />
                        <Text fontWeight="medium" fontSize="sm">Title</Text>
                      </HStack>
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
                          <HStack gap={1} mb={2}>
                            <FiUser size={14} />
                            <Text fontWeight="medium" fontSize="sm">Assign To (User ID)</Text>
                          </HStack>
                          <Input type="number" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} placeholder="Enter user ID" borderRadius="lg" required />
                        </>
                      )}
                    </Box>
                    <Box>
                      <HStack gap={1} mb={2}>
                        <FiCalendar size={14} />
                        <Text fontWeight="medium" fontSize="sm">Due Date</Text>
                      </HStack>
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
                      <Text>Create Assignment</Text>
                    </HStack>
                  </Button>
                </form>
              </Card.Body>
            </Card.Root>
          </Box>
        ) : (
           <Box mb={8}>
            <Card.Root borderRadius="xl" bg="gray.50" borderColor="gray.100" borderWidth="1px" boxShadow="none">
              <Card.Body>
                <HStack gap={3}>
                  <Box p={2} borderRadius="md" bg="white" color="gray.600"><FiAlertCircle size={18} /></Box>
                  <Text color="gray.700" fontSize="sm">You can view assignments assigned to you. Only managers can create new assignments.</Text>
                </HStack>
              </Card.Body>
            </Card.Root>
          </Box>
        )}

          <Card.Root borderRadius="xl" borderWidth="1px" borderColor="gray.100" bg="white" boxShadow="none">
            <Card.Header pb={4}>
              <VStack align="stretch" gap={4}>
                <HStack justify="space-between">
                  <VStack align="start" gap={0}>
                    <Heading size="md" color="gray.900" fontWeight="600">Your Assignments</Heading>
                    <Text fontSize="sm" color="gray.500">{filteredAssignments.length} assignments</Text>
                  </VStack>
                </HStack>

                {/* Search */}
                <HStack gap={3} pb={3} borderBottom="1px" borderColor="gray.200">
                  <FiSearch color="gray.400" size={18} />
                  <Input
                    type="text"
                    placeholder="Search assignments by title or assignee..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="sm"
                    borderRadius="md"
                    bg="white"
                  />
                  <Select
                    label=""
                    value={filterStatus}
                    onChange={(value) => setFilterStatus(value)}
                    options={[
                      { label: 'All Statuses', value: '' },
                      { label: 'Pending', value: 'pending' },
                      { label: 'In Progress', value: 'in_progress' },
                      { label: 'Submitted', value: 'submitted' },
                      { label: 'Evaluated', value: 'evaluated' },
                      { label: 'Completed', value: 'completed' },
                    ]}
                  />
                </HStack>

                {/* Sorting */}
                <HStack gap={3} pb={3} borderBottom="1px" borderColor="gray.200">
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">Sort by:</Text>
                  <HStack gap={2}>
                    <Select
                      label=""
                      value={sortBy}
                      onChange={(value) => setSortBy(value)}
                      options={[
                        { label: 'Created Date', value: 'created_at' },
                        { label: 'Due Date', value: 'due_date' },
                        { label: 'Priority', value: 'priority' },
                        { label: 'Title', value: 'title' },
                      ]}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                      borderRadius="md"
                    >
                      {sortOrder === 'DESC' ? '↓ Descending' : '↑ Ascending'}
                    </Button>
                  </HStack>
                </HStack>
              </VStack>
            </Card.Header>
            <Card.Body pt={4}>
              {loading ? (
                <ListSkeleton count={4} />
              ) : filteredAssignments.length === 0 ? (
                <EmptyState icon={<FiClipboard size={40} />} title="No assignments found" description="There are no assignments to display" />
              ) : (
                <VStack gap={3} align="stretch">
                  {filteredAssignments.map((assignment) => (
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
                                  <Text>Submit</Text>
                                </HStack>
                              </Button>
                            )}
                            {canDeleteAssignmentFn(assignment) && (
                              <Button size="sm" bg="white" color="gray.700" variant="outline" borderRadius="md" borderColor="gray.300"
                                onClick={() => setDeleteConfirm({ id: assignment.id, title: assignment.title })} _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}>
                                <HStack gap={1}>
                                  <FiTrash2 size={14} />
                                  <Text>Delete</Text>
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
