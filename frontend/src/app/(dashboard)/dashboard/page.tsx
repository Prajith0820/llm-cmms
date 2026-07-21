'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Grid, Card, Text, Title, Group, Table, RingProgress, Badge, Progress, Stack, Box, Center, Loader
} from '@mantine/core';
import {
  IconEngine, IconClipboardList, IconCalendar, IconAlertTriangle, IconClock
} from '@tabler/icons-react';
import { getAssets, getWorkOrders, getInventory, getPMSchedules } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';

export default function DashboardPage() {
  const { data: assetsRes, isLoading: assetsLoading } = useQuery({ queryKey: ['assets'], queryFn: getAssets });
  const { data: woRes, isLoading: woLoading } = useQuery({ queryKey: ['work-orders'], queryFn: getWorkOrders });
  const { data: invRes, isLoading: invLoading } = useQuery({ queryKey: ['inventory'], queryFn: getInventory });
  const { data: pmRes, isLoading: pmLoading } = useQuery({ queryKey: ['pm-schedules'], queryFn: getPMSchedules });

  if (assetsLoading || woLoading || invLoading || pmLoading) {
    return (
      <Center style={{ minHeight: '80vh' }}>
        <Loader color="violet" size="xl" type="dots" />
      </Center>
    );
  }

  const assets = assetsRes?.data || [];
  const workOrders = woRes?.data || [];
  const inventory = invRes?.data || [];
  const pmSchedules = pmRes?.data || [];

  // KPI calculations
  const totalAssets = assets.length;
  const openWOs = workOrders.filter((w: any) => w.status === 'OPEN' || w.status === 'IN_PROGRESS').length;
  
  // PM Overdue (next maintenance is in the past)
  const today = new Date();
  const overduePMs = pmSchedules.filter((p: any) => new Date(p.nextMaintenance) < today).length;

  // Low stock
  const lowStock = inventory.filter((i: any) => i.quantity <= i.minQuantity).length;

  // Work Orders breakdown
  const statusCounts = workOrders.reduce((acc: any, cur: any) => {
    acc[cur.status] = (acc[cur.status] || 0) + 1;
    return acc;
  }, { OPEN: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 });

  const totalWOs = workOrders.length || 1;
  const openPct = Math.round((statusCounts.OPEN / totalWOs) * 100);
  const progressPct = Math.round((statusCounts.IN_PROGRESS / totalWOs) * 100);
  const completedPct = Math.round((statusCounts.COMPLETED / totalWOs) * 100);

  const recentWOs = workOrders.slice(0, 5);

  const kpis = [
    { title: 'Total Assets', value: totalAssets, icon: IconEngine, color: 'violet', desc: 'Tracked machinery & components' },
    { title: 'Active Work Orders', value: openWOs, icon: IconClipboardList, color: 'blue', desc: 'Open and In Progress orders' },
    { title: 'Overdue PM Tasks', value: overduePMs, icon: IconCalendar, color: 'red', desc: 'Schedules past target date' },
    { title: 'Low Stock Parts', value: lowStock, icon: IconAlertTriangle, color: 'orange', desc: 'Items under min quantity threshold' },
  ];

  return (
    <Stack gap="xl">
      <div>
        <Title order={1} style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
          Dashboard Overview
        </Title>
        <Text size="sm" c="dimmed">
          Real-time maintenance stats, schedule status, and action items.
        </Text>
      </div>

      {/* KPI Cards Grid */}
      <Grid>
        {kpis.map((kpi, idx) => (
          <Grid.Col key={idx} span={{ base: 12, sm: 6, lg: 3 }}>
            <Card
              p="lg"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Group justify="space-between">
                <div>
                  <Text size="xs" fw={700} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {kpi.title}
                  </Text>
                  <Text size="2rem" fw={800} mt="xs" style={{ lineHeight: 1 }}>
                    {kpi.value}
                  </Text>
                </div>
                <ThemeIconBox color={kpi.color}>
                  <kpi.icon size={24} stroke={1.5} />
                </ThemeIconBox>
              </Group>
              <Text size="xs" c="dimmed" mt="md">
                {kpi.desc}
              </Text>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {/* Breakdown and Recent activity */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card
            p="lg"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              height: '100%'
            }}
          >
            <Title order={3} size="h4" mb="lg">Work Order Breakdown</Title>
            <Stack gap="md">
              <div>
                <Group justify="space-between" mb={6}>
                  <Text size="sm" fw={600}>Completed</Text>
                  <Text size="sm" c="dimmed">{statusCounts.COMPLETED} ({completedPct}%)</Text>
                </Group>
                <Progress value={completedPct} color="teal" size="sm" radius="xl" />
              </div>
              
              <div>
                <Group justify="space-between" mb={6}>
                  <Text size="sm" fw={600}>In Progress</Text>
                  <Text size="sm" c="dimmed">{statusCounts.IN_PROGRESS} ({progressPct}%)</Text>
                </Group>
                <Progress value={progressPct} color="orange" size="sm" radius="xl" />
              </div>

              <div>
                <Group justify="space-between" mb={6}>
                  <Text size="sm" fw={600}>Open</Text>
                  <Text size="sm" c="dimmed">{statusCounts.OPEN} ({openPct}%)</Text>
                </Group>
                <Progress value={openPct} color="blue" size="sm" radius="xl" />
              </div>

              <Box mt="lg" p="md" style={{ background: 'var(--color-surface-2)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <Group gap="xs">
                  <IconClock size={16} color="var(--color-muted)" />
                  <Text size="xs" c="dimmed">
                    Keep your completion rate high to ensure plant efficiency.
                  </Text>
                </Group>
              </Box>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card
            p="lg"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              height: '100%',
              overflowX: 'auto'
            }}
          >
            <Title order={3} size="h4" mb="lg">Recent Work Orders</Title>
            {recentWOs.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">No work orders found.</Text>
            ) : (
              <Table verticalSpacing="sm" style={{ borderCollapse: 'collapse' }}>
                <Table.Thead>
                  <Table.Tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>WO #</Table.Th>
                    <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Title</Table.Th>
                    <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Asset</Table.Th>
                    <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Priority</Table.Th>
                    <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {recentWOs.map((wo: any) => (
                    <Table.Tr key={wo.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <Table.Td fw={700} c="violet.4">{wo.woNumber}</Table.Td>
                      <Table.Td>{wo.title}</Table.Td>
                      <Table.Td>{wo.asset?.name}</Table.Td>
                      <Table.Td><PriorityBadge priority={wo.priority} /></Table.Td>
                      <Table.Td><StatusBadge status={wo.status} /></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

function ThemeIconBox({ children, color }: { children: React.ReactNode; color: string }) {
  const colorMap: any = {
    violet: 'rgba(108, 99, 255, 0.15)',
    blue: 'rgba(59, 130, 246, 0.15)',
    red: 'rgba(239, 68, 68, 0.15)',
    orange: 'rgba(249, 115, 22, 0.15)',
  };
  const iconColor: any = {
    violet: '#a78bfa',
    blue: '#60a5fa',
    red: '#f87171',
    orange: '#fb923c',
  };

  return (
    <Box
      style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: colorMap[color] || 'rgba(128,128,128,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: iconColor[color] || '#9ca3af',
      }}
    >
      {children}
    </Box>
  );
}
