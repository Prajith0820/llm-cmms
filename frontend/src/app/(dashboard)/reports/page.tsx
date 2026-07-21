'use client';

import { useState } from 'react';
import {
  Card, Title, Text, Group, Button, Grid, Stack
} from '@mantine/core';
import {
  IconFileText, IconDownload
} from '@tabler/icons-react';
import { downloadMonthlyReport, downloadWorkOrdersReport } from '@/lib/api';
import { notifications } from '@mantine/notifications';

export default function ReportsPage() {
  const [downloadingMonthly, setDownloadingMonthly] = useState(false);
  const [downloadingWOs, setDownloadingWOs] = useState(false);

  const handleDownload = async (downloadFn: () => Promise<any>, filename: string, setStatus: (s: boolean) => void) => {
    setStatus(true);
    try {
      const res = await downloadFn();
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      notifications.show({ title: 'Success', message: `${filename} downloaded successfully.`, color: 'teal' });
    } catch (err: any) {
      console.error(err);
      notifications.show({ title: 'Error', message: 'Failed to generate and download PDF report.', color: 'red' });
    } finally {
      setStatus(false);
    }
  };

  const reportsList = [
    {
      title: 'Monthly Maintenance Report',
      description: 'Generates a PDF summarizing total assets, work orders completed, open backlog, and low stock inventory warnings for the current month.',
      filename: 'monthly_maintenance_report.pdf',
      downloadFn: downloadMonthlyReport,
      loading: downloadingMonthly,
      setLoading: setDownloadingMonthly,
    },
    {
      title: 'Work Orders Registry Report',
      description: 'Exports a detailed list of all logged work orders, current statuses, assigned technicians, priorities, and creation timestamps.',
      filename: 'work_orders_report.pdf',
      downloadFn: downloadWorkOrdersReport,
      loading: downloadingWOs,
      setLoading: setDownloadingWOs,
    }
  ];

  return (
    <Stack gap="xl">
      <div>
        <Title order={1} style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
          PDF Reports
        </Title>
        <Text size="sm" c="dimmed">
          Download PDF format reporting metrics for logs, audits, or monthly status meetings.
        </Text>
      </div>

      <Grid>
        {reportsList.map((rep, idx) => (
          <Grid.Col key={idx} span={{ base: 12, md: 6 }}>
            <Card
              p="xl"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%'
              }}
            >
              <div>
                <Group gap="xs" mb="sm">
                  <IconFileText size={24} color="#a78bfa" />
                  <Title order={3} size="h4">{rep.title}</Title>
                </Group>
                <Text size="sm" c="dimmed" mb="xl">
                  {rep.description}
                </Text>
              </div>

              <Button
                variant="light"
                color="violet"
                fullWidth
                leftSection={<IconDownload size={16} />}
                loading={rep.loading}
                onClick={() => handleDownload(rep.downloadFn, rep.filename, rep.setLoading)}
              >
                Generate & Download PDF
              </Button>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  );
}
