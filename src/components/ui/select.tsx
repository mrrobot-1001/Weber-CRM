'use client'

import { Box, Text } from '@chakra-ui/react'

interface SelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: { label: string; value: string | number }[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  disabled = false,
}: SelectProps) {
  return (
    <Box w="full">
      {label && (
        <Text mb={2} fontWeight="medium" fontSize="sm">
          {label}
          {required && <Text as="span" color="red.500" ml={1}>*</Text>}
        </Text>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        style={{
          width: '100%',
          padding: '10px 16px',
          paddingRight: '40px',
          border: '1px solid #edf2f7',
          borderRadius: '10px',
          backgroundColor: 'white',
          fontSize: '14px',
          color: value ? '#1a202c' : '#a0aec0',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          appearance: 'none',
          outline: 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 12px center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '20px 20px',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#1a202c';
          e.target.style.boxShadow = '0 0 0 1px #1a202c';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#edf2f7';
          e.target.style.boxShadow = 'none';
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Box>
  )
}
