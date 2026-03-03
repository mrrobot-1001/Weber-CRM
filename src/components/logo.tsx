import Image from 'next/image';
import { Box, BoxProps } from '@chakra-ui/react';

interface LogoProps extends BoxProps {
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ size = 'md', ...props }: LogoProps) {
  const sizes = {
    sm: { width: 36, height: 36 },
    md: { width: 52, height: 52 },
    lg: { width: 72, height: 72 },
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
          width: dimensions.width,
          height: dimensions.height,
          borderRadius: '12px',
          objectFit: 'cover',
        }}
      />
    </Box>
  );
}
