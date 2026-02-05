'use client'

import { Box, Skeleton, VStack, HStack, Grid } from '@chakra-ui/react'

export function CardSkeleton() {
  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
      <VStack align="stretch" gap={3}>
        <Skeleton height="20px" width="60%" />
        <Skeleton height="16px" width="80%" />
        <HStack justify="space-between">
          <Skeleton height="14px" width="30%" />
          <Skeleton height="24px" width="80px" borderRadius="full" />
        </HStack>
      </VStack>
    </Box>
  )
}

export function TableRowSkeleton() {
  return (
    <Box p={4} borderWidth="1px" borderRadius="md" bg="white">
      <HStack justify="space-between">
        <VStack align="start" gap={2} flex={1}>
          <Skeleton height="18px" width="40%" />
          <Skeleton height="14px" width="60%" />
        </VStack>
        <HStack gap={3}>
          <Skeleton height="24px" width="80px" borderRadius="full" />
          <Skeleton height="32px" width="70px" borderRadius="md" />
        </HStack>
      </HStack>
    </Box>
  )
}

export function FormSkeleton() {
  return (
    <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
      <VStack align="stretch" gap={4}>
        <Skeleton height="24px" width="40%" mb={2} />
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
          {[...Array(6)].map((_, i) => (
            <VStack key={i} align="stretch" gap={2}>
              <Skeleton height="14px" width="30%" />
              <Skeleton height="40px" width="100%" borderRadius="md" />
            </VStack>
          ))}
        </Grid>
        <Skeleton height="44px" width="150px" borderRadius="lg" mt={2} />
      </VStack>
    </Box>
  )
}

export function DashboardCardSkeleton() {
  return (
    <Box p={6} borderWidth="1px" borderRadius="xl" bg="white" boxShadow="sm">
      <VStack align="start" gap={3}>
        <HStack w="full" justify="space-between">
          <Skeleton height="16px" width="40%" />
          <Skeleton height="40px" width="40px" borderRadius="lg" />
        </HStack>
        <Skeleton height="36px" width="60%" />
        <Skeleton height="14px" width="50%" />
      </VStack>
    </Box>
  )
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <VStack gap={3} align="stretch">
      {[...Array(count)].map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </VStack>
  )
}
