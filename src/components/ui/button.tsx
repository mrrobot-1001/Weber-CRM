'use client'

import { Button as ChakraButton, Spinner, HStack } from '@chakra-ui/react'
import { forwardRef, ReactNode } from 'react'

interface AppButtonProps {
  children: ReactNode
  variant?: 'solid' | 'outline' | 'ghost' | 'link'
  colorScheme?: 'blue' | 'green' | 'red' | 'orange' | 'gray'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  w?: string
  width?: string
  mt?: number | string
}

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  (
    {
      children,
      variant = 'solid',
      colorScheme = 'blue',
      size = 'md',
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      type = 'button',
      onClick,
      w,
      width,
      mt,
    },
    ref
  ) => {
    const colorMap = {
      blue: { bg: 'brand.500', hover: 'brand.600', color: 'white' },
      green: { bg: 'green.500', hover: 'green.600', color: 'white' },
      red: { bg: 'red.500', hover: 'red.600', color: 'white' },
      orange: { bg: 'orange.500', hover: 'orange.600', color: 'white' },
      gray: { bg: 'gray.500', hover: 'gray.600', color: 'white' },
    }

    const colors = colorMap[colorScheme]

    const getStyles = () => {
      switch (variant) {
        case 'solid':
          return {
            bg: colors.bg,
            color: colors.color,
            _hover: { bg: colors.hover, transform: 'translateY(-1px)', boxShadow: 'md' },
            _active: { transform: 'translateY(0)' },
          }
        case 'outline':
          return {
            bg: 'transparent',
            color: colors.bg,
            borderWidth: '2px',
            borderColor: colors.bg,
            _hover: { bg: `${colorScheme}.50`, transform: 'translateY(-1px)' },
            _active: { transform: 'translateY(0)' },
          }
        case 'ghost':
          return {
            bg: 'transparent',
            color: colors.bg,
            _hover: { bg: `${colorScheme}.50` },
          }
        case 'link':
          return {
            bg: 'transparent',
            color: colors.bg,
            _hover: { textDecoration: 'underline' },
          }
        default:
          return {}
      }
    }

    const sizeMap = {
      xs: { px: 2, py: 1, fontSize: 'xs' },
      sm: { px: 3, py: 1.5, fontSize: 'sm' },
      md: { px: 4, py: 2, fontSize: 'md' },
      lg: { px: 6, py: 3, fontSize: 'lg' },
    }

    const sizeStyles = sizeMap[size]

    return (
      <ChakraButton
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        borderRadius="lg"
        fontWeight="semibold"
        transition="all 0.2s"
        w={w}
        width={width}
        mt={mt}
        {...getStyles()}
        {...sizeStyles}
      >
        <HStack gap={2}>
          {loading ? (
            <Spinner size="sm" />
          ) : (
            <>
              {leftIcon}
              <span>{children}</span>
              {rightIcon}
            </>
          )}
        </HStack>
      </ChakraButton>
    )
  }
)

AppButton.displayName = 'AppButton'
