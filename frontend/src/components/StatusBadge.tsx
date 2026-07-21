'use client';

import { Badge } from '@mantine/core';

const STATUS_CONFIG = {
  OPERATIONAL: { label: 'Operational', color: 'teal' },
  DOWN:        { label: 'Down',        color: 'red'  },
  MAINTENANCE: { label: 'Maintenance', color: 'yellow'},
  OPEN:        { label: 'Open',        color: 'blue' },
  IN_PROGRESS: { label: 'In Progress', color: 'orange'},
  COMPLETED:   { label: 'Completed',   color: 'teal' },
  CANCELLED:   { label: 'Cancelled',   color: 'gray' },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as StatusKey] ?? { label: status, color: 'gray' };
  return (
    <Badge color={cfg.color} variant="light" size="sm" radius="sm">
      {cfg.label}
    </Badge>
  );
}
