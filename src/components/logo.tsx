import Image from 'next/image';
import { Box, BoxProps } from '@chakra-ui/react';

interface LogoProps extends BoxProps {
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ size = 'md', ...props }: LogoProps) {
  const sizes = {
    sm: { width: 40, height: 40 },
    md: { width: 60, height: 60 },
    lg: { width: 80, height: 80 },
  };

  const dimensions = sizes[size];

  return (
    <Box {...props}>
      <Image
        src="/weber-logo.jpeg"
        alt="Weber CRM Logo"
        width={dimensions.width}
        height={dimensions.height}
        priority
        style={{
          width: 'auto',
          height: 'auto',
        }}
      />
    </Box>
  );
}
