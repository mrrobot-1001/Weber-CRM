'use client'

import { useEffect, useState, useCallback, useMemo } from 'react';
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
  Drawer,
  useDisclosure,
} from '@chakra-ui/react';
import { FiUsers, FiClipboard, FiCheckSquare, FiBarChart2, FiPlus, FiUser, FiStar } from 'react-icons/fi';
import { Navbar } from '@/components/navbar';
import { apiService, User } from '@/services/api';
import { DashboardCardSkeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/common';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  managementOnly?: boolean;
}

function SidebarNav({ items, router, onNavigate }: { items: NavItem[]; router: any; onNavigate?: () => void }) {
  return (
    <VStack gap={1} align="stretch">
      {items.map((item) => (
        <Button
          key={item.href}
          variant={item.active ? 'solid' : 'ghost'}
          justifyContent="flex-start"
          borderRadius="lg"
          bg={item.active ? 'gray.900' : undefined}
          color={item.active ? 'white' : undefined}
          py={5}
          px={3}
          fontSize="sm"
          fontWeight={item.active ? '600' : '500'}
          _hover={item.active ? { bg: 'gray.800' } : { bg: 'gray.50' }}
          transition="all 0.15s"
          onClick={() => {
            if (!item.active) {
              router.push(item.href);
              onNavigate?.();
            }
          }}
        >
          <Box mr={2.5} opacity={item.active ? 1 : 0.7}>{item.icon}</Box>
          {item.label}
        </Button>
      ))}
    </VStack>
  );
}

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

  const currentDate = useMemo(() => 
    new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), 
  []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadDashboardData = useCallback(async () => {
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
    } catch {
      // Silently fail - stats will show 0
    } finally {
      setLoading(false);
    }
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
  }, [router, mounted, loadDashboardData]);

  const isManagementRole = user?.role === 'CEO' || user?.role === 'COO' || user?.role === 'Departmental_Head';

  const navItems: NavItem[] = useMemo(() => [
    { label: 'Dashboard', icon: <FiBarChart2 size={18} />, href: '/dashboard', active: true },
    ...(isManagementRole ? [
      { label: 'Users', icon: <FiUsers size={18} />, href: '/users' },
      { label: 'Assignments', icon: <FiClipboard size={18} />, href: '/assignments' },
    ] : []),
    { label: 'Submissions', icon: <FiCheckSquare size={18} />, href: '/submissions' },
    { label: 'Evaluations', icon: <FiStar size={18} />, href: '/evaluations' },
    { label: 'My Profile', icon: <FiUser size={18} />, href: '/profile' },
  ], [isManagementRole]);

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Top Navigation */}
      <Navbar 
        title="Weber CRM" 
        subtitle="Dashboard" 
        user={user} 
        onMenuClick={onOpen} 
      />

      {/* Mobile Sidebar Drawer */}
      <Drawer.Root open={open} onOpenChange={({ open }) => open ? onOpen() : onClose()} placement="start">
        <Drawer.Backdrop />
        <Drawer.Content>
          <Drawer.Header borderBottom="1px" borderColor="gray.100">
            <Drawer.Title fontWeight="600" fontSize="md">Navigation</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body py={3}>
            <SidebarNav items={navItems} router={router} onNavigate={onClose} />
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>

      <Flex>
        {/* Desktop Sidebar */}
        <Box
          display={{ base: 'none', md: 'block' }}
          w="240px"
          bg="white"
          borderRight="1px"
          borderColor="gray.100"
          minH="calc(100vh - 56px)"
          py={4}
          px={3}
        >
          <SidebarNav items={navItems} router={router} />
        </Box>

        {/* Main Content */}
        <Box flex="1" p={{ base: 4, md: 8 }} className="page-enter">
          <Container maxW="container.xl">
            <VStack gap={8} align="stretch">
              {/* Welcome Header */}
              <Box>
                <Text fontSize="xs" color="gray.400" mb={1} fontWeight="500" textTransform="uppercase" letterSpacing="0.05em">
                  {currentDate}
                </Text>
                <Heading size="xl" mb={1} color="gray.900" fontWeight="700" letterSpacing="-0.01em">
                  Welcome back, {user?.firstName} 👋
                </Heading>
                <Text color="gray.500" fontSize="sm">Here's an overview of your workspace</Text>
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
              <Card.Root borderRadius="xl" borderWidth="1px" borderColor="gray.100" bg="white" boxShadow="none">
                <Card.Header pb={2}>
                  <Heading size="md" color="gray.900" fontWeight="600">Quick Actions</Heading>
                  <Text fontSize="sm" color="gray.500" mt={0.5}>
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
                          borderRadius="xl"
                          bg="gray.50"
                          color="gray.900"
                          borderWidth="1px"
                          borderColor="gray.100"
                          _hover={{ bg: 'gray.100', borderColor: 'gray.200' }}
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
                          borderRadius="xl"
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
                      borderRadius="xl"
                      bg="gray.50"
                      color="gray.900"
                      borderWidth="1px"
                      borderColor="gray.100"
                      _hover={{ bg: 'gray.100', borderColor: 'gray.200' }}
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
