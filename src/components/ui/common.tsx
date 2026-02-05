'use client'

import { Box, VStack, Text, HStack } from '@chakra-ui/react'
import { ReactNode } from 'react'
import { FiInbox } from 'react-icons/fi'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Box py={12} px={6} textAlign="center">
      <VStack gap={4}>
        <Box
          p={4}
          borderRadius="full"
          bg="gray.100"
          color="gray.400"
        >
          {icon || <FiInbox size={40} />}
        </Box>
        <VStack gap={1}>
          <Text fontSize="lg" fontWeight="semibold" color="gray.700">
            {title}
          </Text>
          {description && (
            <Text color="gray.500" maxW="sm">
              {description}
            </Text>
          )}
        </VStack>
        {action}
      </VStack>
    </Box>
  )
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  backButton?: ReactNode
}

export function PageHeader({
  title,
  subtitle,
  action,
  backButton,
}: PageHeaderProps) {
  return (
    <Box
      bg="white"
      borderBottom="1px"
      borderColor="gray.200"
      px={{ base: 4, md: 6 }}
      py={4}
      position="sticky"
      top={0}
      zIndex={10}
    >
      <HStack justify="space-between" align="center" maxW="container.xl" mx="auto">
        <HStack gap={4}>
          {backButton}
          <VStack align="start" gap={0}>
            <Text fontSize="xl" fontWeight="bold" color="gray.900">
              {title}
            </Text>
            {subtitle && (
              <Text fontSize="sm" color="gray.600">
                {subtitle}
              </Text>
            )}
          </VStack>
        </HStack>
        {action}
      </HStack>
    </Box>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  icon: ReactNode
  color?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatCard({
  label,
  value,
  icon,
  color = 'brand.500',
  trend,
}: StatCardProps) {
  return (
    <Box
      p={6}
      bg="white"
      borderRadius="xl"
      boxShadow="sm"
      borderWidth="1px"
      borderColor="gray.200"
      transition="all 0.2s"
      _hover={{
        boxShadow: 'md',
        transform: 'translateY(-2px)',
      }}
    >
      <HStack justify="space-between" mb={4}>
        <Text fontSize="sm" fontWeight="medium" color="gray.600">
          {label}
        </Text>
        <Box p={2.5} borderRadius="lg" bg={`${color}15`} color={color}>
          {icon}
        </Box>
      </HStack>
      <VStack align="start" gap={1}>
        <Text fontSize="3xl" fontWeight="bold" color="gray.900">
          {value}
        </Text>
        {trend && (
          <HStack gap={1}>
            <Text
              fontSize="sm"
              fontWeight="medium"
              color={trend.isPositive ? 'green.500' : 'red.500'}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </Text>
            <Text fontSize="sm" color="gray.500">
              from last month
            </Text>
          </HStack>
        )}
      </VStack>
    </Box>
  )
}
