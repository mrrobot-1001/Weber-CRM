'use client'

import { ChakraProvider } from '@chakra-ui/react'
import theme from '@/theme'
import { Toaster } from '@/components/ui/toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={theme}>
      {children}
      <Toaster />
    </ChakraProvider>
  )
}
