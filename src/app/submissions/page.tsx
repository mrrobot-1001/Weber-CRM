'use client'

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { FiUpload, FiFileText, FiTrash2, FiClock, FiUser, FiSearch } from 'react-icons/fi';
import { Navbar } from '@/components/navbar';
import { apiService } from '@/services/api';
import { toaster } from '@/components/ui/toaster';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { StatusBadge } from '@/components/ui/badges';
import { ListSkeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/common';
import { useWebSocket, useWebSocketEvent } from '@/hooks/useWebSocket';

const ROLE_ID_MAP: Record<string, number> = {
  'CEO': 1, 'COO': 2, 'Departmental Head': 3, 'DEPT_HEAD': 3,
  'Senior Associate': 4, 'SENIOR': 4, 'Associate': 5, 'ASSOCIATE': 5,
};

function SubmissionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [submissionForm, setSubmissionForm] = useState({
    assignmentId: '',
    submissionNotes: '',
  });

  // Sort and filter states
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // WebSocket connection & real-time updates
  useWebSocket();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [assignmentsRes, submissionsRes] = await Promise.all([
        apiService.getAssignments().catch(() => ({ data: [] })),
        apiService.getSubmissions().catch(() => ({ data: [] })),
      ]);
      setAssignments(assignmentsRes.data || []);
      setSubmissions(submissionsRes.data || []);
      
      // Pre-select assignment from URL parameter
      const assignmentIdParam = searchParams.get('assignmentId');
      if (assignmentIdParam && !submissionForm.assignmentId) {
        setSubmissionForm(prev => ({ ...prev, assignmentId: assignmentIdParam }));
      }
    } catch (err: any) {
      toaster.create({
        title: 'Error loading data',
        description: err.response?.data?.message || 'Failed to load submissions',
        type: 'error',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [searchParams, submissionForm.assignmentId]);

  useWebSocketEvent('submission_created', loadData);
  useWebSocketEvent('submission_updated', loadData);
  useWebSocketEvent('submission_deleted', loadData);

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
    loadData();
  }, [router, mounted, loadData]);

  const canDeleteSubmissionFn = (submission: any) => {
    if (!currentUser) return false;
    const rid = currentUser.roleId || ROLE_ID_MAP[currentUser.role] || 99;
    if (rid <= 2) return true;
    return submission.submitted_by_username === currentUser.username;
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await apiService.deleteSubmission(deleteConfirm.id);
      toaster.create({
        title: 'Submission deleted',
        description: 'The submission has been deleted successfully',
        type: 'success',
        duration: 4000,
      });
      setDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      toaster.create({
        title: 'Delete failed',
        description: err.response?.data?.message || 'Failed to delete submission',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!submissionForm.assignmentId || submissionForm.assignmentId === '') {
      toaster.create({
        title: 'Validation Error',
        description: 'Please select an assignment',
        type: 'error',
        duration: 5000,
      });
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createSubmission({
        assignmentId: Number(submissionForm.assignmentId),
        submissionNotes: submissionForm.submissionNotes || null,
      });
      toaster.create({
        title: 'Work submitted!',
        description: 'Your submission has been recorded successfully',
        type: 'success',
        duration: 4000,
      });
      setSubmissionForm({ assignmentId: '', submissionNotes: '' });
      loadData();
    } catch (err: any) {
      toaster.create({
        title: 'Submission failed',
        description: err.response?.data?.message || 'Failed to create submission',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Everyone can submit work for assignments assigned to them
  const canSubmitWork = true;

  const getInitials = (username?: string) => {
    if (!username) return '?';
    return username.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filter assignments to only show those assigned to current user and not yet completed
  const myPendingAssignments = assignments.filter(a => 
    a.assigned_to_username === currentUser?.username && 
    a.status !== 'completed'
  );
  const assignmentOptions = myPendingAssignments.map(a => ({ label: a.title, value: String(a.id) }));

  // Memoize filtered submissions — single source of truth
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(s => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!s.assignment_title?.toLowerCase().includes(term) &&
            !s.submitted_by_username?.toLowerCase().includes(term)) return false;
      }
      if (filterStatus && s.status !== filterStatus) return false;
      return true;
    });
  }, [submissions, searchTerm, filterStatus]);

  return (
    <Box minH="100vh" bg="gray.50" key="submissions-page">
      <Navbar 
        title="Submissions" 
        subtitle="Track work" 
        user={currentUser} 
        showBack={true} 
      />

      <Container maxW="container.xl" py={8}>
        <VStack gap={6} align="stretch">
          {currentUser?.role !== 'CEO' && currentUser?.role !== 'COO' && (
            <Card.Root borderRadius="xl" boxShadow="sm">
              <Card.Header pb={2}>
                <HStack gap={3}>
                  <Box p={2} borderRadius="lg" bg="green.100" color="green.600"><FiUpload size={20} /></Box>
                  <VStack align="start" gap={0}>
                    <Heading size="md" color="gray.800">Submit Work</Heading>
                    <Text fontSize="sm" color="gray.500">Submit completed assignments for review</Text>
                  </VStack>
                </HStack>
              </Card.Header>
              <Card.Body pt={4}>
                <form onSubmit={handleCreateSubmission}>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                    <Box>
                      <Select label="Assignment" value={submissionForm.assignmentId} onChange={(value) => setSubmissionForm({ ...submissionForm, assignmentId: value })} options={assignmentOptions} placeholder="Select assignment" required />
                    </Box>
                    <Box>
                      <Text mb={2} fontWeight="medium" fontSize="sm">Submission Notes</Text>
                      <Textarea value={submissionForm.submissionNotes} onChange={(e) => setSubmissionForm({ ...submissionForm, submissionNotes: e.target.value })} placeholder="Add any notes or comments about your submission..." borderRadius="lg" rows={3} />
                    </Box>
                  </Grid>
                  <Button mt={6} type="submit" bg="gray.900" color="white" size="md" borderRadius="md" loading={submitting} _hover={{ bg: 'gray.800' }} transition="all 0.2s">
                    <HStack gap={2}>
                      <FiUpload size={16} />
                      <Text>Submit Work</Text>
                    </HStack>
                  </Button>
                </form>
              </Card.Body>
            </Card.Root>
          )}

          {/* Evaluation section moved to /evaluations page */}

          <Card.Root borderRadius="xl" boxShadow="sm">
            <Card.Header pb={4}>
              <VStack align="stretch" gap={4}>
                <HStack justify="space-between">
                  <HStack gap={3}>
                    <Box p={2} borderRadius="lg" bg="blue.100" color="blue.600"><FiFileText size={20} /></Box>
                    <VStack align="start" gap={0}>
                      <Heading size="md">Recent Submissions</Heading>
                      <Text fontSize="sm" color="gray.500">{filteredSubmissions.length} submissions</Text>
                    </VStack>
                  </HStack>
                </HStack>

                {/* Search and Filter */}
                <VStack align="stretch" gap={3} pb={3} borderBottom="1px" borderColor="gray.200">
                  <HStack gap={2}>
                    <Box flex={1}>
                      <HStack>
                        <FiSearch size={18} color="gray.400" />
                        <Input
                          placeholder="Search by title or user..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          borderRadius="lg"
                          size="sm"
                        />
                      </HStack>
                    </Box>
                    <Select
                      label=""
                      value={filterStatus}
                      onChange={(value) => setFilterStatus(value)}
                      options={[
                        { label: 'All', value: '' },
                        { label: 'Submitted', value: 'submitted' },
                        { label: 'Evaluated', value: 'evaluated' },
                        { label: 'Completed', value: 'completed' },
                      ]}
                    />
                  </HStack>
                </VStack>
              </VStack>
            </Card.Header>
            <Card.Body pt={4}>
              {loading ? (
                <ListSkeleton count={3} />
              ) : filteredSubmissions.length === 0 ? (
                <EmptyState icon={<FiFileText size={40} />} title="No submissions yet" description="Submissions will appear here once work is submitted" />
              ) : (
                <VStack gap={3} align="stretch">
                  {filteredSubmissions.map((submission) => (
                    <Box key={submission.id} p={4} borderWidth="1px" borderRadius="xl" bg="white" transition="all 0.2s" _hover={{ boxShadow: 'md', borderColor: 'gray.300' }}>
                      <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
                        <HStack gap={4} flex={1}>
                          <Avatar.Root size="md">
                            <Avatar.Fallback bg="blue.500" color="white">
                              {getInitials(submission.submitted_by_username)}
                            </Avatar.Fallback>
                          </Avatar.Root>
                          <Box>
                            <Text fontWeight="bold" fontSize="md">{submission.assignment_title}</Text>
                            <HStack gap={2} fontSize="sm" color="gray.500" mt={1}>
                              <FiUser size={14} />
                              <Text>By {submission.submitted_by_username}</Text>
                            </HStack>
                            <Text fontSize="sm" color="gray.600" mt={2}>{submission.submission_notes || 'No notes provided'}</Text>
                          </Box>
                        </HStack>
                        <VStack align="end" gap={2}>
                          <StatusBadge status={submission.status} />
                          <HStack gap={1} fontSize="sm" color="gray.500">
                            <FiClock size={14} />
                            <Text suppressHydrationWarning>{formatDate(submission.submission_date)}</Text>
                          </HStack>
                          {canDeleteSubmissionFn(submission) && (
                            <Button size="sm" colorScheme="red" variant="outline" borderRadius="lg"
                              onClick={() => setDeleteConfirm({ id: submission.id, title: submission.assignment_title })} _hover={{ bg: 'red.50' }}>
                              <HStack gap={1}>
                                <FiTrash2 size={14} />
                                <Text>Delete</Text>
                              </HStack>
                            </Button>
                          )}
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
            onConfirm={handleDelete}
            title="Delete Submission"
            message={<>Are you sure you want to delete the submission for <strong>"{deleteConfirm?.title}"</strong>?<br /><Text as="span" fontSize="sm" color="gray.500">This action cannot be undone.</Text></>}
            confirmText="Delete Submission"
            isLoading={deleting}
            variant="danger"
          />
        </VStack>
      </Container>
    </Box>
  );
}

export default function SubmissionsPage() {
  return (
    <Suspense fallback={
      <Box minH="100vh" bg="gray.50">
        <Container maxW="container.xl" py={8}>
          <ListSkeleton count={5} />
        </Container>
      </Box>
    }>
      <SubmissionsPageContent />
    </Suspense>
  );
}