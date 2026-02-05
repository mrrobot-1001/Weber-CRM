'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  Card,
  Grid,
  Flex,
  Avatar,
} from '@chakra-ui/react';
import { FiArrowLeft, FiUser, FiMail, FiShield, FiSave, FiEdit2, FiLock } from 'react-icons/fi';
import { apiService } from '@/services/api';
import { toaster } from '@/components/ui/toaster';

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

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
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
    }
  }, [router, mounted]);

  const handleLogout = async () => {
    await apiService.logout();
    router.push('/login');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Update the user in localStorage (in real app, you'd call an API)
      const updatedUser = {
        ...currentUser,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setEditing(false);
      toaster.create({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
        type: 'success',
        duration: 4000,
      });
    } catch (err: any) {
      toaster.create({
        title: 'Update failed',
        description: err.message || 'Failed to update profile',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toaster.create({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same',
        type: 'error',
        duration: 4000,
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toaster.create({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long',
        type: 'error',
        duration: 4000,
      });
      return;
    }

    setSaving(true);
    try {
      // In a real app, you'd call an API endpoint to change password
      // await apiService.changePassword(passwordForm);
      toaster.create({
        title: 'Password changed',
        description: 'Your password has been updated successfully',
        type: 'success',
        duration: 4000,
      });
      setChangingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toaster.create({
        title: 'Password change failed',
        description: err.message || 'Failed to change password',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'CEO': return 'purple';
      case 'COO': return 'blue';
      case 'Departmental Head':
      case 'DEPT_HEAD': return 'teal';
      case 'Senior Associate':
      case 'SENIOR': return 'green';
      default: return 'gray';
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="white" borderBottom="1px" borderColor="gray.200" px={{ base: 4, md: 6 }} py={4} position="sticky" top={0} zIndex={10} boxShadow="sm">
        <Flex justify="space-between" align="center" maxW="container.xl" mx="auto">
          <HStack gap={4}>
            <Button variant="ghost" onClick={() => router.push('/dashboard')} borderRadius="lg" _hover={{ bg: 'gray.100' }}>
              <HStack gap={2}>
                <FiArrowLeft />
                <span>Back</span>
              </HStack>
            </Button>
            <VStack align="start" gap={0}>
              <Heading size="lg" color="gray.800">My Profile</Heading>
              <Text fontSize="sm" color="gray.500">View and edit your profile information</Text>
            </VStack>
          </HStack>
          <HStack gap={4}>
            <Button variant="ghost" size="sm" onClick={handleLogout} borderRadius="lg">Logout</Button>
          </HStack>
        </Flex>
      </Box>

      <Container maxW="container.lg" py={8}>
        <VStack gap={6} align="stretch">
          {/* Profile Header Card */}
          <Card.Root borderRadius="xl" boxShadow="md" overflow="hidden">
            <Box 
              h="120px" 
              bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            />
            <Card.Body position="relative" pt={0}>
              <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'center', md: 'flex-end' }} gap={6}>
                <Box mt="-60px">
                  <Avatar.Root size="2xl" borderWidth="4px" borderColor="white" boxShadow="lg">
                    <Avatar.Fallback bg="brand.500" color="white" fontSize="2xl">
                      {getInitials(currentUser?.firstName, currentUser?.lastName)}
                    </Avatar.Fallback>
                  </Avatar.Root>
                </Box>
                <VStack align={{ base: 'center', md: 'start' }} gap={1} flex={1} py={4}>
                  <Heading size="xl" color="gray.800">{currentUser?.firstName} {currentUser?.lastName}</Heading>
                  <Text color="gray.500">@{currentUser?.username}</Text>
                  <Box 
                    px={3} 
                    py={1} 
                    borderRadius="full" 
                    bg={`${getRoleBadgeColor(currentUser?.role)}.100`}
                    color={`${getRoleBadgeColor(currentUser?.role)}.700`}
                    fontWeight="semibold"
                    fontSize="sm"
                  >
                    {currentUser?.role}
                  </Box>
                </VStack>
                <Button 
                  colorScheme="blue" 
                  variant={editing ? 'solid' : 'outline'}
                  onClick={() => setEditing(!editing)}
                  borderRadius="lg"
                  display={{ base: 'none', md: 'flex' }}
                >
                  <HStack gap={2}>
                    <FiEdit2 />
                    <span>{editing ? 'Cancel' : 'Edit Profile'}</span>
                  </HStack>
                </Button>
              </Flex>
            </Card.Body>
          </Card.Root>

          <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
            {/* Profile Information */}
            <Card.Root borderRadius="xl" boxShadow="sm">
              <Card.Header pb={2}>
                <HStack gap={3}>
                  <Box p={2} borderRadius="lg" bg="blue.100" color="blue.600"><FiUser size={20} /></Box>
                  <VStack align="start" gap={0}>
                    <Heading size="md" color="gray.800">Personal Information</Heading>
                    <Text fontSize="sm" color="gray.500">Your basic profile details</Text>
                  </VStack>
                </HStack>
              </Card.Header>
              <Card.Body pt={4}>
                {editing ? (
                  <form onSubmit={handleSaveProfile}>
                    <VStack gap={4}>
                      <Box w="full">
                        <Text mb={2} fontWeight="medium" fontSize="sm" color="gray.700">First Name</Text>
                        <Input 
                          value={form.firstName} 
                          onChange={(e) => setForm({ ...form, firstName: e.target.value })} 
                          placeholder="John"
                          borderRadius="lg"
                          required 
                        />
                      </Box>
                      <Box w="full">
                        <Text mb={2} fontWeight="medium" fontSize="sm" color="gray.700">Last Name</Text>
                        <Input 
                          value={form.lastName} 
                          onChange={(e) => setForm({ ...form, lastName: e.target.value })} 
                          placeholder="Doe"
                          borderRadius="lg"
                          required 
                        />
                      </Box>
                      <Box w="full">
                        <Text mb={2} fontWeight="medium" fontSize="sm" color="gray.700">Email</Text>
                        <Input 
                          type="email"
                          value={form.email} 
                          onChange={(e) => setForm({ ...form, email: e.target.value })} 
                          placeholder="john@company.com"
                          borderRadius="lg"
                          required 
                        />
                      </Box>
                      <Button 
                        type="submit" 
                        colorScheme="blue" 
                        w="full" 
                        borderRadius="lg"
                        loading={saving}
                        mt={2}
                      >
                        <HStack gap={2}>
                          <FiSave />
                          <span>Save Changes</span>
                        </HStack>
                      </Button>
                    </VStack>
                  </form>
                ) : (
                  <VStack gap={4} align="stretch">
                    <HStack justify="space-between" py={3} borderBottom="1px" borderColor="gray.100">
                      <HStack gap={3}>
                        <FiUser color="#718096" />
                        <Text color="gray.500" fontSize="sm">First Name</Text>
                      </HStack>
                      <Text fontWeight="semibold" color="gray.800">{currentUser?.firstName}</Text>
                    </HStack>
                    <HStack justify="space-between" py={3} borderBottom="1px" borderColor="gray.100">
                      <HStack gap={3}>
                        <FiUser color="#718096" />
                        <Text color="gray.500" fontSize="sm">Last Name</Text>
                      </HStack>
                      <Text fontWeight="semibold" color="gray.800">{currentUser?.lastName}</Text>
                    </HStack>
                    <HStack justify="space-between" py={3} borderBottom="1px" borderColor="gray.100">
                      <HStack gap={3}>
                        <FiMail color="#718096" />
                        <Text color="gray.500" fontSize="sm">Email</Text>
                      </HStack>
                      <Text fontWeight="semibold" color="gray.800">{currentUser?.email}</Text>
                    </HStack>
                    <HStack justify="space-between" py={3}>
                      <HStack gap={3}>
                        <FiShield color="#718096" />
                        <Text color="gray.500" fontSize="sm">Role</Text>
                      </HStack>
                      <Text fontWeight="semibold" color="gray.800">{currentUser?.role}</Text>
                    </HStack>
                  </VStack>
                )}
              </Card.Body>
            </Card.Root>

            {/* Security Settings */}
            <Card.Root borderRadius="xl" boxShadow="sm">
              <Card.Header pb={2}>
                <HStack gap={3}>
                  <Box p={2} borderRadius="lg" bg="orange.100" color="orange.600"><FiLock size={20} /></Box>
                  <VStack align="start" gap={0}>
                    <Heading size="md" color="gray.800">Security</Heading>
                    <Text fontSize="sm" color="gray.500">Manage your password</Text>
                  </VStack>
                </HStack>
              </Card.Header>
              <Card.Body pt={4}>
                {changingPassword ? (
                  <form onSubmit={handleChangePassword}>
                    <VStack gap={4}>
                      <Box w="full">
                        <Text mb={2} fontWeight="medium" fontSize="sm" color="gray.700">Current Password</Text>
                        <Input 
                          type="password"
                          value={passwordForm.currentPassword} 
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} 
                          placeholder="Enter current password"
                          borderRadius="lg"
                          required 
                        />
                      </Box>
                      <Box w="full">
                        <Text mb={2} fontWeight="medium" fontSize="sm" color="gray.700">New Password</Text>
                        <Input 
                          type="password"
                          value={passwordForm.newPassword} 
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} 
                          placeholder="Enter new password"
                          borderRadius="lg"
                          required 
                        />
                      </Box>
                      <Box w="full">
                        <Text mb={2} fontWeight="medium" fontSize="sm" color="gray.700">Confirm New Password</Text>
                        <Input 
                          type="password"
                          value={passwordForm.confirmPassword} 
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} 
                          placeholder="Confirm new password"
                          borderRadius="lg"
                          required 
                        />
                      </Box>
                      <HStack gap={3} w="full">
                        <Button 
                          variant="outline"
                          flex={1}
                          borderRadius="lg"
                          onClick={() => {
                            setChangingPassword(false);
                            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          colorScheme="orange" 
                          flex={1}
                          borderRadius="lg"
                          loading={saving}
                        >
                          <HStack gap={2}>
                            <FiLock />
                            <span>Update Password</span>
                          </HStack>
                        </Button>
                      </HStack>
                    </VStack>
                  </form>
                ) : (
                  <VStack gap={4} align="stretch">
                    <Text color="gray.600" fontSize="sm">
                      Keep your account secure by using a strong password. We recommend changing your password periodically.
                    </Text>
                    <Button 
                      colorScheme="orange" 
                      variant="outline"
                      borderRadius="lg"
                      onClick={() => setChangingPassword(true)}
                    >
                      <HStack gap={2}>
                        <FiLock />
                        <span>Change Password</span>
                      </HStack>
                    </Button>
                  </VStack>
                )}
              </Card.Body>
            </Card.Root>
          </Grid>

          {/* Account Details */}
          <Card.Root borderRadius="xl" boxShadow="sm">
            <Card.Header pb={2}>
              <HStack gap={3}>
                <Box p={2} borderRadius="lg" bg="gray.100" color="gray.600"><FiShield size={20} /></Box>
                <VStack align="start" gap={0}>
                  <Heading size="md" color="gray.800">Account Details</Heading>
                  <Text fontSize="sm" color="gray.500">Your account information</Text>
                </VStack>
              </HStack>
            </Card.Header>
            <Card.Body pt={4}>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
                <Box p={4} bg="gray.50" borderRadius="lg">
                  <Text fontSize="sm" color="gray.500" mb={1}>User ID</Text>
                  <Text fontWeight="bold" color="gray.800" fontSize="lg">{currentUser?.id}</Text>
                </Box>
                <Box p={4} bg="gray.50" borderRadius="lg">
                  <Text fontSize="sm" color="gray.500" mb={1}>Username</Text>
                  <Text fontWeight="bold" color="gray.800" fontSize="lg">@{currentUser?.username}</Text>
                </Box>
                <Box p={4} bg="gray.50" borderRadius="lg">
                  <Text fontSize="sm" color="gray.500" mb={1}>Role ID</Text>
                  <Text fontWeight="bold" color="gray.800" fontSize="lg">{currentUser?.roleId}</Text>
                </Box>
              </Grid>
            </Card.Body>
          </Card.Root>
        </VStack>
      </Container>
    </Box>
  );
}
