'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Title, Text, Group, Button, Table, TextInput, Stack, Center, Loader, Badge, ActionIcon, Modal, NumberInput
} from '@mantine/core';
import {
  IconSearch, IconPlus, IconMinus, IconArrowDownLeft, IconArrowUpRight
} from '@tabler/icons-react';
import { getInventory, createInventory } from '@/lib/api';
import InventoryActionModal from '@/components/InventoryActionModal';
import { notifications } from '@mantine/notifications';

export default function InventoryPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  // Part Action Modal state
  const [actionModalOpened, setActionModalOpened] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string; quantity: number; unit: string; action: 'issue' | 'receive' } | null>(null);

  // New Part Modal state
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [newPart, setNewPart] = useState({ name: '', description: '', quantity: 0, unit: 'pcs', minQuantity: 5 });

  const { data: res, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: getInventory,
  });

  const createPartMutation = useMutation({
    mutationFn: () => createInventory(newPart),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      notifications.show({ title: 'Success', message: 'New inventory item added.', color: 'teal' });
      setNewPart({ name: '', description: '', quantity: 0, unit: 'pcs', minQuantity: 5 });
      setCreateModalOpened(false);
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to create inventory item.', color: 'red' });
    }
  });

  const items = res?.data || [];

  const filteredItems = items.filter((item: any) => {
    return item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
  });

  function openActionModal(item: any, action: 'issue' | 'receive') {
    setSelectedItem({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      action,
    });
    setActionModalOpened(true);
  }

  const inputStyles = {
    input: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' },
    label: { color: 'var(--color-muted)' }
  };

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
            Inventory Management
          </Title>
          <Text size="sm" c="dimmed">
            Manage spare parts, lubrications, tools, and materials stock registry.
          </Text>
        </div>
        <Button
          id="btn-create-part"
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModalOpened(true)}
          style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', border: 'none' }}
        >
          Add New Part
        </Button>
      </Group>

      {/* Search */}
      <Card p="md" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <TextInput
          placeholder="Search by part name or description..."
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
        ) : filteredItems.length === 0 ? (
          <Text ta="center" py="xl" c="dimmed">No inventory items found.</Text>
        ) : (
          <Table verticalSpacing="md" highlightOnHover style={{ borderCollapse: 'collapse' }}>
            <Table.Thead>
              <Table.Tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Part Name</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Description</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>In Stock</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Min Stock Threshold</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Status</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredItems.map((item: any) => {
                const isLowStock = item.quantity <= item.minQuantity;
                return (
                  <Table.Tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <Table.Td fw={600}>{item.name}</Table.Td>
                    <Table.Td>{item.description || '—'}</Table.Td>
                    <Table.Td fw={700}>
                      {item.quantity} {item.unit}
                    </Table.Td>
                    <Table.Td c="dimmed">
                      {item.minQuantity} {item.unit}
                    </Table.Td>
                    <Table.Td>
                      {isLowStock ? (
                        <Badge color="red" variant="light">Low Stock</Badge>
                      ) : (
                        <Badge color="teal" variant="light">In Stock</Badge>
                      )}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Group gap="xs" justify="flex-end">
                        <Button
                          variant="light"
                          color="teal"
                          size="xs"
                          leftSection={<IconArrowDownLeft size={14} />}
                          onClick={() => openActionModal(item, 'receive')}
                        >
                          Receive
                        </Button>
                        <Button
                          variant="light"
                          color="orange"
                          size="xs"
                          leftSection={<IconArrowUpRight size={14} />}
                          disabled={item.quantity <= 0}
                          onClick={() => openActionModal(item, 'issue')}
                        >
                          Issue
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      {/* Part Transaction Modal (Issue/Receive) */}
      <InventoryActionModal
        opened={actionModalOpened}
        onClose={() => setActionModalOpened(false)}
        inventoryId={selectedItem?.id || null}
        itemName={selectedItem?.name || null}
        action={selectedItem?.action || null}
        maxQuantity={selectedItem?.quantity}
        unit={selectedItem?.unit}
      />

      {/* Add New Part Modal */}
      <Modal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        title="Add New Inventory Part"
        size="sm"
        styles={{
          content: { background: 'var(--color-surface)', border: '1px solid var(--color-border)' },
          header:  { background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' },
          title:   { fontWeight: 700, color: 'var(--color-text)' },
        }}
      >
        <Stack gap="sm">
          <TextInput
            label="Part Name *"
            placeholder="e.g. V-Belt A60"
            value={newPart.name}
            onChange={(e) => setNewPart((p) => ({ ...p, name: e.currentTarget.value }))}
            required
            styles={inputStyles}
          />
          <TextInput
            label="Description"
            placeholder="e.g. Heavy duty rubber conveyor belt"
            value={newPart.description}
            onChange={(e) => setNewPart((p) => ({ ...p, description: e.currentTarget.value }))}
            styles={inputStyles}
          />
          <Group grow>
            <NumberInput
              label="Initial Quantity"
              value={newPart.quantity}
              onChange={(v) => setNewPart((p) => ({ ...p, quantity: typeof v === 'number' ? v : 0 }))}
              min={0}
              styles={inputStyles}
            />
            <TextInput
              label="Unit"
              placeholder="pcs, liters, sets"
              value={newPart.unit}
              onChange={(e) => setNewPart((p) => ({ ...p, unit: e.currentTarget.value }))}
              styles={inputStyles}
            />
          </Group>
          <NumberInput
            label="Min Stock Warning Threshold"
            value={newPart.minQuantity}
            onChange={(v) => setNewPart((p) => ({ ...p, minQuantity: typeof v === 'number' ? v : 5 }))}
            min={0}
            styles={inputStyles}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="subtle" color="gray" onClick={() => setCreateModalOpened(false)}>Cancel</Button>
            <Button
              onClick={() => createPartMutation.mutate()}
              loading={createPartMutation.isPending}
              disabled={!newPart.name}
              style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', border: 'none' }}
            >
              Add Part
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
