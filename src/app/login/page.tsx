'use client'

import { useState, useEffect } from 'react';
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

// Particle Background Component
function ParticleBackground() {
  useEffect(() => {
    const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;
    }> = [];

    // Create subtle particles
    for (let i = 0; i < 25; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.15 + 0.05,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 116, 139, ${particle.opacity})`;
        ctx.fill();

        // Draw subtle lines between nearby particles
        for (let j = index + 1; j < particles.length; j++) {
          const dx = particles[j].x - particle.x;
          const dy = particles[j].y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(100, 116, 139, ${(1 - distance / 120) * 0.03})`;
            ctx.lineWidth = 0.3;
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      id="particle-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
      }}
    />
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setIsVisible(true);
  }, []);

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
    <Box minH="100vh" position="relative" overflow="hidden" bg="gray.50">
      {/* Subtle Particle Background */}
      <ParticleBackground />

      {/* Content */}
      <Box
        position="relative"
        zIndex={10}
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH="100vh"
        p={4}
      >
        <style>{`
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes shimmer {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }

          .login-card {
            animation: fadeInScale 0.6s ease-out;
          }

          .login-heading {
            animation: slideInUp 0.7s ease-out 0.2s both;
          }

          .login-form {
            animation: slideInUp 0.7s ease-out 0.4s both;
          }

          .login-button {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .login-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
          }

          .login-button:active:not(:disabled) {
            transform: translateY(0);
          }

          .login-input {
            transition: all 0.3s ease;
          }

          .login-input:focus {
            transform: translateY(-1px);
          }

          .brand-icon {
            animation: fadeInScale 0.8s ease-out;
          }

          .form-group {
            animation: slideInUp 0.7s ease-out;
            animation-fill-mode: both;
          }

          .form-group:nth-child(1) { animation-delay: 0.5s; }
          .form-group:nth-child(2) { animation-delay: 0.6s; }
          .form-group:nth-child(3) { animation-delay: 0.7s; }

          .loading-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .footer-text {
            animation: slideInUp 0.7s ease-out 0.8s both;
          }
        `}</style>

        <Container maxW="md">
          <Card.Root 
            p={{ base: 6, md: 10 }} 
            borderRadius="2xl" 
            boxShadow="2xl"
            bg="white"
            className="login-card"
          >
            <VStack gap={8}>
              {/* Logo/Brand Section */}
              <VStack gap={3}>
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="white"
                  boxShadow="md"
                  className="brand-icon"
                >
                  <Logo size="lg" />
                </Box>
                <VStack gap={2} className="login-heading">
                  <Heading size="2xl" color="gray.900" fontWeight="700">
                    Weber CRM
                  </Heading>
                  <Text color="gray.500" fontSize="md">
                    Sign in to your account
                  </Text>
                </VStack>
              </VStack>

              {/* Login Form */}
              <form onSubmit={handleLogin} style={{ width: '100%' }} className="login-form">
                <VStack gap={5} w="full">
                  <Box w="full" className="form-group">
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
                        transition="color 0.3s ease"
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
                        disabled={loading}
                        className="login-input"
                        _hover={{ borderColor: 'gray.400' }}
                        _focus={{ 
                          borderColor: 'gray.900', 
                          boxShadow: '0 0 0 1px var(--chakra-colors-gray-900)' 
                        }}
                        _disabled={{ opacity: 0.6, cursor: 'not-allowed' }}
                        required
                      />
                    </Box>
                  </Box>

                  <Box w="full" className="form-group">
                    <Text mb={2} fontWeight="medium" fontSize="sm" color="gray.700">
                      Password
                    </Text>
                    <Box position="relative">
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
                        className="login-input"
                        _hover={{ borderColor: 'gray.400' }}
                        _focus={{ 
                          borderColor: 'gray.900', 
                          boxShadow: '0 0 0 1px var(--chakra-colors-gray-900)' 
                        }}
                        _disabled={{ opacity: 0.6, cursor: 'not-allowed' }}
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
                    className="login-button form-group"
                    disabled={loading}
                    _hover={{
                      bg: 'gray.800',
                    }}
                    _active={{
                      bg: 'gray.900',
                    }}
                    _disabled={{
                      opacity: 0.7,
                      cursor: 'not-allowed',
                    }}
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  >
                    <HStack gap={2}>
                      {loading ? (
                        <div className="loading-spinner" />
                      ) : (
                        <FiLogIn size={18} />
                      )}
                      <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                    </HStack>
                  </Button>
                </VStack>
              </form>

              {/* Footer */}
              <Text fontSize="sm" color="gray.500" textAlign="center" className="footer-text">
                Weber CRM - Enterprise Work Management System
              </Text>
            </VStack>
          </Card.Root>
        </Container>
      </Box>
    </Box>
  );
}
