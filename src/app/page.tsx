'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const token = localStorage.getItem('token');
    
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router, mounted]);

  return null;
}
