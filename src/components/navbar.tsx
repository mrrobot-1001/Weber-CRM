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
  VStack,
} from '@chakra-ui/react';
import { FiArrowLeft, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { Logo } from '@/components/logo';
import { apiService, User } from '@/services/api';
import { toaster } from '@/components/ui/toaster';
import { NotificationBell } from '@/components/ui/notification-bell';

interface NavbarProps {
  title: string;
  subtitle?: string;
  user?: User | null;
  showBack?: boolean;
  onMenuClick?: () => void;
  isMenuOpen?: boolean;
}

export function Navbar({ title, subtitle, user, showBack, onMenuClick, isMenuOpen }: NavbarProps) {
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
      bg="rgba(255, 255, 255, 0.85)" 
      backdropFilter="blur(20px)"
      borderBottom="1px solid"
      borderColor="gray.100"
      px={{ base: 3, md: 6 }} 
      py={{ base: 2, md: 3 }} 
      position="sticky" 
      top={0} 
      zIndex={10}
    >
      <Flex justify="space-between" align="center" maxW="container.xl" mx="auto">
        <HStack gap={3}>
          {onMenuClick && (
            <IconButton 
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={onMenuClick} 
              display={{ base: 'flex', md: 'none' }}
              variant="ghost"
              size="sm"
              borderRadius="lg"
              _hover={{ bg: 'gray.100' }}
            >
              {isMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </IconButton>
          )}
          
          {showBack && (
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard')} 
              borderRadius="lg" 
              size="sm"
              _hover={{ bg: 'gray.100' }}
            >
              <HStack gap={1.5}>
                <FiArrowLeft size={16} />
                <Text fontSize="sm">Back</Text>
              </HStack>
            </Button>
          )}

          <HStack gap={3} align="center">
            <Box borderRadius="xl" overflow="hidden" flexShrink={0}>
              <Logo size="sm" />
            </Box>
            <Box display={{ base: 'none', md: 'block' }}>
              <Heading size="sm" color="gray.900" fontWeight="600" lineHeight="1.2">{title}</Heading>
              {subtitle && <Text fontSize="xs" color="gray.500" mt={0.5}>{subtitle}</Text>}
            </Box>
          </HStack>
        </HStack>

        <HStack gap={3}>
          <NotificationBell />

          <HStack gap={2.5} py={1.5} px={2}>
            <Avatar.Root size="sm">
              <Avatar.Fallback 
                bg="gray.900" 
                color="white" 
                fontSize="xs" 
                fontWeight="600"
              >
                {getInitials(user?.firstName, user?.lastName)}
              </Avatar.Fallback>
            </Avatar.Root>
            <VStack gap={0} align="start" display={{ base: 'none', md: 'flex' }}>
              <Text fontWeight="600" fontSize="sm" color="gray.800" lineHeight="1.2">
                {user?.firstName} {user?.lastName}
              </Text>
              <Text fontSize="xs" color="gray.500" lineHeight="1.2">{user?.role?.replace(/_/g, ' ')}</Text>
            </VStack>
          </HStack>

          <Box w="1px" h="24px" bg="gray.200" display={{ base: 'none', md: 'block' }} />

          <IconButton
            aria-label="Logout"
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            borderRadius="lg"
            color="gray.500"
            _hover={{ bg: 'red.50', color: 'red.600' }}
            transition="all 0.15s"
          >
            <FiLogOut size={17} />
          </IconButton>
        </HStack>
      </Flex>
    </Box>
  );
}
