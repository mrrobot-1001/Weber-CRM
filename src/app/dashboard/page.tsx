'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Button,
  VStack,
  HStack,
  Text,
  Grid,
  Card,
  Flex,
  Menu,
  IconButton,
  Drawer,
  useDisclosure,
  Avatar,
} from '@chakra-ui/react';
import { FiMenu, FiLogOut, FiUsers, FiClipboard, FiCheckSquare, FiBarChart2, FiChevronRight, FiPlus, FiUser } from 'react-icons/fi';
import { apiService, User } from '@/services/api';
import { toaster } from '@/components/ui/toaster';
import { DashboardCardSkeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/common';

export default function DashboardPage() {
  const router = useRouter();
  const { open, onOpen, onClose } = useDisclosure();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAssignments: 0,
    totalSubmissions: 0,
  });
  const [loading, setLoading] = useState(true);
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
      setUser(JSON.parse(userStr));
    }

    loadDashboardData();
  }, [router, mounted]);

  const loadDashboardData = async () => {
    try {
      const [usersRes, assignmentsRes, submissionsRes] = await Promise.all([
        apiService.getUsers().catch(() => ({ data: [] })),
        apiService.getAssignments().catch(() => ({ data: [] })),
        apiService.getSubmissions().catch(() => ({ data: [] })),
      ]);

      setStats({
        totalUsers: usersRes.data?.length || 0,
        totalAssignments: assignmentsRes.data?.length || 0,
        totalSubmissions: submissionsRes.data?.length || 0,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      toaster.create({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
        type: 'success',
        duration: 3000,
      });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const isManagementRole = user?.role === 'CEO' || user?.role === 'COO' || user?.role === 'Departmental_Head';

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Top Navigation */}
      <Box 
        bg="white" 
        borderBottom="1px" 
        borderColor="gray.200" 
        px={{ base: 4, md: 6 }} 
        py={3}
        position="sticky"
        top={0}
        zIndex={10}
        boxShadow="sm"
      >
        <Flex justify="space-between" align="center" maxW="container.2xl" mx="auto">
          <HStack gap={4}>
            <IconButton 
              aria-label="Menu" 
              onClick={onOpen} 
              display={{ base: 'flex', md: 'none' }}
              variant="ghost"
              size="lg"
            >
              <FiMenu />
            </IconButton>
            <HStack gap={3}>
              <Box 
                p={2} 
                borderRadius="lg" 
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              >
                <FiBarChart2 size={20} color="white" />
              </Box>
              <Heading size="lg" bgGradient="linear(to-r, brand.600, purple.600)" bgClip="text">
                Weber CRM
              </Heading>
            </HStack>
          </HStack>
          
          <HStack gap={4}>
            <HStack 
              gap={3} 
              display={{ base: 'none', md: 'flex' }}
              cursor="pointer"
              p={2}
              borderRadius="lg"
              _hover={{ bg: 'gray.100' }}
              onClick={() => router.push('/profile')}
              transition="all 0.2s"
            >
              <Avatar.Root size="sm">
                <Avatar.Fallback bg="gray.900" color="white">
                  {getInitials(user?.firstName, user?.lastName)}
                </Avatar.Fallback>
              </Avatar.Root>
              <VStack gap={0} align="end">
                <Text fontWeight="semibold" fontSize="sm" color="gray.800">{user?.firstName} {user?.lastName}</Text>
                <Text fontSize="xs" color="gray.500">{user?.role}</Text>
              </VStack>
            </HStack>
            <Menu.Root>
              <Menu.Trigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  borderRadius="lg"
                  _hover={{ bg: 'gray.100' }}
                >
                  <FiLogOut />
                </Button>
              </Menu.Trigger>
              <Menu.Content>
                <Menu.Item value="profile" onClick={() => router.push('/profile')}>
                  <HStack gap={2}>
                    <FiUser />
                    <span>My Profile</span>
                  </HStack>
                </Menu.Item>
                <Menu.Item value="logout" onClick={handleLogout}>
                  <HStack gap={2}>
                    <FiLogOut />
                    <span>Logout</span>
                  </HStack>
                </Menu.Item>
              </Menu.Content>
            </Menu.Root>
          </HStack>
        </Flex>
      </Box>

      {/* Mobile Sidebar Drawer */}
      <Drawer.Root open={open} onOpenChange={({ open }) => open ? onOpen() : onClose()} placement="start">
        <Drawer.Backdrop />
        <Drawer.Content>
          <Drawer.Header borderBottom="1px" borderColor="gray.200">
            <Drawer.Title fontWeight="bold">Menu</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body py={4}>
            <VStack gap={1} align="stretch">
              <Button 
                variant="solid" 
                justifyContent="flex-start" 
                borderRadius="md"
                bg="gray.900"
                color="white"
                py={6}
                _hover={{ bg: 'gray.800' }}
              >
                <FiBarChart2 style={{ marginRight: '12px' }} />
                Dashboard
              </Button>
              {isManagementRole && (
                <>
                  <Button 
                    variant="ghost" 
                    justifyContent="flex-start" 
                    onClick={() => router.push('/users')}
                    borderRadius="lg"
                    py={6}
                    _hover={{ bg: 'gray.100' }}
                  >
                    <FiUsers style={{ marginRight: '12px' }} />
                    Users
                    <Box ml="auto"><FiChevronRight /></Box>
                  </Button>
                  <Button 
                    variant="ghost" 
                    justifyContent="flex-start" 
                    onClick={() => router.push('/assignments')}
                    borderRadius="lg"
                    py={6}
                    _hover={{ bg: 'gray.100' }}
                  >
                    <FiClipboard style={{ marginRight: '12px' }} />
                    Assignments
                    <Box ml="auto"><FiChevronRight /></Box>
                  </Button>
                </>
              )}
              <Button 
                variant="ghost" 
                justifyContent="flex-start" 
                onClick={() => router.push('/submissions')}
                borderRadius="lg"
                py={6}
                _hover={{ bg: 'gray.100' }}
              >
                <FiCheckSquare style={{ marginRight: '12px' }} />
                Submissions
                <Box ml="auto"><FiChevronRight /></Box>
              </Button>
              <Box borderTop="1px" borderColor="gray.200" my={2} />
              <Button 
                variant="ghost" 
                justifyContent="flex-start" 
                onClick={() => router.push('/profile')}
                borderRadius="lg"
                py={6}
                _hover={{ bg: 'gray.100' }}
              >
                <FiUser style={{ marginRight: '12px' }} />
                My Profile
                <Box ml="auto"><FiChevronRight /></Box>
              </Button>
            </VStack>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>

      <Flex>
        {/* Desktop Sidebar */}
        <Box
          display={{ base: 'none', md: 'block' }}
          w="260px"
          bg="white"
          borderRight="1px"
          borderColor="gray.200"
          minH="calc(100vh - 60px)"
          p={4}
        >
          <VStack gap={1} align="stretch">
            <Button 
              variant="solid" 
              justifyContent="flex-start" 
              borderRadius="md"
              bg="gray.900"
              color="white"
              py={6}
              fontWeight="600"
            >
              <FiBarChart2 style={{ marginRight: '12px' }} />
              Dashboard
            </Button>
            {isManagementRole && (
              <>
                <Button 
                  variant="ghost" 
                  justifyContent="flex-start" 
                  onClick={() => router.push('/users')}
                  borderRadius="lg"
                  py={6}
                  _hover={{ bg: 'gray.100' }}
                >
                  <FiUsers style={{ marginRight: '12px' }} />
                  Users
                </Button>
                <Button 
                  variant="ghost" 
                  justifyContent="flex-start" 
                  onClick={() => router.push('/assignments')}
                  borderRadius="lg"
                  py={6}
                  _hover={{ bg: 'gray.100' }}
                >
                  <FiClipboard style={{ marginRight: '12px' }} />
                  Assignments
                </Button>
              </>
            )}
            <Button 
              variant="ghost" 
              justifyContent="flex-start" 
              onClick={() => router.push('/submissions')}
              borderRadius="lg"
              py={6}
              _hover={{ bg: 'gray.100' }}
            >
              <FiCheckSquare style={{ marginRight: '12px' }} />
              Submissions
            </Button>
            <Box borderTop="1px" borderColor="gray.200" my={2} />
            <Button 
              variant="ghost" 
              justifyContent="flex-start" 
              onClick={() => router.push('/profile')}
              borderRadius="lg"
              py={6}
              _hover={{ bg: 'gray.100' }}
            >
              <FiUser style={{ marginRight: '12px' }} />
              My Profile
            </Button>
          </VStack>
        </Box>

        {/* Main Content */}
        <Box flex="1" p={{ base: 4, md: 8 }}>
          <Container maxW="container.xl">
            <VStack gap={8} align="stretch">
              {/* Welcome Header */}
              <Box>
                <Text fontSize="sm" color="gray.500" mb={1}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
                <Heading size="xl" mb={2} color="gray.800">Welcome back, {user?.firstName}! 👋</Heading>
                <Text color="gray.600">Here's an overview of your workspace</Text>
              </Box>

              {/* Stats Grid */}
              {loading ? (
                <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
                  <DashboardCardSkeleton />
                  <DashboardCardSkeleton />
                  <DashboardCardSkeleton />
                </Grid>
              ) : (
                <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
                  <StatCard
                    label="Total Users"
                    value={stats.totalUsers}
                    icon={<FiUsers size={24} />}
                    color="gray.700"
                  />
                  <StatCard
                    label="Assignments"
                    value={stats.totalAssignments}
                    icon={<FiClipboard size={24} />}
                    color="gray.700"
                  />
                  <StatCard
                    label="Submissions"
                    value={stats.totalSubmissions}
                    icon={<FiCheckSquare size={24} />}
                    color="gray.700"
                  />
                </Grid>
              )}

              {/* Quick Actions */}
              <Card.Root borderRadius="lg" borderWidth="1px" borderColor="gray.200" bg="white" boxShadow="none">
                <Card.Header pb={2}>
                  <Heading size="md" color="gray.900" fontWeight="600">Quick Actions</Heading>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Jump to common tasks
                  </Text>
                </Card.Header>
                <Card.Body pt={2}>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                    {isManagementRole && (
                      <>
                        <Button 
                          size="lg" 
                          onClick={() => router.push('/users')}
                          borderRadius="md"
                          bg="gray.50"
                          color="gray.900"
                          borderWidth="1px"
                          borderColor="gray.200"
                          _hover={{ bg: 'gray.100', borderColor: 'gray.300' }}
                          transition="all 0.15s"
                          py={8}
                        >
                          <VStack gap={2}>
                            <FiUsers size={22} />
                            <Text fontWeight="600" fontSize="sm">Manage Users</Text>
                          </VStack>
                        </Button>
                        <Button 
                          size="lg" 
                          onClick={() => router.push('/assignments')}
                          borderRadius="md"
                          bg="gray.900"
                          color="white"
                          _hover={{ bg: 'gray.800' }}
                          transition="all 0.15s"
                          py={8}
                        >
                          <VStack gap={2}>
                            <HStack gap={1}>
                              <FiClipboard size={20} />
                              <FiPlus size={14} />
                            </HStack>
                            <Text fontWeight="600" fontSize="sm">Create Assignment</Text>
                          </VStack>
                        </Button>
                      </>
                    )}
                    <Button 
                      size="lg" 
                      onClick={() => router.push('/submissions')}
                      borderRadius="md"
                      bg="gray.50"
                      color="gray.900"
                      borderWidth="1px"
                      borderColor="gray.200"
                      _hover={{ bg: 'gray.100', borderColor: 'gray.300' }}
                      transition="all 0.15s"
                      py={8}
                    >
                      <VStack gap={2}>
                        <FiCheckSquare size={22} />
                        <Text fontWeight="600" fontSize="sm">{isManagementRole ? 'View Submissions' : 'Submit Work'}</Text>
                      </VStack>
                    </Button>
                  </Grid>
                </Card.Body>
              </Card.Root>
            </VStack>
          </Container>
        </Box>
      </Flex>
    </Box>
  );
}
