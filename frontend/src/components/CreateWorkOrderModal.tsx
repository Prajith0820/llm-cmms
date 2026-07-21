'use client';

import { useState } from 'react';
import {
  Modal, TextInput, Textarea, Select, Button, Stack, Group
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createWorkOrder, getAssets, getTechnicians } from '@/lib/api';

interface Props {
  opened: boolean;
  onClose: () => void;
  preselectedAssetId?: string | null;
}

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const TYPES = ['CORRECTIVE', 'PREVENTIVE', 'INSPECTION'];

export default function CreateWorkOrderModal({ opened, onClose, preselectedAssetId }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    type: 'CORRECTIVE',
    assetId: '',
    assignedToId: '',
  });

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  });

  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: getTechnicians,
  });

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        assetId: preselectedAssetId || form.assetId,
        assignedToId: form.assignedToId || null,
      };
      return createWorkOrder(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-orders'] });
      qc.invalidateQueries({ queryKey: ['assets'] });
      notifications.show({ title: 'Work Order created', message: 'Work order added successfully.', color: 'teal' });
      setForm({
        title: '',
        description: '',
        priority: 'MEDIUM',
        type: 'CORRECTIVE',
        assetId: '',
        assignedToId: '',
      });
      onClose();
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to create work order.', color: 'red' });
    }
  });

  function set(key: string, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  const assetOptions = assets?.data.map((a: any) => ({ value: a.id, label: a.name })) || [];
  const techOptions = technicians?.data.map((t: any) => ({ value: t.id, label: t.name })) || [];

  const inputStyles = {
    input: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' },
    label: { color: 'var(--color-muted)' }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Create Work Order"
      size="md"
      styles={{
        content: { background: 'var(--color-surface)', border: '1px solid var(--color-border)' },
        header:  { background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' },
        title:   { fontWeight: 700, color: 'var(--color-text)' },
      }}
    >
      <Stack gap="sm">
        <TextInput
          label="Title *"
          placeholder="e.g. Repair water leak"
          value={form.title}
          onChange={(e) => set('title', e.currentTarget.value)}
          required
          styles={inputStyles}
        />
        
        {!preselectedAssetId && (
          <Select
            label="Asset *"
            placeholder="Select asset"
            data={assetOptions}
            value={form.assetId}
            onChange={(v) => set('assetId', v || '')}
            required
            searchable
            styles={inputStyles}
          />
        )}

        <Group grow>
          <Select
            label="Priority *"
            placeholder="Select priority"
            data={PRIORITIES}
            value={form.priority}
            onChange={(v) => set('priority', v || 'MEDIUM')}
            required
            styles={inputStyles}
          />
          <Select
            label="Type *"
            placeholder="Select type"
            data={TYPES}
            value={form.type}
            onChange={(v) => set('type', v || 'CORRECTIVE')}
            required
            styles={inputStyles}
          />
        </Group>

        <Select
          label="Assign Technician"
          placeholder="Select technician (optional)"
          data={techOptions}
          value={form.assignedToId}
          onChange={(v) => set('assignedToId', v || '')}
          clearable
          styles={inputStyles}
        />

        <Textarea
          label="Description"
          placeholder="Details about the work order..."
          rows={3}
          value={form.description}
          onChange={(e) => set('description', e.currentTarget.value)}
          styles={inputStyles}
        />

        <Group justify="flex-end" mt="sm">
          <Button variant="subtle" color="gray" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!form.title || (!preselectedAssetId && !form.assetId)}
            style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', border: 'none' }}
          >
            Create Work Order
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
