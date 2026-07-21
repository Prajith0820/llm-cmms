'use client';

import { Badge } from '@mantine/core';

const PRIORITY_CONFIG = {
  LOW:      { label: 'Low',      color: 'gray'   },
  MEDIUM:   { label: 'Medium',   color: 'blue'   },
  HIGH:     { label: 'High',     color: 'orange' },
  CRITICAL: { label: 'Critical', color: 'red'    },
} as const;

type PriorityKey = keyof typeof PRIORITY_CONFIG;

export default function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority as PriorityKey] ?? { label: priority, color: 'gray' };
  return (
    <Badge color={cfg.color} variant="light" size="sm" radius="sm">
      {cfg.label}
    </Badge>
  );
}
