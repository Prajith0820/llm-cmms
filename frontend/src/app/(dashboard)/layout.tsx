'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, rem } from '@mantine/core';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/authStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router     = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  useEffect(() => {
    if (!isLoggedIn()) router.push('/');
  }, []);

  return (
    <Box style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Sidebar />
      <Box
        style={{
          marginLeft: 220,
          flex: 1,
          minHeight: '100vh',
          padding: rem(28),
          overflowY: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
