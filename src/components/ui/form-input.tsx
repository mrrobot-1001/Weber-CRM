'use client'

import { Box, Text, Input as ChakraInput, Textarea as ChakraTextarea } from '@chakra-ui/react'
import { forwardRef } from 'react'

interface InputProps {
  label?: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const FormInput = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      type = 'text',
      value,
      onChange,
      placeholder,
      required = false,
      disabled = false,
      size = 'md',
    },
    ref
  ) => {
    const sizeStyles = {
      sm: { py: 1.5, px: 3, fontSize: 'sm' },
      md: { py: 2.5, px: 4, fontSize: 'md' },
      lg: { py: 3, px: 4, fontSize: 'lg' },
    }

    return (
      <Box w="full">
        {label && (
          <Text mb={2} fontWeight="medium" fontSize="sm">
            {label}
            {required && <Text as="span" color="red.500" ml={1}>*</Text>}
          </Text>
        )}
        <ChakraInput
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          borderRadius="lg"
          borderColor="gray.300"
          _hover={{ borderColor: 'brand.400' }}
          _focus={{
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          }}
          {...sizeStyles[size]}
        />
      </Box>
    )
  }
)

FormInput.displayName = 'FormInput'

interface TextareaProps {
  label?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  rows?: number
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      value,
      onChange,
      placeholder,
      required = false,
      disabled = false,
      rows = 3,
    },
    ref
  ) => {
    return (
      <Box w="full">
        {label && (
          <Text mb={2} fontWeight="medium" fontSize="sm">
            {label}
            {required && <Text as="span" color="red.500" ml={1}>*</Text>}
          </Text>
        )}
        <ChakraTextarea
          ref={ref}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          borderRadius="lg"
          borderColor="gray.300"
          _hover={{ borderColor: 'brand.400' }}
          _focus={{
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          }}
          px={4}
          py={2.5}
        />
      </Box>
    )
  }
)

FormTextarea.displayName = 'FormTextarea'
