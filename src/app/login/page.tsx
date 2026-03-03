'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Heading,
  Input,
  Button,
  VStack,
  Text,
  HStack,
} from '@chakra-ui/react';
import { FiUser, FiLock, FiArrowRight } from 'react-icons/fi';
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
    <Box minH="100vh" display="flex" position="relative" overflow="hidden">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .login-panel { animation: fadeUp 0.5s ease-out; }
        .brand-panel { animation: fadeIn 0.6s ease-out 0.1s both; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-spinner {
          display: inline-block;
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.6s linear infinite;
        }
        .dot-pattern {
          background-image: radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}</style>

      {/* Left: Brand / Illustration Side */}
      <Box
        display={{ base: 'none', lg: 'flex' }}
        w="50%"
        bg="gray.900"
        position="relative"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        className="brand-panel"
        overflow="hidden"
      >
        {/* Decorative circles */}
        <Box position="absolute" top="-80px" right="-80px" w="300px" h="300px" borderRadius="full" bg="whiteAlpha.50" />
        <Box position="absolute" bottom="-120px" left="-60px" w="400px" h="400px" borderRadius="full" bg="whiteAlpha.50" />
        <Box position="absolute" top="40%" left="10%" w="150px" h="150px" borderRadius="full" border="1px solid" borderColor="whiteAlpha.100" />

        <VStack gap={8} position="relative" zIndex={1} px={12} textAlign="center">
          <Box 
            p={4} 
            borderRadius="2xl" 
            bg="whiteAlpha.100"
            backdropFilter="blur(12px)"
          >
            <Logo size="lg" />
          </Box>
          <VStack gap={3}>
            <Heading size="3xl" color="white" fontWeight="800" letterSpacing="-0.02em">
              Weber CRM
            </Heading>
          </VStack>
      
                
          
        </VStack>
      </Box>

      {/* Right: Login Form Side */}
      <Box
        flex={1}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.50"
        className="dot-pattern"
        p={{ base: 6, md: 12 }}
      >
        <Box w="full" maxW="420px" className="login-panel">
          {/* Mobile logo */}
          <VStack gap={2} mb={10} display={{ base: 'flex', lg: 'none' }}>
            <Box p={3} borderRadius="xl" bg="white" boxShadow="sm">
              <Logo size="md" />
            </Box>
            <Heading size="xl" color="gray.900" fontWeight="700">Weber CRM</Heading>
          </VStack>

          <VStack gap={2} align="flex-start" mb={8} display={{ base: 'none', lg: 'flex' }}>
            <Text fontSize="sm" fontWeight="600" color="gray.400" textTransform="uppercase" letterSpacing="0.08em">
              Welcome back
            </Text>
            <Heading size="2xl" color="gray.900" fontWeight="700" letterSpacing="-0.01em">
              Sign in to your account
            </Heading>
            <Text color="gray.500" fontSize="md">
              Enter your credentials to access the dashboard
            </Text>
          </VStack>

          <form onSubmit={handleLogin}>
            <VStack gap={5} w="full">
              <Box w="full">
                <Text mb={2} fontWeight="600" fontSize="sm" color="gray.700">
                  Username
                </Text>
                <Box position="relative">
                  <Box 
                    position="absolute" left={0} top={0} bottom={0} w="44px"
                    display="flex" alignItems="center" justifyContent="center"
                    color="gray.400" pointerEvents="none" zIndex={2}
                  >
                    <FiUser size={17} />
                  </Box>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    size="lg"
                    pl="44px"
                    borderRadius="lg"
                    borderColor="gray.200"
                    bg="white"
                    disabled={loading}
                    _hover={{ borderColor: 'gray.300' }}
                    _focus={{ borderColor: 'gray.900', boxShadow: '0 0 0 1px var(--chakra-colors-gray-900)' }}
                    _disabled={{ opacity: 0.6, cursor: 'not-allowed' }}
                    required
                    autoComplete="username"
                  />
                </Box>
              </Box>

              <Box w="full">
                <Text mb={2} fontWeight="600" fontSize="sm" color="gray.700">
                  Password
                </Text>
                <Box position="relative">
                  <Box 
                    position="absolute" left={0} top={0} bottom={0} w="44px"
                    display="flex" alignItems="center" justifyContent="center"
                    color="gray.400" pointerEvents="none" zIndex={2}
                  >
                    <FiLock size={17} />
                  </Box>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    size="lg"
                    pl="44px"
                    borderRadius="lg"
                    borderColor="gray.200"
                    bg="white"
                    disabled={loading}
                    _hover={{ borderColor: 'gray.300' }}
                    _focus={{ borderColor: 'gray.900', boxShadow: '0 0 0 1px var(--chakra-colors-gray-900)' }}
                    _disabled={{ opacity: 0.6, cursor: 'not-allowed' }}
                    required
                    autoComplete="current-password"
                  />
                </Box>
              </Box>

              <Button
                type="submit"
                size="lg"
                w="full"
                loading={loading}
                mt={3}
                borderRadius="lg"
                bg="gray.900"
                color="white"
                fontWeight="600"
                h="52px"
                fontSize="md"
                disabled={loading}
                _hover={{ bg: 'gray.800', transform: 'translateY(-1px)', boxShadow: 'lg' }}
                _active={{ bg: 'gray.900', transform: 'translateY(0)' }}
                _disabled={{ opacity: 0.7, cursor: 'not-allowed', transform: 'none', boxShadow: 'none' }}
                transition="all 0.2s"
              >
                <HStack gap={2}>
                  {loading ? <div className="loading-spinner" /> : <FiArrowRight size={18} />}
                  <Text>{loading ? 'Signing in...' : 'Sign In'}</Text>
                </HStack>
              </Button>
            </VStack>
          </form>

          <Text fontSize="xs" color="gray.400" textAlign="center" mt={10}>
            Weber CRM — Enterprise Work Management
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
