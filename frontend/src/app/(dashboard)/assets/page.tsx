'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Table, Card, Title, Text, Group, Button, TextInput, Select, Stack, Center, Loader, Badge
} from '@mantine/core';
import { IconSearch, IconPlus, IconEye } from '@tabler/icons-react';
import { getAssets } from '@/lib/api';
import CreateAssetModal from '@/components/CreateAssetModal';
import StatusBadge from '@/components/StatusBadge';

export default function AssetsPage() {
  const router = useRouter();
  const [modalOpened, setModalOpened] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const { data: res, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  });

  const assets = res?.data || [];

  // Filter items
  const filteredAssets = assets.filter((asset: any) => {
    const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase()) ||
      (asset.location && asset.location.toLowerCase().includes(search.toLowerCase())) ||
      (asset.serialNumber && asset.serialNumber.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = !categoryFilter || asset.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Extract unique categories
  const categories = Array.from(new Set(assets.map((a: any) => a.category))) as string[];

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
            Asset Register
          </Title>
          <Text size="sm" c="dimmed">
            Manage your physical plant machinery, utility blocks, and hardware assets.
          </Text>
        </div>
        <Button
          id="btn-create-asset"
          leftSection={<IconPlus size={16} />}
          onClick={() => setModalOpened(true)}
          style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', border: 'none' }}
        >
          Add Asset
        </Button>
      </Group>

      {/* Filters & Search */}
      <Card p="md" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <Group grow>
          <TextInput
            placeholder="Search assets by name, location, or serial..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            styles={{
              input: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }
            }}
          />
          <Select
            placeholder="Filter by category"
            data={categories}
            value={categoryFilter}
            onChange={setCategoryFilter}
            clearable
            styles={{
              input: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }
            }}
          />
        </Group>
      </Card>

      {/* Assets Table */}
      <Card p="lg" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
        {isLoading ? (
          <Center py="xl">
            <Loader color="violet" size="lg" type="dots" />
          </Center>
        ) : filteredAssets.length === 0 ? (
          <Text ta="center" py="xl" c="dimmed">
            No assets found matching filters.
          </Text>
        ) : (
          <Table verticalSpacing="md" highlightOnHover style={{ borderCollapse: 'collapse' }}>
            <Table.Thead>
              <Table.Tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Name</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Category</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Location</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Manufacturer</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Serial Number</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Status</Table.Th>
                <Table.Th style={{ color: 'var(--color-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredAssets.map((asset: any) => (
                <Table.Tr
                  key={asset.id}
                  style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                  onClick={() => router.push(`/assets/${asset.id}`)}
                >
                  <Table.Td fw={600} c="var(--color-text)">{asset.name}</Table.Td>
                  <Table.Td>
                    <Badge variant="outline" color="violet" size="sm">{asset.category}</Badge>
                  </Table.Td>
                  <Table.Td>{asset.location || '—'}</Table.Td>
                  <Table.Td>{asset.manufacturer || '—'}</Table.Td>
                  <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{asset.serialNumber || '—'}</Text></Table.Td>
                  <Table.Td><StatusBadge status={asset.status} /></Table.Td>
                  <Table.Td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="subtle"
                      color="violet"
                      size="xs"
                      leftSection={<IconEye size={14} />}
                      onClick={() => router.push(`/assets/${asset.id}`)}
                    >
                      View
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      <CreateAssetModal opened={modalOpened} onClose={() => setModalOpened(false)} />
    </Stack>
  );
}
