'use client';

import { useState } from 'react';
import {
  Modal, TextInput, Textarea, Select, Button, Stack, Group
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createAsset } from '@/lib/api';

interface Props {
  opened: boolean;
  onClose: () => void;
}

const CATEGORIES = ['Pump', 'Generator', 'Compressor', 'HVAC', 'Conveyor', 'Motor', 'Boiler', 'Fan', 'Valve', 'Other'];

export default function CreateAssetModal({ opened, onClose }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '', category: '', location: '', manufacturer: '', serialNumber: '', description: ''
  });

  const mutation = useMutation({
    mutationFn: () => createAsset(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      notifications.show({ title: 'Asset created', message: `${form.name} added successfully.`, color: 'teal' });
      setForm({ name: '', category: '', location: '', manufacturer: '', serialNumber: '', description: '' });
      onClose();
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to create asset.', color: 'red' });
    }
  });

  function set(key: string, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  const inputStyles = {
    input: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' },
    label: { color: 'var(--color-muted)' }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Create New Asset"
      size="md"
      styles={{
        content: { background: 'var(--color-surface)', border: '1px solid var(--color-border)' },
        header:  { background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' },
        title:   { fontWeight: 700, color: 'var(--color-text)' },
      }}
    >
      <Stack gap="sm">
        <TextInput
          label="Asset Name *"
          placeholder="e.g. Centrifugal Pump CP-101"
          value={form.name}
          onChange={(e) => set('name', e.currentTarget.value)}
          required
          styles={inputStyles}
        />
        <Select
          label="Category *"
          placeholder="Select category"
          data={CATEGORIES}
          value={form.category}
          onChange={(v) => set('category', v || '')}
          required
          styles={inputStyles}
        />
        <TextInput
          label="Location"
          placeholder="e.g. Plant A - Building 1"
          value={form.location}
          onChange={(e) => set('location', e.currentTarget.value)}
          styles={inputStyles}
        />
        <Group grow>
          <TextInput
            label="Manufacturer"
            placeholder="e.g. Grundfos"
            value={form.manufacturer}
            onChange={(e) => set('manufacturer', e.currentTarget.value)}
            styles={inputStyles}
          />
          <TextInput
            label="Serial Number"
            placeholder="e.g. GF-2021-001"
            value={form.serialNumber}
            onChange={(e) => set('serialNumber', e.currentTarget.value)}
            styles={inputStyles}
          />
        </Group>
        <Textarea
          label="Description"
          placeholder="Brief description of the asset..."
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
            disabled={!form.name || !form.category}
            style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', border: 'none' }}
          >
            Create Asset
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
