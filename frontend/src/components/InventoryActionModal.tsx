'use client';

import { useState, useEffect } from 'react';
import {
  Modal, TextInput, Button, Stack, Group, NumberInput, Text
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueInventory, receiveInventory } from '@/lib/api';

interface Props {
  opened: boolean;
  onClose: () => void;
  inventoryId: string | null;
  itemName: string | null;
  action: 'issue' | 'receive' | null;
  maxQuantity?: number;
  unit?: string;
}

export default function InventoryActionModal({ opened, onClose, inventoryId, itemName, action, maxQuantity = 0, unit = 'pcs' }: Props) {
  const qc = useQueryClient();
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (opened) {
      setQuantity(1);
      setNotes('');
    }
  }, [opened]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { inventoryId: inventoryId!, quantity, notes };
      return action === 'issue' ? issueInventory(payload) : receiveInventory(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      notifications.show({
        title: action === 'issue' ? 'Stock Issued' : 'Stock Received',
        message: `${quantity} ${unit} of ${itemName} ${action === 'issue' ? 'issued' : 'received'} successfully.`,
        color: 'teal',
      });
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || 'Failed to complete transaction.';
      notifications.show({ title: 'Error', message: msg, color: 'red' });
    }
  });

  const inputStyles = {
    input: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' },
    label: { color: 'var(--color-muted)' }
  };

  const isIssue = action === 'issue';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${isIssue ? 'Issue' : 'Receive'} Stock - ${itemName}`}
      size="sm"
      styles={{
        content: { background: 'var(--color-surface)', border: '1px solid var(--color-border)' },
        header:  { background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' },
        title:   { fontWeight: 700, color: 'var(--color-text)' },
      }}
    >
      <Stack gap="sm">
        {isIssue && (
          <Text size="xs" c="dimmed">
            Available Stock: <Text span fw={600} c="violet.4">{maxQuantity} {unit}</Text>
          </Text>
        )}

        <NumberInput
          label="Quantity *"
          placeholder="Enter quantity"
          value={quantity}
          onChange={(v) => setQuantity(typeof v === 'number' ? v : 1)}
          min={1}
          max={isIssue ? maxQuantity : undefined}
          required
          styles={inputStyles}
        />

        <TextInput
          label="Notes / Reason"
          placeholder="e.g. Assigned to Work Order WO-2024-001"
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          styles={inputStyles}
        />

        <Group justify="flex-end" mt="sm">
          <Button variant="subtle" color="gray" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!inventoryId || quantity <= 0 || (isIssue && quantity > maxQuantity)}
            color={isIssue ? 'orange' : 'teal'}
          >
            {isIssue ? 'Issue Stock' : 'Receive Stock'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
