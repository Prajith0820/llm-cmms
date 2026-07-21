'use client';

import { useState } from 'react';
import {
  Modal, TextInput, Textarea, Select, Button, Stack, Group, NumberInput
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPMSchedule, getAssets } from '@/lib/api';

interface Props {
  opened: boolean;
  onClose: () => void;
  preselectedAssetId?: string | null;
}

export default function CreatePMModal({ opened, onClose, preselectedAssetId }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    frequencyDays: 30,
    startDate: new Date().toISOString().split('T')[0],
    assetId: '',
  });

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  });

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        assetId: preselectedAssetId || form.assetId,
      };
      return createPMSchedule(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pm-schedules'] });
      qc.invalidateQueries({ queryKey: ['assets'] });
      notifications.show({ title: 'PM Schedule created', message: 'Preventive maintenance schedule added successfully.', color: 'teal' });
      setForm({
        title: '',
        description: '',
        frequencyDays: 30,
        startDate: new Date().toISOString().split('T')[0],
        assetId: '',
      });
      onClose();
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to create PM schedule.', color: 'red' });
    }
  });

  function set(key: string, val: any) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  const assetOptions = assets?.data.map((a: any) => ({ value: a.id, label: a.name })) || [];

  const inputStyles = {
    input: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' },
    label: { color: 'var(--color-muted)' }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Schedule Preventive Maintenance"
      size="md"
      styles={{
        content: { background: 'var(--color-surface)', border: '1px solid var(--color-border)' },
        header:  { background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' },
        title:   { fontWeight: 700, color: 'var(--color-text)' },
      }}
    >
      <Stack gap="sm">
        <TextInput
          label="PM Task Title *"
          placeholder="e.g. Monthly Lubrication"
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
          <NumberInput
            label="Frequency (Days) *"
            placeholder="e.g. 30"
            value={form.frequencyDays}
            onChange={(v) => set('frequencyDays', typeof v === 'number' ? v : 30)}
            min={1}
            required
            styles={inputStyles}
          />
          <TextInput
            label="Start Date *"
            type="date"
            value={form.startDate}
            onChange={(e) => set('startDate', e.currentTarget.value)}
            required
            styles={inputStyles}
          />
        </Group>

        <Textarea
          label="Description"
          placeholder="Maintenance checklist or instructions..."
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
            Create Schedule
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
