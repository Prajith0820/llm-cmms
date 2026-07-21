'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Button, Center, Paper, PasswordInput, Stack,
  Text, TextInput, Title, rem
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBolt, IconLock, IconMail } from '@tabler/icons-react';
import { login } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router   = useRouter();
  const setUser  = useAuthStore((s) => s.setUser);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const [email,    setEmail]    = useState('admin@fixbyte.com');
  const [password, setPassword] = useState('admin123');
  const [loading,  setLoading]  = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (isLoggedIn()) router.push('/dashboard');
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      setUser(res.data.user);
      notifications.show({ title: 'Welcome back!', message: `Hello, ${res.data.user.name}`, color: 'violet' });
      router.push('/dashboard');
    } catch {
      notifications.show({ title: 'Login failed', message: 'Invalid email or password.', color: 'red' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 60% 0%, rgba(108, 99, 255, 0.18) 0%, transparent 60%), radial-gradient(ellipse at 10% 80%, rgba(108, 99, 255, 0.12) 0%, transparent 50%), var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background Grid */}
      <Box
        style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(108,99,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <Center style={{ width: '100%', padding: rem(24), position: 'relative', zIndex: 1 }}>
        <Box style={{ width: '100%', maxWidth: 420 }}>

          {/* Logo */}
          <Stack align="center" gap="xs" mb="xl">
            <Box
              style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'linear-gradient(135deg, #6c63ff 0%, #a78bfa 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(108,99,255,0.4)',
              }}
            >
              <IconBolt size={34} color="white" stroke={2.5} />
            </Box>
            <Title order={1} style={{ fontSize: rem(28), fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
              FixByte
            </Title>
            <Text size="sm" c="dimmed">Intelligent Maintenance Management</Text>
          </Stack>

          {/* Card */}
          <Paper
            p="xl"
            radius="lg"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
            }}
          >
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput
                  id="login-email"
                  label="Email address"
                  placeholder="admin@fixbyte.com"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  leftSection={<IconMail size={16} />}
                  required
                  styles={{
                    input: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' },
                    label: { color: 'var(--color-muted)', marginBottom: 6 }
                  }}
                />

                <PasswordInput
                  id="login-password"
                  label="Password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  leftSection={<IconLock size={16} />}
                  required
                  styles={{
                    input: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' },
                    label: { color: 'var(--color-muted)', marginBottom: 6 }
                  }}
                />

                <Button
                  id="login-submit"
                  type="submit"
                  loading={loading}
                  fullWidth
                  mt="xs"
                  size="md"
                  style={{
                    background: 'linear-gradient(135deg, #6c63ff 0%, #a78bfa 100%)',
                    border: 'none',
                    fontWeight: 600,
                    letterSpacing: '0.3px',
                  }}
                >
                  Sign in to FixByte
                </Button>
              </Stack>
            </form>

            {/* Demo hint */}
            <Box
              mt="lg"
              p="sm"
              style={{
                background: 'rgba(108,99,255,0.08)',
                border: '1px solid rgba(108,99,255,0.2)',
                borderRadius: 8,
              }}
            >
              <Text size="xs" c="dimmed" ta="center">
                Demo: <Text span fw={600} c="violet.4">admin@fixbyte.com</Text> / <Text span fw={600} c="violet.4">admin123</Text>
              </Text>
            </Box>
          </Paper>
        </Box>
      </Center>
    </Box>
  );
}
