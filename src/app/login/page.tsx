'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Input,
  Button,
  VStack,
  Text,
  Card,
  HStack,
} from '@chakra-ui/react';
import { FiLock, FiUser, FiLogIn } from 'react-icons/fi';
import { apiService } from '@/services/api';
import { toaster } from '@/components/ui/toaster';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiService.login(username, password);
      
      if (response.success) {
        toaster.create({
          title: 'Welcome back!',
          description: 'Login successful. Redirecting to dashboard...',
          type: 'success',
          duration: 3000,
        });
        router.push('/dashboard');
      } else {
        toaster.create({
          title: 'Login failed',
          description: response.message || 'Invalid credentials',
          type: 'error',
          duration: 5000,
        });
      }
    } catch (err: any) {
      console.error('Login error full object:', err);
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred during login';
      toaster.create({
        title: 'Login failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      minH="100vh" 
      bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      display="flex" 
      alignItems="center" 
      justifyContent="center" 
      p={4}
    >
      <Container maxW="md">
        <Card.Root 
          p={{ base: 6, md: 10 }} 
          borderRadius="2xl" 
          boxShadow="2xl"
          bg="white"
        >
          <VStack gap={8}>
            {/* Logo/Brand Section */}
            <VStack gap={3}>
              <Box
                p={4}
                borderRadius="lg"
                bg="gray.900"
                boxShadow="sm"
              >
                <FiLock size={28} color="white" />
              </Box>
              <Heading size="2xl" color="gray.900" fontWeight="700">
                Weber CRM
              </Heading>
              <Text color="gray.500" fontSize="md">
                Sign in to your account
              </Text>
            </VStack>

            {/* Login Form */}
            <form onSubmit={handleLogin} style={{ width: '100%' }}>
              <VStack gap={5} w="full">
                <Box w="full">
                  <Text mb={2} fontWeight="medium" fontSize="sm" color="gray.700">
                    Username
                  </Text>
                  <Box position="relative">
                    <Box
                      position="absolute"
                      left={4}
                      top="50%"
                      transform="translateY(-50%)"
                      color="gray.400"
                      zIndex={2}
                    >
                      <FiUser size={18} />
                    </Box>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      size="lg"
                      pl={12}
                      borderRadius="md"
                      borderColor="gray.300"
                      _hover={{ borderColor: 'gray.400' }}
                      _focus={{ 
                        borderColor: 'gray.900', 
                        boxShadow: '0 0 0 1px var(--chakra-colors-gray-900)' 
                      }}
                      required
                    />
                  </Box>
                </Box>

                <Box w="full">
                  <Text mb={2} fontWeight="medium" fontSize="sm" color="gray.700">
                    Password
                  </Text>
                  <Box position="relative">
                    <Box
                      position="absolute"
                      left={4}
                      top="50%"
                      transform="translateY(-50%)"
                      color="gray.400"
                      zIndex={2}
                    >
                      <FiLock size={18} />
                    </Box>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      size="lg"
                      pl={12}
                      borderRadius="md"
                      borderColor="gray.300"
                      _hover={{ borderColor: 'gray.400' }}
                      _focus={{ 
                        borderColor: 'gray.900', 
                        boxShadow: '0 0 0 1px var(--chakra-colors-gray-900)' 
                      }}
                      required
                    />
                  </Box>
                </Box>

                <Button
                  type="submit"
                  size="lg"
                  w="full"
                  loading={loading}
                  mt={2}
                  borderRadius="md"
                  bg="gray.900"
                  color="white"
                  fontWeight="600"
                  _hover={{
                    bg: 'gray.800',
                  }}
                  transition="all 0.15s"
                >
                  <HStack gap={2}>
                    <FiLogIn size={18} />
                    <span>Sign In</span>
                  </HStack>
                </Button>
              </VStack>
            </form>

            {/* Footer */}
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Weber CRM - Enterprise Work Management System
            </Text>
          </VStack>
        </Card.Root>
      </Container>
    </Box>
  );
}
