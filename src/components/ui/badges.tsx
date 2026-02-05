'use client'

import { Box, Text, HStack } from '@chakra-ui/react'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

const statusColors: Record<string, { bg: string; color: string; dot: string }> = {
  active: { bg: 'gray.100', color: 'gray.900', dot: 'gray.900' },
  inactive: { bg: 'gray.50', color: 'gray.600', dot: 'gray.400' },
  deleted: { bg: 'gray.100', color: 'gray.700', dot: 'gray.700' },
  pending: { bg: 'gray.100', color: 'gray.800', dot: 'gray.600' },
  assigned: { bg: 'gray.100', color: 'gray.900', dot: 'gray.900' },
  in_progress: { bg: 'gray.100', color: 'gray.900', dot: 'gray.900' },
  completed: { bg: 'gray.900', color: 'white', dot: 'white' },
  submitted: { bg: 'gray.100', color: 'gray.900', dot: 'gray.900' },
  approved: { bg: 'gray.900', color: 'white', dot: 'white' },
  rejected: { bg: 'gray.100', color: 'gray.700', dot: 'gray.700' },
  overdue: { bg: 'gray.900', color: 'white', dot: 'white' },
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '_') || 'active'
  const colors = statusColors[normalizedStatus] || statusColors.active

  return (
    <HStack
      gap={1.5}
      px={size === 'sm' ? 2 : 3}
      py={size === 'sm' ? 0.5 : 1}
      bg={colors.bg}
      borderRadius="full"
      display="inline-flex"
    >
      <Box
        w={size === 'sm' ? 1.5 : 2}
        h={size === 'sm' ? 1.5 : 2}
        borderRadius="full"
        bg={colors.dot}
      />
      <Text
        fontSize={size === 'sm' ? 'xs' : 'sm'}
        fontWeight="medium"
        color={colors.color}
        textTransform="capitalize"
      >
        {status?.replace(/_/g, ' ') || 'Active'}
      </Text>
    </HStack>
  )
}

interface PriorityBadgeProps {
  priority: string
  size?: 'sm' | 'md'
}

const priorityColors: Record<string, { bg: string; color: string }> = {
  low: { bg: 'gray.50', color: 'gray.600' },
  medium: { bg: 'gray.100', color: 'gray.700' },
  high: { bg: 'gray.700', color: 'white' },
  urgent: { bg: 'gray.900', color: 'white' },
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const normalizedPriority = priority?.toLowerCase() || 'medium'
  const colors = priorityColors[normalizedPriority] || priorityColors.medium

  return (
    <Box
      px={size === 'sm' ? 2 : 3}
      py={size === 'sm' ? 0.5 : 1}
      bg={colors.bg}
      color={colors.color}
      borderRadius="md"
      fontSize={size === 'sm' ? 'xs' : 'sm'}
      fontWeight="semibold"
      textTransform="uppercase"
      letterSpacing="wide"
      display="inline-block"
    >
      {priority || 'Medium'}
    </Box>
  )
}

interface RoleBadgeProps {
  role: string
  size?: 'sm' | 'md'
}

const roleColors: Record<string, { bg: string; color: string; border: string }> = {
  ceo: { bg: 'purple.100', color: 'purple.800', border: 'purple.300' },
  coo: { bg: 'indigo.100', color: 'indigo.800', border: 'indigo.300' },
  departmental_head: { bg: 'blue.100', color: 'blue.800', border: 'blue.300' },
  dept_head: { bg: 'blue.100', color: 'blue.800', border: 'blue.300' },
  senior_associate: { bg: 'teal.100', color: 'teal.800', border: 'teal.300' },
  senior: { bg: 'teal.100', color: 'teal.800', border: 'teal.300' },
  associate: { bg: 'gray.100', color: 'gray.800', border: 'gray.300' },
}

export function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const normalizedRole = role?.toLowerCase().replace(/\s+/g, '_') || 'associate'
  const colors = roleColors[normalizedRole] || roleColors.associate

  const displayRole = role?.replace(/_/g, ' ') || 'Associate'

  return (
    <Box
      px={size === 'sm' ? 2 : 3}
      py={size === 'sm' ? 0.5 : 1}
      bg={colors.bg}
      color={colors.color}
      borderRadius="md"
      fontSize={size === 'sm' ? 'xs' : 'sm'}
      fontWeight="medium"
      borderWidth="1px"
      borderColor={colors.border}
      display="inline-block"
    >
      {displayRole}
    </Box>
  )
}
