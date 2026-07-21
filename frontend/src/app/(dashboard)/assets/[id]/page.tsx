'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, Grid, Title, Text, Group, Button, Tabs, Stack, Table, Center, Loader, Badge, ActionIcon, Menu, Box
} from '@mantine/core';
import {
  IconArrowLeft, IconRobot, IconPlus, IconCalendar, IconQrcode,
  IconTools, IconHistory, IconDotsVertical, IconTrash
} from '@tabler/icons-react';
import { QRCodeSVG } from 'qrcode.react';
import { getAsset, updateAsset, deleteAsset } from '@/lib/api';
import { useContextStore } from '@/store/contextStore';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import CreateWorkOrderModal from '@/components/CreateWorkOrderModal';
import CreatePMModal from '@/components/CreatePMModal';
import { notifications } from '@mantine/notifications';

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const assetId = params.id as string;

  const setAssetContext = useContextStore((s) => s.setAssetContext);

  const [woModalOpened, setWoModalOpened] = useState(false);
  const [pmModalOpened, setPmModalOpened] = useState(false);

  const { data: res, isLoading } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: () => getAsset(assetId),
    enabled: !!assetId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: 'OPERATIONAL' | 'DOWN' | 'MAINTENANCE') => updateAsset(assetId, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset', assetId] });
      notifications.show({ title: 'Status updated', message: 'Asset status has been changed.', color: 'teal' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAsset(assetId),
    onSuccess: () => {
      notifications.show({ title: 'Asset deleted', message: 'Asset removed successfully.', color: 'teal' });
      router.push('/assets');
    }
  });

  if (isLoading) {
    return (
      <Center style={{ minHeight: '80vh' }}>
        <Loader color="violet" size="xl" type="dots" />
      </Center>
    );
  }

  const asset = res?.data;
  if (!asset) {
    return (
      <Center style={{ minHeight: '80vh' }}>
        <Stack align="center">
          <Text c="dimmed">Asset not found.</Text>
          <Button variant="subtle" onClick={() => router.push('/assets')}>Back to Register</Button>
        </Stack>
      </Center>
    );
  }

  function handleAskAI() {
    setAssetContext(asset.id, asset.name);
    notifications.show({
      title: 'Context Linked',
      message: `AI assistant is now context-aware of: ${asset.name}`,
      color: 'violet',
    });
    router.push('/chat');
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const assetUrl = `${origin}/assets/${asset.id}`;

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Button
          variant="subtle"
          color="gray"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => router.push('/assets')}
        >
          Back to Register
        </Button>
        <Group gap="xs">
          <Button
            leftSection={<IconRobot size={16} />}
            variant="light"
            color="violet"
            onClick={handleAskAI}
          >
            Ask AI about this Asset
          </Button>

          <Menu position="bottom-end" shadow="md">
            <Menu.Target>
              <ActionIcon variant="outline" color="gray" size="lg">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown styles={{ dropdown: { background: 'var(--color-surface)', border: '1px solid var(--color-border)' } }}>
              <Menu.Label>Set Status</Menu.Label>
              <Menu.Item onClick={() => updateStatusMutation.mutate('OPERATIONAL')}>Operational</Menu.Item>
              <Menu.Item onClick={() => updateStatusMutation.mutate('MAINTENANCE')}>Maintenance</Menu.Item>
              <Menu.Item onClick={() => updateStatusMutation.mutate('DOWN')} color="red">Down</Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => {
                  if (confirm('Are you sure you want to delete this asset?')) {
                    deleteMutation.mutate();
                  }
                }}
              >
                Delete Asset
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {/* Asset Header Info */}
      <Card p="xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <Grid align="center">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Group gap="md" mb="xs">
              <Title order={1} style={{ fontSize: '2rem', color: 'var(--color-text)' }}>{asset.name}</Title>
              <StatusBadge status={asset.status} />
            </Group>
            <Text c="dimmed" size="sm" mb="md">{asset.description || 'No description provided.'}</Text>
            
            <Grid>
              <Grid.Col span={6}>
                <Text size="xs" c="muted">CATEGORY</Text>
                <Text fw={600} size="sm">{asset.category}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="muted">LOCATION</Text>
                <Text fw={600} size="sm">{asset.location || '—'}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="muted">MANUFACTURER</Text>
                <Text fw={600} size="sm">{asset.manufacturer || '—'}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="muted">SERIAL NUMBER</Text>
                <Text fw={600} size="sm" style={{ fontFamily: 'monospace' }}>{asset.serialNumber || '—'}</Text>
              </Grid.Col>
            </Grid>
          </Grid.Col>

          {/* QR Code Container */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Center>
              <Stack align="center" gap="xs">
                <Box p="sm" style={{ background: 'white', borderRadius: 12, display: 'inline-block' }}>
                  <QRCodeSVG value={assetUrl} size={120} />
                </Box>
                <Text size="xs" c="dimmed" ta="center">
                  Scan QR to inspect or log work orders for this asset.
                </Text>
              </Stack>
            </Center>
          </Grid.Col>
        </Grid>
      </Card>

      {/* Details Tabs */}
      <Tabs defaultValue="work-orders" color="violet">
        <Tabs.List style={{ borderBottom: '1px solid var(--color-border)' }}>
          <Tabs.Tab value="work-orders" leftSection={<IconTools size={16} />}>Work Orders</Tabs.Tab>
          <Tabs.Tab value="preventive" leftSection={<IconCalendar size={16} />}>Preventive Maintenance</Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>Maintenance Log</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="work-orders" pt="lg">
          <Card p="md" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <Group justify="space-between" mb="lg">
              <Title order={3} size="h4">Work Orders</Title>
              <Button
                leftSection={<IconPlus size={16} />}
                size="xs"
                onClick={() => setWoModalOpened(true)}
                style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', border: 'none' }}
              >
                New Work Order
              </Button>
            </Group>

            {asset.workOrders?.length === 0 ? (
              <Text py="xl" ta="center" c="dimmed">No work orders recorded for this asset.</Text>
            ) : (
              <Table verticalSpacing="sm" style={{ borderCollapse: 'collapse' }}>
                <Table.Thead>
                  <Table.Tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>WO #</Table.Th>
                    <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Title</Table.Th>
                    <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Assigned To</Table.Th>
                    <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Priority</Table.Th>
                    <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {asset.workOrders?.map((wo: any) => (
                    <Table.Tr key={wo.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <Table.Td fw={700} c="violet.4">{wo.woNumber}</Table.Td>
                      <Table.Td>{wo.title}</Table.Td>
                      <Table.Td>{wo.assignedTo?.name || 'Unassigned'}</Table.Td>
                      <Table.Td><PriorityBadge priority={wo.priority} /></Table.Td>
                      <Table.Td><StatusBadge status={wo.status} /></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="preventive" pt="lg">
          <Card p="md" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <Group justify="space-between" mb="lg">
              <Title order={3} size="h4">Preventive Maintenance Schedules</Title>
              <Button
                leftSection={<IconPlus size={16} />}
                size="xs"
                onClick={() => setPmModalOpened(true)}
                style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', border: 'none' }}
              >
                Schedule PM
              </Button>
            </Group>

            {asset.preventiveMaintenances?.length === 0 ? (
              <Text py="xl" ta="center" c="dimmed">No PM schedules for this asset.</Text>
            ) : (
              <Table verticalSpacing="sm" style={{ borderCollapse: 'collapse' }}>
                <Table.Thead>
                  <Table.Tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Task Title</Table.Th>
                    <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Frequency</Table.Th>
                    <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Last Maintenance</Table.Th>
                    <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Next Maintenance</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {asset.preventiveMaintenances?.map((pm: any) => (
                    <Table.Tr key={pm.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <Table.Td fw={600}>{pm.title}</Table.Td>
                      <Table.Td>Every {pm.frequencyDays} days</Table.Td>
                      <Table.Td>{pm.lastMaintenance ? new Date(pm.lastMaintenance).toLocaleDateString() : 'Never'}</Table.Td>
                      <Table.Td fw={600} c={new Date(pm.nextMaintenance) < new Date() ? 'red.5' : 'var(--color-text)'}>
                        {new Date(pm.nextMaintenance).toLocaleDateString()}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="history" pt="lg">
          <Card p="md" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <Title order={3} size="h4" mb="lg">Maintenance Log</Title>
            {asset.maintenanceHistories?.length === 0 ? (
              <Text py="xl" ta="center" c="dimmed">No historic entries recorded yet.</Text>
            ) : (
              <Table verticalSpacing="sm" style={{ borderCollapse: 'collapse' }}>
                <Table.Thead>
                  <Table.Tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Date</Table.Th>
                    <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Description</Table.Th>
                    <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Performed By</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {asset.maintenanceHistories?.map((log: any) => (
                    <Table.Tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <Table.Td>{new Date(log.date).toLocaleDateString()}</Table.Td>
                      <Table.Td>{log.description}</Table.Td>
                      <Table.Td>{log.performedBy || '—'}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Tabs.Panel>
      </Tabs>

      <CreateWorkOrderModal
        opened={woModalOpened}
        onClose={() => setWoModalOpened(false)}
        preselectedAssetId={asset.id}
      />
      <CreatePMModal
        opened={pmModalOpened}
        onClose={() => setPmModalOpened(false)}
        preselectedAssetId={asset.id}
      />
    </Stack>
  );
}
