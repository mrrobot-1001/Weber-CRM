'use client';

import { useRouter } from 'next/navigation';
import {
  Box,
  Flex,
  HStack,
  Heading,
  Text,
  Button,
  IconButton,
  Avatar,
  Menu,
  VStack,
} from '@chakra-ui/react';
import { FiArrowLeft, FiLogOut, FiMenu, FiUser } from 'react-icons/fi';
import { Logo } from '@/components/logo';
import { apiService, User } from '@/services/api';
import { toaster } from '@/components/ui/toaster';

interface NavbarProps {
  title: string;
  subtitle?: string;
  user?: User | null;
  showBack?: boolean;
  onMenuClick?: () => void;
}

export function Navbar({ title, subtitle, user, showBack, onMenuClick }: NavbarProps) {
  const router = useRouter();

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

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <Box 
      bg="rgba(255, 255, 255, 0.8)" 
      backdropFilter="blur(16px)"
      borderBottom="1px solid"
      borderColor="rgba(0, 0, 0, 0.05)"
      px={{ base: 4, md: 6 }} 
      py={4} 
      position="sticky" 
      top={0} 
      zIndex={10} 
      boxShadow="none"
    >
      <Flex justify="space-between" align="center" maxW="container.xl" mx="auto">
        <HStack gap={4}>
          {onMenuClick && (
            <IconButton 
              aria-label="Menu" 
              onClick={onMenuClick} 
              display={{ base: 'flex', md: 'none' }}
              variant="ghost"
              size="lg"
            >
              <FiMenu />
            </IconButton>
          )}
          
          {showBack && (
            <Button variant="ghost" onClick={() => router.push('/dashboard')} borderRadius="lg" _hover={{ bg: 'gray.100' }}>
              <HStack gap={2}>
                <FiArrowLeft />
                <Text>Back</Text>
              </HStack>
            </Button>
          )}

          <HStack gap={3} align="center">
            <Box borderRadius="lg" overflow="hidden">
              <Logo size="sm" />
            </Box>
            <VStack align="start" gap={0} display={{ base: 'none', md: 'flex' }}>
              <Heading size="md" color="gray.800">{title}</Heading>
              {subtitle && <Text fontSize="xs" color="gray.500">{subtitle}</Text>}
            </VStack>
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
                  <Text>My Profile</Text>
                </HStack>
              </Menu.Item>
              <Menu.Item value="logout" onClick={handleLogout}>
                <HStack gap={2}>
                  <FiLogOut />
                  <Text>Logout</Text>
                </HStack>
              </Menu.Item>
            </Menu.Content>
          </Menu.Root>
        </HStack>
      </Flex>
    </Box>
  );
}
