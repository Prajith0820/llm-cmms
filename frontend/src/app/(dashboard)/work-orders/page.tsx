'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Title, Text, Group, Button, Table, TextInput, Select, Stack, Center, Loader, ActionIcon, Menu, Badge
} from '@mantine/core';
import {
  IconSearch, IconPlus, IconDotsVertical, IconCheck, IconTrash, IconUser
} from '@tabler/icons-react';
import { getWorkOrders, updateWorkOrder, deleteWorkOrder, getTechnicians } from '@/lib/api';
import CreateWorkOrderModal from '@/components/CreateWorkOrderModal';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import { notifications } from '@mantine/notifications';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function WorkOrdersPage() {
  const qc = useQueryClient();
  const [modalOpened, setModalOpened] = useState(false);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: res, isLoading } = useQuery({
    queryKey: ['work-orders'],
    queryFn: getWorkOrders,
  });

  const { data: techRes } = useQuery({
    queryKey: ['technicians'],
    queryFn: getTechnicians,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateWorkOrder(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-orders'] });
      notifications.show({ title: 'Work Order Updated', message: 'The work order state has been updated.', color: 'teal' });
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to update work order.', color: 'red' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWorkOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-orders'] });
      notifications.show({ title: 'Work Order Deleted', message: 'Work order deleted successfully.', color: 'teal' });
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to delete work order.', color: 'red' });
    }
  });

  const workOrders = res?.data || [];
  const technicians = techRes?.data || [];

  const filteredWOs = workOrders.filter((wo: any) => {
    const matchesSearch = wo.title.toLowerCase().includes(search.toLowerCase()) ||
      wo.woNumber.toLowerCase().includes(search.toLowerCase()) ||
      (wo.asset?.name && wo.asset.name.toLowerCase().includes(search.toLowerCase()));

    const matchesPriority = !priorityFilter || wo.priority === priorityFilter;
    const matchesStatus = !statusFilter || wo.status === statusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
            Work Orders
          </Title>
          <Text size="sm" c="dimmed">
            Manage corrective, preventive, and inspection work tasks.
          </Text>
        </div>
        <Button
          id="btn-create-wo"
          leftSection={<IconPlus size={16} />}
          onClick={() => setModalOpened(true)}
          style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', border: 'none' }}
        >
          Create Work Order
        </Button>
      </Group>

      {/* Filters */}
      <Card p="md" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <Group grow>
          <TextInput
            placeholder="Search by title, number or asset..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            styles={{ input: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' } }}
          />
          <Select
            placeholder="Priority"
            data={PRIORITIES}
            value={priorityFilter}
            onChange={setPriorityFilter}
            clearable
            styles={{ input: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' } }}
          />
          <Select
            placeholder="Status"
            data={STATUSES}
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
            styles={{ input: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' } }}
          />
        </Group>
      </Card>

      {/* Work Orders Table */}
      <Card p="lg" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
        {isLoading ? (
          <Center py="xl">
            <Loader color="violet" size="lg" type="dots" />
          </Center>
        ) : filteredWOs.length === 0 ? (
          <Text ta="center" py="xl" c="dimmed">No work orders match current filters.</Text>
        ) : (
          <Table verticalSpacing="md" highlightOnHover style={{ borderCollapse: 'collapse' }}>
            <Table.Thead>
              <Table.Tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>WO #</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Title</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Asset</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Assigned To</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Priority</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Type</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Status</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600, textAlign: 'right' }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredWOs.map((wo: any) => (
                <Table.Tr key={wo.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <Table.Td fw={700} c="violet.4">{wo.woNumber}</Table.Td>
                  <Table.Td>{wo.title}</Table.Td>
                  <Table.Td fw={600}>{wo.asset?.name}</Table.Td>
                  <Table.Td>{wo.assignedTo?.name || 'Unassigned'}</Table.Td>
                  <Table.Td><PriorityBadge priority={wo.priority} /></Table.Td>
                  <Table.Td>
                    <Badge variant="outline" size="xs" color="gray">{wo.type}</Badge>
                  </Table.Td>
                  <Table.Td><StatusBadge status={wo.status} /></Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Menu position="bottom-end" shadow="md">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray">
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown styles={{ dropdown: { background: 'var(--color-surface)', border: '1px solid var(--color-border)' } }}>
                        {wo.status !== 'COMPLETED' && (
                          <Menu.Item
                            leftSection={<IconCheck size={14} color="teal" />}
                            onClick={() => updateMutation.mutate({ id: wo.id, data: { status: 'COMPLETED' } })}
                          >
                            Mark Completed
                          </Menu.Item>
                        )}
                        <Menu.Label>Assign Technician</Menu.Label>
                        {technicians.map((t: any) => (
                          <Menu.Item
                            key={t.id}
                            leftSection={<IconUser size={12} />}
                            onClick={() => updateMutation.mutate({ id: wo.id, data: { assignedToId: t.id, status: 'IN_PROGRESS' } })}
                          >
                            {t.name}
                          </Menu.Item>
                        ))}
                        <Menu.Divider />
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={14} />}
                          onClick={() => {
                            if (confirm('Delete this work order?')) deleteMutation.mutate(wo.id);
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

      <CreateWorkOrderModal opened={modalOpened} onClose={() => setModalOpened(false)} />
    </Stack>
  );
}
