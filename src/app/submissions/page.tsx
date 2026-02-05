'use client'

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Textarea,
  Card,
  Grid,
  Flex,
  Avatar,
} from '@chakra-ui/react';
import { FiArrowLeft, FiUpload, FiStar, FiFileText, FiCheckCircle, FiTrash2, FiClock, FiUser } from 'react-icons/fi';
import { apiService } from '@/services/api';
import { toaster } from '@/components/ui/toaster';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { StatusBadge } from '@/components/ui/badges';
import { ListSkeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/common';

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

const RATING_OPTIONS = [
  { label: '⭐⭐⭐⭐⭐ Excellent', value: '5' },
  { label: '⭐⭐⭐⭐ Good', value: '4' },
  { label: '⭐⭐⭐ Average', value: '3' },
  { label: '⭐⭐ Needs Improvement', value: '2' },
  { label: '⭐ Poor', value: '1' },
];

export default function SubmissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const [submissionForm, setSubmissionForm] = useState({
    assignmentId: '',
    submissionNotes: '',
  });

  const [evaluationForm, setEvaluationForm] = useState({
    submissionId: '',
    rating: '5',
    comments: '',
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
    loadData();
  }, [router, mounted]);

  const canDeleteSubmissionFn = (submission: any) => {
    if (!currentUser) return false;
    const currentRoleId = currentUser.roleId || ROLE_NAME_TO_ID[currentUser.role] || 99;
    if (currentRoleId <= 2) return true;
    if (submission.submitted_by_username === currentUser.username) return true;
    return false;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, submissionsRes, evaluationsRes] = await Promise.all([
        apiService.getAssignments().catch(() => ({ data: [] })),
        apiService.getSubmissions().catch(() => ({ data: [] })),
        apiService.getEvaluations().catch(() => ({ data: [] })),
      ]);
      setAssignments(assignmentsRes.data || []);
      setSubmissions(submissionsRes.data || []);
      setEvaluations(evaluationsRes.data || []);
      
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
    setSubmitting(true);
    try {
      await apiService.createSubmission({
        assignmentId: Number(submissionForm.assignmentId),
        submissionNotes: submissionForm.submissionNotes,
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

  const handleCreateEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluating(true);
    try {
      await apiService.createEvaluation({
        submissionId: Number(evaluationForm.submissionId),
        rating: Number(evaluationForm.rating),
        comments: evaluationForm.comments,
      });
      toaster.create({
        title: 'Evaluation submitted!',
        description: 'Your evaluation has been recorded successfully',
        type: 'success',
        duration: 4000,
      });
      setEvaluationForm({ submissionId: '', rating: '5', comments: '' });
      loadData();
    } catch (err: any) {
      toaster.create({
        title: 'Evaluation failed',
        description: err.response?.data?.message || 'Failed to submit evaluation',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setEvaluating(false);
    }
  };

  // Everyone can submit work for assignments assigned to them
  const canSubmitWork = true;
  const canEvaluate = ['CEO', 'COO', 'Departmental_Head', 'Senior_Associate', 'Departmental Head', 'Senior Associate', 'DEPT_HEAD', 'SENIOR'].includes(currentUser?.role || '') || [1, 2, 3, 4].includes(currentUser?.roleId);

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
  const submissionOptions = submissions.map(s => ({ label: `${s.assignment_title} • ${s.submitted_by_username}`, value: String(s.id) }));

  const getRatingStars = (rating: number) => {
    return '⭐'.repeat(rating);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'green';
    if (rating >= 3) return 'yellow';
    return 'red';
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
              <Heading size="lg" color="gray.800">Submissions & Evaluations</Heading>
              <Text fontSize="sm" color="gray.500">Submit work and review performance</Text>
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
          {canSubmitWork && (
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
                      <span>Submit Work</span>
                    </HStack>
                  </Button>
                </form>
              </Card.Body>
            </Card.Root>
          )}

          {canEvaluate && (
            <Card.Root borderRadius="xl" boxShadow="sm">
              <Card.Header pb={2}>
                <HStack gap={3}>
                  <Box p={2} borderRadius="lg" bg="purple.100" color="purple.600"><FiStar size={20} /></Box>
                  <VStack align="start" gap={0}>
                    <Heading size="md" color="gray.800">Evaluate Submission</Heading>
                    <Text fontSize="sm" color="gray.500">Review and rate team member submissions</Text>
                  </VStack>
                </HStack>
              </Card.Header>
              <Card.Body pt={4}>
                <form onSubmit={handleCreateEvaluation}>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                    <Box>
                      <Select label="Submission" value={evaluationForm.submissionId} onChange={(value) => setEvaluationForm({ ...evaluationForm, submissionId: value })} options={submissionOptions} placeholder="Select submission to evaluate" required />
                    </Box>
                    <Box>
                      <Select label="Rating" value={evaluationForm.rating} onChange={(value) => setEvaluationForm({ ...evaluationForm, rating: value })} options={RATING_OPTIONS} />
                    </Box>
                    <Box gridColumn={{ base: 'auto', md: '1 / -1' }}>
                      <Text mb={2} fontWeight="medium" fontSize="sm">Comments</Text>
                      <Textarea value={evaluationForm.comments} onChange={(e) => setEvaluationForm({ ...evaluationForm, comments: e.target.value })} placeholder="Provide feedback on this submission..." borderRadius="lg" rows={3} />
                    </Box>
                  </Grid>
                  <Button mt={6} type="submit" bg="gray.900" color="white" size="md" borderRadius="md" loading={evaluating} _hover={{ bg: 'gray.800' }} transition="all 0.2s">
                    <HStack gap={2}>
                      <FiStar size={16} />
                      <span>Submit Evaluation</span>
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
                  <Box p={2} borderRadius="lg" bg="blue.100" color="blue.600"><FiFileText size={20} /></Box>
                  <VStack align="start" gap={0}>
                    <Heading size="md">Recent Submissions</Heading>
                    <Text fontSize="sm" color="gray.500">{submissions.length} total submissions</Text>
                  </VStack>
                </HStack>
              </HStack>
            </Card.Header>
            <Card.Body pt={4}>
              {loading ? (
                <ListSkeleton count={3} />
              ) : submissions.length === 0 ? (
                <EmptyState icon={<FiFileText size={40} />} title="No submissions yet" description="Submissions will appear here once work is submitted" />
              ) : (
                <VStack gap={3} align="stretch">
                  {submissions.map((submission) => (
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
                            <Text>{formatDate(submission.submission_date)}</Text>
                          </HStack>
                          {canDeleteSubmissionFn(submission) && (
                            <Button size="sm" colorScheme="red" variant="outline" borderRadius="lg"
                              onClick={() => setDeleteConfirm({ id: submission.id, title: submission.assignment_title })} _hover={{ bg: 'red.50' }}>
                              <HStack gap={1}>
                                <FiTrash2 size={14} />
                                <span>Delete</span>
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

          <Card.Root borderRadius="xl" boxShadow="sm">
            <Card.Header pb={2}>
              <HStack justify="space-between">
                <HStack gap={3}>
                  <Box p={2} borderRadius="lg" bg="yellow.100" color="yellow.600"><FiCheckCircle size={20} /></Box>
                  <VStack align="start" gap={0}>
                    <Heading size="md">Evaluations</Heading>
                    <Text fontSize="sm" color="gray.500">{evaluations.length} total evaluations</Text>
                  </VStack>
                </HStack>
              </HStack>
            </Card.Header>
            <Card.Body pt={4}>
              {loading ? (
                <ListSkeleton count={3} />
              ) : evaluations.length === 0 ? (
                <EmptyState icon={<FiStar size={40} />} title="No evaluations yet" description="Evaluations will appear here once submissions are reviewed" />
              ) : (
                <VStack gap={3} align="stretch">
                  {evaluations.map((evaluation) => (
                    <Box key={evaluation.id} p={4} borderWidth="1px" borderRadius="xl" bg="white" transition="all 0.2s" _hover={{ boxShadow: 'md', borderColor: 'gray.300' }}>
                      <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
                        <Box flex={1}>
                          <HStack mb={2}>
                            <Text fontWeight="bold" fontSize="md">{evaluation.assignment_title}</Text>
                            <Box px={2} py={1} borderRadius="full" bg={`${getRatingColor(evaluation.rating)}.100`} color={`${getRatingColor(evaluation.rating)}.700`} fontSize="sm" fontWeight="semibold">
                              {getRatingStars(evaluation.rating)} {evaluation.rating}/5
                            </Box>
                          </HStack>
                          <HStack gap={2} fontSize="sm" color="gray.500" mb={2}>
                            <FiUser size={14} />
                            <Text>Evaluated by {evaluation.evaluated_by_username}</Text>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">{evaluation.comments || 'No comments provided'}</Text>
                        </Box>
                        <VStack align="end" gap={1}>
                          <HStack gap={1} fontSize="sm" color="gray.500">
                            <FiClock size={14} />
                            <Text>{formatDate(evaluation.evaluation_date)}</Text>
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
