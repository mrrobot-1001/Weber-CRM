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
import { FiUser, FiMail, FiShield, FiSave, FiEdit2, FiLock } from 'react-icons/fi';
import { Navbar } from '@/components/navbar';
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



  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!currentUser?.id) throw new Error("User ID not found");
      
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
      };
      
      const response = await apiService.updateUser(currentUser.id, payload);
      const updatedUser = response.data || response;
      
      // Update the user in localStorage to keep session in sync
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setEditing(false);
      toaster.create({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
        type: 'success',
        duration: 3000,
      });
    } catch (err: any) {
      toaster.create({
        title: 'Update failed',
        description: err.message || 'Failed to update profile',
        type: 'error',
        duration: 4000,
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
        duration: 3000,
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toaster.create({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long',
        type: 'error',
        duration: 3000,
      });
      return;
    }

    setSaving(true);
    try {
      if (!currentUser?.id) throw new Error('User ID not found');
      await apiService.changePassword(currentUser.id, passwordForm.currentPassword, passwordForm.newPassword);
      toaster.create({
        title: 'Password changed',
        description: 'Your password has been updated successfully',
        type: 'success',
        duration: 3000,
      });
      setChangingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toaster.create({
        title: 'Password change failed',
        description: err.response?.data?.message || err.message || 'Failed to change password',
        type: 'error',
        duration: 4000,
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
      <Navbar 
        title="My Profile" 
        subtitle="Manage your account" 
        user={currentUser} 
        showBack={true} 
      />

      <Container maxW="container.lg" py={{ base: 4, md: 8 }} className="page-enter">
        <VStack gap={{ base: 3, md: 6 }} align="stretch">
          {/* Profile Header Card */}
          <Card.Root borderRadius="2xl" boxShadow="sm" overflow="hidden" borderWidth="1px" borderColor="gray.100">
            <Box 
              h={{ base: '60px', md: '100px' }} 
              bg="gray.900"
            />
            <Card.Body position="relative" pt={0}>
              <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'center', md: 'flex-end' }} gap={{ base: 3, md: 6 }}>
                <Box mt={{ base: '-32px', md: '-48px' }}>
                  <Avatar.Root size={{ base: 'xl', md: '2xl' }} borderWidth="3px" borderColor="white" boxShadow="md">
                    <Avatar.Fallback bg="gray.700" color="white" fontSize={{ base: 'lg', md: '2xl' }}>
                      {getInitials(currentUser?.firstName, currentUser?.lastName)}
                    </Avatar.Fallback>
                  </Avatar.Root>
                </Box>
                <VStack align={{ base: 'center', md: 'start' }} gap={0.5} flex={1} py={{ base: 2, md: 4 }}>
                  <Heading size={{ base: 'lg', md: 'xl' }} color="gray.900" fontWeight="700">{currentUser?.firstName} {currentUser?.lastName}</Heading>
                  <Text color="gray.500" fontSize="xs">@{currentUser?.username}</Text>
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
                    <Text>{editing ? 'Cancel' : 'Edit Profile'}</Text>
                  </HStack>
                </Button>
              </Flex>
            </Card.Body>
          </Card.Root>

          <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={{ base: 3, md: 6 }}>
            {/* Profile Information */}
            <Card.Root borderRadius="xl" borderWidth="1px" borderColor="gray.100">
              <Card.Header pb={2}>
                <HStack gap={2}>
                  <Box p={1.5} borderRadius="lg" bg="gray.50" color="gray.600"><FiUser size={16} /></Box>
                  <VStack align="start" gap={0}>
                    <Heading size={{ base: 'sm', md: 'md' }} color="gray.900" fontWeight="600">Personal Information</Heading>
                    <Text fontSize="xs" color="gray.500">Your basic profile details</Text>
                  </VStack>
                </HStack>
              </Card.Header>
              <Card.Body pt={4}>
                {editing ? (
                  <form onSubmit={handleSaveProfile}>
                    <VStack gap={3}>
                      <Box w="full">
                        <Text mb={1} fontWeight="medium" fontSize="xs" color="gray.700">First Name</Text>
                        <Input 
                          value={form.firstName} 
                          onChange={(e) => setForm({ ...form, firstName: e.target.value })} 
                          placeholder="John"
                          borderRadius="lg"
                          size={{ base: 'sm', md: 'md' }}
                          required 
                        />
                      </Box>
                      <Box w="full">
                        <Text mb={1} fontWeight="medium" fontSize="xs" color="gray.700">Last Name</Text>
                        <Input 
                          value={form.lastName} 
                          onChange={(e) => setForm({ ...form, lastName: e.target.value })} 
                          placeholder="Doe"
                          borderRadius="lg"
                          size={{ base: 'sm', md: 'md' }}
                          required 
                        />
                      </Box>
                      <Box w="full">
                        <Text mb={1} fontWeight="medium" fontSize="xs" color="gray.700">Email</Text>
                        <Input 
                          type="email"
                          value={form.email} 
                          onChange={(e) => setForm({ ...form, email: e.target.value })} 
                          placeholder="john@company.com"
                          borderRadius="lg"
                          size={{ base: 'sm', md: 'md' }}
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
                          <Text>Save Changes</Text>
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
            <Card.Root borderRadius="xl" borderWidth="1px" borderColor="gray.100">
              <Card.Header pb={2}>
                <HStack gap={2}>
                  <Box p={1.5} borderRadius="lg" bg="gray.50" color="gray.600"><FiLock size={16} /></Box>
                  <VStack align="start" gap={0}>
                    <Heading size={{ base: 'sm', md: 'md' }} color="gray.900" fontWeight="600">Security</Heading>
                    <Text fontSize="xs" color="gray.500">Manage your password</Text>
                  </VStack>
                </HStack>
              </Card.Header>
              <Card.Body pt={4}>
                {changingPassword ? (
                  <form onSubmit={handleChangePassword}>
                    <VStack gap={3}>
                      <Box w="full">
                        <Text mb={1} fontWeight="medium" fontSize="xs" color="gray.700">Current Password</Text>
                        <Input 
                          type="password"
                          autoComplete="current-password"
                          value={passwordForm.currentPassword} 
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} 
                          placeholder="Enter current password"
                          borderRadius="lg"
                          size={{ base: 'sm', md: 'md' }}
                          required 
                        />
                      </Box>
                      <Box w="full">
                        <Text mb={1} fontWeight="medium" fontSize="xs" color="gray.700">New Password</Text>
                        <Input 
                          type="password"
                          autoComplete="new-password"
                          value={passwordForm.newPassword} 
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} 
                          placeholder="Enter new password"
                          borderRadius="lg"
                          size={{ base: 'sm', md: 'md' }}
                          required 
                        />
                      </Box>
                      <Box w="full">
                        <Text mb={1} fontWeight="medium" fontSize="xs" color="gray.700">Confirm New Password</Text>
                        <Input 
                          type="password"
                          autoComplete="new-password"
                          value={passwordForm.confirmPassword} 
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} 
                          placeholder="Confirm new password"
                          borderRadius="lg"
                          size={{ base: 'sm', md: 'md' }}
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
                            <Text>Update Password</Text>
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
                        <Text>Change Password</Text>
                      </HStack>
                    </Button>
                  </VStack>
                )}
              </Card.Body>
            </Card.Root>
          </Grid>

          {/* Account Details */}
          <Card.Root borderRadius="xl" borderWidth="1px" borderColor="gray.100">
            <Card.Header pb={2}>
              <HStack gap={2}>
                <Box p={1.5} borderRadius="lg" bg="gray.50" color="gray.600"><FiShield size={16} /></Box>
                <VStack align="start" gap={0}>
                  <Heading size={{ base: 'sm', md: 'md' }} color="gray.900" fontWeight="600">Account Details</Heading>
                  <Text fontSize="xs" color="gray.500">Your account information</Text>
                </VStack>
              </HStack>
            </Card.Header>
            <Card.Body pt={4}>
              <Grid templateColumns={{ base: 'repeat(3, 1fr)', md: 'repeat(3, 1fr)' }} gap={{ base: 2, md: 6 }}>
                <Box p={{ base: 2.5, md: 4 }} bg="gray.50" borderRadius="lg">
                  <Text fontSize="xs" color="gray.500" mb={0.5}>User ID</Text>
                  <Text fontWeight="bold" color="gray.800" fontSize={{ base: 'sm', md: 'lg' }}>{currentUser?.id}</Text>
                </Box>
                <Box p={{ base: 2.5, md: 4 }} bg="gray.50" borderRadius="lg">
                  <Text fontSize="xs" color="gray.500" mb={0.5}>Username</Text>
                  <Text fontWeight="bold" color="gray.800" fontSize={{ base: 'sm', md: 'lg' }} truncate>@{currentUser?.username}</Text>
                </Box>
                <Box p={{ base: 2.5, md: 4 }} bg="gray.50" borderRadius="lg">
                  <Text fontSize="xs" color="gray.500" mb={0.5}>Role ID</Text>
                  <Text fontWeight="bold" color="gray.800" fontSize={{ base: 'sm', md: 'lg' }}>{currentUser?.roleId}</Text>
                </Box>
              </Grid>
            </Card.Body>
          </Card.Root>
        </VStack>
      </Container>
    </Box>
  );
}
