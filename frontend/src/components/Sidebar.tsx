'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  Box, Stack, Text, UnstyledButton, Tooltip, rem, Avatar, Divider, Group
} from '@mantine/core';
import {
  IconLayoutDashboard, IconEngine, IconClipboardList,
  IconCalendarStats, IconPackage, IconFileAnalytics,
  IconRobot, IconLogout, IconBolt
} from '@tabler/icons-react';
import { useAuthStore } from '@/store/authStore';

const NAV_ITEMS = [
  { href: '/dashboard',               icon: IconLayoutDashboard,  label: 'Dashboard' },
  { href: '/assets',                  icon: IconEngine,           label: 'Assets' },
  { href: '/work-orders',             icon: IconClipboardList,    label: 'Work Orders' },
  { href: '/preventive-maintenance',  icon: IconCalendarStats,    label: 'PM Schedule' },
  { href: '/inventory',               icon: IconPackage,          label: 'Inventory' },
  { href: '/reports',                 icon: IconFileAnalytics,    label: 'Reports' },
  { href: '/chat',                    icon: IconRobot,            label: 'AI Assistant' },
];

interface SidebarLinkProps {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}

function SidebarLink({ icon: Icon, label, active, onClick }: SidebarLinkProps) {
  return (
    <Tooltip label={label} position="right" withArrow offset={12}>
      <UnstyledButton
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: rem(12),
          padding: `${rem(10)} ${rem(12)}`,
          borderRadius: rem(10),
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          background: active
            ? 'linear-gradient(135deg, rgba(108,99,255,0.25) 0%, rgba(167,139,250,0.15) 100%)'
            : 'transparent',
          border: active ? '1px solid rgba(108,99,255,0.3)' : '1px solid transparent',
          color: active ? '#a78bfa' : 'var(--color-muted)',
          width: '100%',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(108,99,255,0.08)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text)';
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)';
          }
        }}
      >
        <Icon size={20} stroke={active ? 2 : 1.5} />
        <Text size="sm" fw={active ? 600 : 400} style={{ transition: 'all 0.15s' }}>
          {label}
        </Text>
      </UnstyledButton>
    </Tooltip>
  );
}

export default function Sidebar() {
  const router   = useRouter();
  const pathname = usePathname();
  const user     = useAuthStore((s) => s.user);
  const logout   = useAuthStore((s) => s.logout);

  function handleLogout() {
    logout();
    router.push('/');
  }

  return (
    <Box
      style={{
        width: 220,
        minHeight: '100vh',
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: rem(16),
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <Group gap="sm" mb="xl" style={{ padding: `${rem(4)} ${rem(4)}` }}>
        <Box
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6c63ff 0%, #a78bfa 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(108,99,255,0.35)',
            flexShrink: 0,
          }}
        >
          <IconBolt size={20} color="white" stroke={2.5} />
        </Box>
        <Box>
          <Text fw={700} size="sm" style={{ color: 'var(--color-text)', lineHeight: 1.2 }}>FixByte</Text>
          <Text size="xs" c="dimmed" style={{ lineHeight: 1.2 }}>CMMS</Text>
        </Box>
      </Group>

      {/* Nav */}
      <Stack gap={4} style={{ flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <SidebarLink
              key={item.href}
              icon={item.icon}
              label={item.label}
              active={active}
              onClick={() => router.push(item.href)}
            />
          );
        })}
      </Stack>

      {/* User */}
      <Divider my="sm" style={{ borderColor: 'var(--color-border)' }} />
      <Box>
        <Group gap="sm" mb="sm" style={{ padding: `${rem(4)} ${rem(4)}` }}>
          <Avatar size={32} radius="xl" color="violet">
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box style={{ overflow: 'hidden', flex: 1 }}>
            <Text size="xs" fw={600} style={{ color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </Text>
            <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.role}
            </Text>
          </Box>
        </Group>
        <UnstyledButton
          id="sidebar-logout"
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: rem(8),
            padding: `${rem(8)} ${rem(12)}`, borderRadius: rem(8),
            color: 'var(--color-muted)', width: '100%',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.08)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)';
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          <IconLogout size={16} />
          <Text size="sm">Sign out</Text>
        </UnstyledButton>
      </Box>
    </Box>
  );
}
