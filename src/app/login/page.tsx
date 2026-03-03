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
import { FiUser, FiLogIn } from 'react-icons/fi';
import { Logo } from '@/components/logo';
import { apiService } from '@/services/api';
import { toaster } from '@/components/ui/toaster';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);

    try {
      const response = await apiService.login(username.trim(), password);
      
      if (response.success) {
        toaster.create({
          title: 'Welcome back!',
          description: 'Redirecting to dashboard...',
          type: 'success',
          duration: 2000,
        });
        router.push('/dashboard');
      } else {
        toaster.create({
          title: 'Login failed',
          description: response.message || 'Invalid credentials',
          type: 'error',
          duration: 4000,
        });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred during login';
      toaster.create({
        title: 'Login failed',
        description: errorMessage,
        type: 'error',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center" p={4}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .login-card { animation: fadeIn 0.4s ease-out; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-spinner {
          display: inline-block;
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.6s linear infinite;
        }
      `}</style>

      <Container maxW="md">
        <Card.Root 
          p={{ base: 6, md: 10 }} 
          borderRadius="2xl" 
          boxShadow="xl"
          bg="white"
          className="login-card"
        >
          <VStack gap={8}>
            <VStack gap={3}>
              <Box p={2} borderRadius="lg" bg="white" boxShadow="md">
                <Logo size="lg" />
              </Box>
              <VStack gap={2}>
                <Heading size="2xl" color="gray.900" fontWeight="700">
                  Weber CRM
                </Heading>
                <Text color="gray.500" fontSize="md">
                  Sign in to your account
                </Text>
              </VStack>
            </VStack>

            <form onSubmit={handleLogin} style={{ width: '100%' }}>
              <VStack gap={5} w="full">
                <Box w="full">
                  <Text mb={2} fontWeight="medium" fontSize="sm" color="gray.700">
                    Username
                  </Text>
                  <Box position="relative">
                    <Box position="absolute" left={4} top="50%" transform="translateY(-50%)" color="gray.400" zIndex={2}>
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
                      disabled={loading}
                      _hover={{ borderColor: 'gray.400' }}
                      _focus={{ borderColor: 'gray.900', boxShadow: '0 0 0 1px var(--chakra-colors-gray-900)' }}
                      _disabled={{ opacity: 0.6, cursor: 'not-allowed' }}
                      required
                      autoComplete="username"
                    />
                  </Box>
                </Box>

                <Box w="full">
                  <Text mb={2} fontWeight="medium" fontSize="sm" color="gray.700">
                    Password
                  </Text>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    size="lg"
                    pl={4}
                    borderRadius="md"
                    borderColor="gray.300"
                    disabled={loading}
                    _hover={{ borderColor: 'gray.400' }}
                    _focus={{ borderColor: 'gray.900', boxShadow: '0 0 0 1px var(--chakra-colors-gray-900)' }}
                    _disabled={{ opacity: 0.6, cursor: 'not-allowed' }}
                    required
                    autoComplete="current-password"
                  />
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
                  disabled={loading}
                  _hover={{ bg: 'gray.800' }}
                  _active={{ bg: 'gray.900' }}
                  _disabled={{ opacity: 0.7, cursor: 'not-allowed' }}
                  transition="all 0.2s"
                >
                  <HStack gap={2}>
                    {loading ? <div className="loading-spinner" /> : <FiLogIn size={18} />}
                    <Text>{loading ? 'Signing in...' : 'Sign In'}</Text>
                  </HStack>
                </Button>
              </VStack>
            </form>

            <Text fontSize="sm" color="gray.500" textAlign="center">
              Weber CRM - Enterprise Work Management System
            </Text>
          </VStack>
        </Card.Root>
      </Container>
    </Box>
  );
}
