'use client'

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
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
  Input,
} from '@chakra-ui/react';
import { FiStar, FiFilter, FiX } from 'react-icons/fi';
import { Navbar } from '@/components/navbar';
import { apiService } from '@/services/api';
import { toaster } from '@/components/ui/toaster';
import { StatusBadge } from '@/components/ui/badges';
import { ListSkeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/common';
import { useWebSocket, useWebSocketEvent } from '@/hooks/useWebSocket';

const ROLE_ID_MAP: Record<string, number> = {
  'CEO': 1, 'COO': 2, 'Departmental_Head': 3, 'Departmental Head': 3, 'DEPT_HEAD': 3,
  'Senior_Associate': 4, 'Senior Associate': 4, 'SENIOR': 4,
  'Associate': 5, 'ASSOCIATE': 5,
};

const RATING_OPTIONS = [
  { label: '⭐⭐⭐⭐⭐ Excellent', value: '5' },
  { label: '⭐⭐⭐⭐ Good', value: '4' },
  { label: '⭐⭐⭐ Average', value: '3' },
  { label: '⭐⭐ Needs Improvement', value: '2' },
  { label: '⭐ Poor', value: '1' },
];

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Evaluated', value: 'evaluated' },
  { label: 'Completed', value: 'completed' },
];

function EvaluationsPageContent() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  const [evaluationForm, setEvaluationForm] = useState({
    submissionId: '',
    rating: '5',
    comments: '',
  });

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    rating: '',
    searchTerm: '',
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // WebSocket connection & real-time updates
  useWebSocket();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [submissionsRes, evaluationsRes] = await Promise.all([
        apiService.getSubmissions().catch(() => ({ data: [] })),
        apiService.getEvaluations().catch(() => ({ data: [] })),
      ]);
      setSubmissions(submissionsRes.data || []);
      setEvaluations(evaluationsRes.data || []);
    } catch (err: any) {
      toaster.create({
        title: 'Error loading data',
        description: err.response?.data?.message || 'Failed to load evaluations',
        type: 'error',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useWebSocketEvent('evaluation_created', loadData);
  useWebSocketEvent('evaluation_updated', loadData);
  useWebSocketEvent('evaluation_deleted', loadData);

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

  const handleCreateEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!evaluationForm.submissionId || evaluationForm.submissionId === '') {
      toaster.create({
        title: 'Validation Error',
        description: 'Please select a submission to evaluate',
        type: 'error',
        duration: 5000,
      });
      return;
    }

    if (!evaluationForm.rating || evaluationForm.rating === '') {
      toaster.create({
        title: 'Validation Error',
        description: 'Please select a rating',
        type: 'error',
        duration: 5000,
      });
      return;
    }

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

  const canEvaluate = currentUser && (currentUser.roleId || ROLE_ID_MAP[currentUser?.role] || 99) <= 4;

  const canDeleteEvaluation = (evaluation: any) => {
    if (!currentUser) return false;
    const rid = currentUser.roleId || ROLE_ID_MAP[currentUser.role] || 99;
    return rid <= 2 || evaluation.evaluated_by_username === currentUser.username;
  };


  const submissionOptions = submissions.map(s => ({
    label: `${s.assignment_title} • ${s.submitted_by_username}`,
    value: String(s.id)
  }));

  // Filter evaluations based on filter criteria  
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(e => {
      if (filters.status && e.status !== filters.status) return false;
      if (filters.rating && e.rating !== Number(filters.rating)) return false;
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const hasMatch = 
          e.assignment_title?.toLowerCase().includes(term) ||
          e.submitted_by_username?.toLowerCase().includes(term) ||
          e.evaluated_by_username?.toLowerCase().includes(term) ||
          e.comments?.toLowerCase().includes(term);
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [evaluations, filters]);

  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar 
        title="Evaluations" 
        subtitle="Review submissions" 
        user={currentUser} 
        showBack={true} 
      />

      <Container maxW="container.xl" py={8}>
        <VStack gap={6} align="stretch">
        {canEvaluate ? (
          <Box mb={8}>
            <Card.Root borderRadius="lg" borderWidth="1px" borderColor="gray.200" bg="white" boxShadow="none">
              <Card.Header pb={2}>
                <HStack gap={3}>
                  <Box p={2} borderRadius="md" bg="purple.100" color="purple.600"><FiStar size={18} /></Box>
                  <VStack align="start" gap={0}>
                    <Heading size="md" color="gray.900" fontWeight="600">Evaluate Submission</Heading>
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
                      <Text>Submit Evaluation</Text>
                    </HStack>
                  </Button>
                </form>
              </Card.Body>
            </Card.Root>
          </Box>
          ) : (
            <Box mb={8}>
            <Card.Root borderRadius="lg" bg="gray.50" borderColor="gray.200" borderWidth="1px" boxShadow="none">
              <Card.Body>
                <HStack gap={3}>
                  <Box p={2} borderRadius="md" bg="white" color="gray.600"><FiStar size={18} /></Box>
                  <Text color="gray.700" fontSize="sm">Only managers can create evaluations.</Text>
                </HStack>
              </Card.Body>
            </Card.Root>
          </Box>
          )}

          <Card.Root borderRadius="lg" borderWidth="1px" borderColor="gray.200" bg="white" boxShadow="none">
            <Card.Header pb={4}>
              <VStack align="stretch" gap={4}>
                <HStack justify="space-between">
                  <VStack align="start" gap={0}>
                    <Heading size="md" color="gray.900" fontWeight="600">Evaluations</Heading>
                    <Text fontSize="sm" color="gray.500">{filteredEvaluations.length} evaluations</Text>
                  </VStack>
                </HStack>

                {/* Filters */}
                <VStack align="stretch" gap={3} pb={2} borderBottom="1px" borderColor="gray.200">
                  <HStack gap={2} align="flex-start">
                    <FiFilter size={18} color="gray.600" />
                    <Text fontWeight="medium" fontSize="sm" color="gray.700">Filters</Text>
                  </HStack>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
                    <Box>
                      <Input
                        placeholder="Search by name or title..."
                        value={filters.searchTerm}
                        onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                        borderRadius="lg"
                        size="sm"
                      />
                    </Box>
                    <Box>
                      <Select
                        label=""
                        value={filters.status}
                        onChange={(value) => setFilters({ ...filters, status: value })}
                        options={STATUS_OPTIONS}
                        placeholder="All statuses"
                      />
                    </Box>
                    <Box>
                      <Select
                        label=""
                        value={filters.rating}
                        onChange={(value) => setFilters({ ...filters, rating: value })}
                        options={[
                          { label: 'All ratings', value: '' },
                          { label: '⭐⭐⭐⭐⭐ Excellent', value: '5' },
                          { label: '⭐⭐⭐⭐ Good', value: '4' },
                          { label: '⭐⭐⭐ Average', value: '3' },
                          { label: '⭐⭐ Needs Improvement', value: '2' },
                          { label: '⭐ Poor', value: '1' },
                        ]}
                        placeholder="All ratings"
                      />
                    </Box>
                  </Grid>
                  {(filters.searchTerm || filters.status || filters.rating) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setFilters({ status: '', rating: '', searchTerm: '' })}
                      width="fit-content"
                    >
                      <HStack gap={1}>
                        <FiX size={14} />
                        <Text>Clear Filters</Text>
                      </HStack>
                    </Button>
                  )}
                </VStack>
              </VStack>
            </Card.Header>

            <Card.Body pt={4}>
              {loading ? (
                <ListSkeleton count={4} />
              ) : filteredEvaluations.length === 0 ? (
                <EmptyState icon={<FiStar size={40} />} title="No evaluations found" description="No evaluations match your filters" />
              ) : (
                <VStack gap={3} align="stretch">
                  {filteredEvaluations.map((evaluation) => (
                    <Box key={evaluation.id} p={4} borderWidth="1px" borderRadius="md" bg="white" transition="all 0.15s" _hover={{ borderColor: 'gray.300', boxShadow: 'sm' }} borderLeftWidth="3px" borderLeftColor={
                      evaluation.rating === 5 ? 'green.400' :
                      evaluation.rating === 4 ? 'blue.400' :
                      evaluation.rating === 3 ? 'yellow.400' :
                      evaluation.rating === 2 ? 'orange.400' :
                      'red.400'
                    }>
                      <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
                        <Box flex={1}>
                          <HStack mb={2} gap={2}>
                            <Text fontWeight="600" fontSize="md" color="gray.900">{evaluation.assignment_title}</Text>
                            <Text fontSize="xl">{evaluation.rating === 5 ? '⭐⭐⭐⭐⭐' : evaluation.rating === 4 ? '⭐⭐⭐⭐' : evaluation.rating === 3 ? '⭐⭐⭐' : evaluation.rating === 2 ? '⭐⭐' : '⭐'}</Text>
                          </HStack>
                          {evaluation.comments && (
                            <Text fontSize="sm" color="gray.600" mb={3}>{evaluation.comments}</Text>
                          )}
                          <HStack gap={4} flexWrap="wrap" fontSize="sm" color="gray.500">
                            <HStack gap={1}>
                              <Text>Submitted by: <strong>{evaluation.submitted_by_username}</strong></Text>
                            </HStack>
                            <HStack gap={1}>
                              <Text>Evaluated by: <strong>{evaluation.evaluated_by_username}</strong></Text>
                            </HStack>
                            <HStack gap={1}>
                              <Text>{new Date(evaluation.evaluation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                            </HStack>
                          </HStack>
                        </Box>
                        <VStack align="end" gap={2}>
                          <StatusBadge status={evaluation.status} />
                        </VStack>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </Card.Body>
          </Card.Root>
        </VStack>
      </Container>
    </Box>
  );
}

export default function EvaluationsPage() {
  return (
    <Suspense fallback={<Box minH="100vh" display="flex" alignItems="center" justifyContent="center"><Text>Loading...</Text></Box>}>
      <EvaluationsPageContent />
    </Suspense>
  );
}
