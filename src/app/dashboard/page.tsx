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
} from '@chakra-ui/react';
import { useState as useMenuState } from 'react';
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
    <VStack gap={0.5} align="stretch">
      {items.map((item) => (
        <Button
          key={item.href}
          variant={item.active ? 'solid' : 'ghost'}
          justifyContent="flex-start"
          borderRadius="md"
          bg={item.active ? 'gray.900' : undefined}
          color={item.active ? 'white' : undefined}
          py={{ base: 2.5, md: 5 }}
          px={3}
          fontSize={{ base: 'xs', md: 'sm' }}
          fontWeight={item.active ? '600' : '500'}
          h="auto"
          minH={0}
          _hover={item.active ? { bg: 'gray.800' } : { bg: 'gray.50' }}
          transition="all 0.15s"
          onClick={() => {
            if (!item.active) {
              router.push(item.href);
              onNavigate?.();
            }
          }}
        >
          <Box mr={2} opacity={item.active ? 1 : 0.7}>{item.icon}</Box>
          {item.label}
        </Button>
      ))}
    </VStack>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
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
        onMenuClick={() => setMenuOpen(!menuOpen)}
        isMenuOpen={menuOpen}
      />

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <Box
            position="fixed"
            inset={0}
            zIndex={40}
            bg="blackAlpha.300"
            onClick={() => setMenuOpen(false)}
            style={{
              animation: 'mobileBackdropIn 0.15s ease-out forwards',
            }}
          />
          {/* Dropdown Panel */}
          <Box
            position="fixed"
            top="44px"
            left={0}
            right={0}
            zIndex={45}
            bg="white"
            boxShadow="0 8px 30px rgba(0,0,0,0.12)"
            borderBottomRadius="xl"
            style={{
              transformOrigin: 'top center',
              animation: 'mobileDropdownIn 0.22s cubic-bezier(0.2, 0.9, 0.3, 1) forwards',
            }}
          >
            <Box px={3} py={2}>
              <SidebarNav items={navItems} router={router} onNavigate={() => setMenuOpen(false)} />
            </Box>
          </Box>
        </>
      )}

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
        <Box flex="1" p={{ base: 3, md: 8 }} className="page-enter">
          <Container maxW="container.xl">
            <VStack gap={{ base: 4, md: 8 }} align="stretch">
              {/* Welcome Header */}
              <Box>
                <Text fontSize="xs" color="gray.400" mb={0.5} fontWeight="500" textTransform="uppercase" letterSpacing="0.05em">
                  {currentDate}
                </Text>
                <Heading size={{ base: 'lg', md: 'xl' }} mb={0.5} color="gray.900" fontWeight="700" letterSpacing="-0.01em">
                  Welcome back, {user?.firstName} 👋
                </Heading>
                <Text color="gray.500" fontSize={{ base: 'xs', md: 'sm' }}>Here's an overview of your workspace</Text>
              </Box>

              {/* Stats Grid */}
              {loading ? (
                <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={{ base: 3, md: 6 }}>
                  <DashboardCardSkeleton />
                  <DashboardCardSkeleton />
                  <DashboardCardSkeleton />
                </Grid>
              ) : (
                <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={{ base: 3, md: 6 }}>
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
                <Card.Header pb={1}>
                  <Heading size={{ base: 'sm', md: 'md' }} color="gray.900" fontWeight="600">Quick Actions</Heading>
                  <Text fontSize="xs" color="gray.500" mt={0.5}>
                    Jump to common tasks
                  </Text>
                </Card.Header>
                <Card.Body pt={2}>
                  <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={{ base: 2, md: 4 }}>
                    {isManagementRole && (
                      <>
                        <Button 
                          size={{ base: 'md', md: 'lg' }} 
                          onClick={() => router.push('/users')}
                          borderRadius="xl"
                          bg="gray.50"
                          color="gray.900"
                          borderWidth="1px"
                          borderColor="gray.100"
                          _hover={{ bg: 'gray.100', borderColor: 'gray.200' }}
                          transition="all 0.15s"
                          py={{ base: 5, md: 8 }}
                          h="auto"
                        >
                          <VStack gap={1.5}>
                            <FiUsers size={18} />
                            <Text fontWeight="600" fontSize="xs">Manage Users</Text>
                          </VStack>
                        </Button>
                        <Button 
                          size={{ base: 'md', md: 'lg' }} 
                          onClick={() => router.push('/assignments')}
                          borderRadius="xl"
                          bg="gray.900"
                          color="white"
                          _hover={{ bg: 'gray.800' }}
                          transition="all 0.15s"
                          py={{ base: 5, md: 8 }}
                          h="auto"
                        >
                          <VStack gap={1.5}>
                            <HStack gap={1}>
                              <FiClipboard size={18} />
                              <FiPlus size={12} />
                            </HStack>
                            <Text fontWeight="600" fontSize="xs">Create Assignment</Text>
                          </VStack>
                        </Button>
                      </>
                    )}
                    <Button 
                      size={{ base: 'md', md: 'lg' }} 
                      onClick={() => router.push('/submissions')}
                      borderRadius="xl"
                      bg="gray.50"
                      color="gray.900"
                      borderWidth="1px"
                      borderColor="gray.100"
                      _hover={{ bg: 'gray.100', borderColor: 'gray.200' }}
                      transition="all 0.15s"
                      py={{ base: 5, md: 8 }}
                      h="auto"
                    >
                      <VStack gap={1.5}>
                        <FiCheckSquare size={18} />
                        <Text fontWeight="600" fontSize="xs">{isManagementRole ? 'View Submissions' : 'Submit Work'}</Text>
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
