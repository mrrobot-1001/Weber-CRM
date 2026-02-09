'use client'

import {
  Box,
  Card,
  Heading,
  Text,
  HStack,
  Button,
  Portal,
} from '@chakra-ui/react'
import { ReactNode } from 'react'
import { FiAlertTriangle, FiTrash2, FiX } from 'react-icons/fi'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: ReactNode
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  variant = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null

  const variantStyles = {
    danger: {
      iconBg: 'red.100',
      iconColor: 'red.600',
      buttonColorScheme: 'red',
      Icon: FiTrash2,
    },
    warning: {
      iconBg: 'orange.100',
      iconColor: 'orange.600',
      buttonColorScheme: 'orange',
      Icon: FiAlertTriangle,
    },
    info: {
      iconBg: 'blue.100',
      iconColor: 'blue.600',
      buttonColorScheme: 'blue',
      Icon: FiAlertTriangle,
    },
  }

  const styles = variantStyles[variant]
  const IconComponent = styles.Icon

  return (
    <Portal>
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={1000}
        onClick={onClose}
        animation="fadeIn 0.2s ease-out"
      >
        <Card.Root
          maxW="md"
          w="90%"
          onClick={(e) => e.stopPropagation()}
          boxShadow="2xl"
          borderRadius="xl"
          overflow="hidden"
          animation="slideUp 0.2s ease-out"
        >
          <Card.Header pb={2}>
            <HStack gap={3}>
              <Box
                p={3}
                borderRadius="full"
                bg={styles.iconBg}
                color={styles.iconColor}
              >
                <IconComponent size={24} />
              </Box>
              <Heading size="md">{title}</Heading>
            </HStack>
          </Card.Header>
          <Card.Body py={4}>
            <Text color="gray.600" lineHeight="tall">
              {message}
            </Text>
          </Card.Body>
          <Box p={4} bg="gray.50" borderTop="1px" borderColor="gray.200">
            <HStack justify="flex-end" gap={3}>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                borderRadius="lg"
                px={5}
              >
                {cancelText}
              </Button>
              <Button
                colorScheme={styles.buttonColorScheme}
                onClick={onConfirm}
                loading={isLoading}
                borderRadius="lg"
                px={5}
              >
                <HStack gap={2}>
                  <IconComponent size={16} />
                  <Text>{confirmText}</Text>
                </HStack>
              </Button>
            </HStack>
          </Box>
        </Card.Root>
      </Box>
    </Portal>
  )
}
