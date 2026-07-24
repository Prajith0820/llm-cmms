'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Title, Text, Group, Button, Table, TextInput, Stack, Center, Loader, ActionIcon, Menu, Badge
} from '@mantine/core';
import {
  IconSearch, IconPlus, IconDotsVertical, IconTrash, IconCircleCheck
} from '@tabler/icons-react';
import { getPMSchedules, deletePMSchedule, updatePMSchedule } from '@/lib/api';
import CreatePMModal from '@/components/CreatePMModal';
import { notifications } from '@mantine/notifications';

export default function PreventiveMaintenancePage() {
  const qc = useQueryClient();
  const [modalOpened, setModalOpened] = useState(false);
  const [search, setSearch] = useState('');

  const { data: res, isLoading } = useQuery({
    queryKey: ['pm-schedules'],
    queryFn: getPMSchedules,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePMSchedule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pm-schedules'] });
      notifications.show({ title: 'Schedule deleted', message: 'PM schedule deleted successfully.', color: 'teal' });
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to delete PM schedule.', color: 'red' });
    }
  });

  const completeMaintenanceMutation = useMutation({
    mutationFn: (pm: any) => {
      // Calculate next due date based on frequency
      const nextDate = new Date();
      if (pm.frequency === 'DAILY') nextDate.setDate(nextDate.getDate() + 1);
      else if (pm.frequency === 'WEEKLY') nextDate.setDate(nextDate.getDate() + 7);
      else if (pm.frequency === 'MONTHLY') nextDate.setDate(nextDate.getDate() + 30);
      else if (pm.frequency === 'QUARTERLY') nextDate.setDate(nextDate.getDate() + 90);
      else if (pm.frequency === 'HALF_YEARLY') nextDate.setDate(nextDate.getDate() + 182);
      else if (pm.frequency === 'YEARLY') nextDate.setDate(nextDate.getDate() + 365);
      else nextDate.setDate(nextDate.getDate() + 30);

      return updatePMSchedule(pm.id, {
        assetRestoredAt: new Date().toISOString(),
        nextDueDate: nextDate.toISOString()
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pm-schedules'] });
      notifications.show({ title: 'Maintenance Logged', message: 'Next maintenance date has been rescheduled.', color: 'teal' });
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to complete PM task.', color: 'red' });
    }
  });

  const schedules = res?.data || [];

  const filteredSchedules = schedules.filter((pm: any) => {
    return pm.title.toLowerCase().includes(search.toLowerCase()) ||
      (pm.asset?.assetName && pm.asset.assetName.toLowerCase().includes(search.toLowerCase()));
  });

  function getPMStatusBadge(nextMaintenanceStr: string) {
    const nextDate = new Date(nextMaintenanceStr);
    const today = new Date();
    
    // Difference in days
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <Badge color="red">Overdue</Badge>;
    } else if (diffDays <= 7) {
      return <Badge color="orange">Due Soon ({diffDays}d)</Badge>;
    } else {
      return <Badge color="teal">Active</Badge>;
    }
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
            PM Schedules
          </Title>
          <Text size="sm" c="dimmed">
            Set and track recurrent preventive maintenance rules for plant assets.
          </Text>
        </div>
        <Button
          id="btn-create-pm"
          leftSection={<IconPlus size={16} />}
          onClick={() => setModalOpened(true)}
          style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', border: 'none' }}
        >
          Schedule PM
        </Button>
      </Group>

      {/* Search */}
      <Card p="md" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <TextInput
          placeholder="Search by schedule title or asset name..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          styles={{ input: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' } }}
        />
      </Card>

      {/* Table */}
      <Card p="lg" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
        {isLoading ? (
          <Center py="xl">
            <Loader color="violet" size="lg" type="dots" />
          </Center>
        ) : filteredSchedules.length === 0 ? (
          <Text ta="center" py="xl" c="dimmed">No preventive maintenance schedules found.</Text>
        ) : (
          <Table verticalSpacing="md" highlightOnHover style={{ borderCollapse: 'collapse' }}>
            <Table.Thead>
              <Table.Tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Task Title</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Target Asset</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Frequency</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Last Performed</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Next Due</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Status</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600, textAlign: 'right' }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredSchedules.map((pm: any) => (
                <Table.Tr key={pm.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <Table.Td fw={600}>{pm.title}</Table.Td>
                  <Table.Td fw={600} c="violet.4">{pm.asset?.assetName}</Table.Td>
                  <Table.Td>{pm.frequency}</Table.Td>
                  <Table.Td>{pm.assetRestoredAt ? new Date(pm.assetRestoredAt).toLocaleDateString() : 'Never'}</Table.Td>
                  <Table.Td fw={600}>{new Date(pm.nextDueDate).toLocaleDateString()}</Table.Td>
                    <Table.Td>{getPMStatusBadge(pm.nextDueDate)}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Menu position="bottom-end" shadow="md">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray">
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown styles={{ dropdown: { background: 'var(--color-surface)', border: '1px solid var(--color-border)' } }}>
                        <Menu.Item
                          leftSection={<IconCircleCheck size={14} color="teal" />}
                          onClick={() => completeMaintenanceMutation.mutate(pm)}
                        >
                          Log Maintenance Performed
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={14} />}
                          onClick={() => {
                            if (confirm('Delete this PM schedule?')) deleteMutation.mutate(pm.id);
                          }}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      <CreatePMModal opened={modalOpened} onClose={() => setModalOpened(false)} />
    </Stack>
  );
}
