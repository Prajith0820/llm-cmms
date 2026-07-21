'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Card, Title, Text, Group, Button, TextInput, Textarea, Stack, Center, Loader, Box, Avatar, ActionIcon, Alert
} from '@mantine/core';
import {
  IconSend, IconRobot, IconUser, IconTrash, IconCircleX, IconAlertCircle
} from '@tabler/icons-react';
import { sendChat } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useContextStore } from '@/store/contextStore';
import { useChatStore, Message } from '@/store/chatStore';
import { notifications } from '@mantine/notifications';


export default function ChatPage() {
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();

  const assetId = useContextStore((s) => s.assetId);
  const assetName = useContextStore((s) => s.assetName);
  const clearAssetContext = useContextStore((s) => s.clearAssetContext);

  const messages = useChatStore((s) => s.messages);
  const setMessages = useChatStore((s) => s.setMessages);
  
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `Hello ${user?.name || 'there'}! I'm FixByte, your CMMS AI assistant. I can look up assets, create work orders, schedule preventive maintenance, check inventory, and assign technicians. How can I help you today?`
        }
      ]);
    }
  }, [messages.length, setMessages, user?.name]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const contextPayload = {
      currentPath: pathname,
      assetId: assetId || undefined,
      assetName: assetName || undefined,
      userName: user?.name,
      userRole: user?.role,
    };

    try {
      // Send chat request to backend
      // Backend expects: { messages: Message[], context: any }
      const res = await sendChat(newMessages, contextPayload);
      const reply = res.data.reply;

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      console.error(err);
      notifications.show({
        title: 'Chat Failed',
        message: 'Could not connect to the AI model or database tools.',
        color: 'red'
      });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Sorry, I could not complete your request. Please ensure HF_TOKEN is correctly set in backend .env and that the database is running.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  function handleClearHistory() {
    setMessages([
      {
        role: 'assistant',
        content: `Conversation restarted. How can I help you today?`
      }
    ]);
  }

  const quickPrompts = [
    'List all down assets',
    'Are there low stock items?',
    'What work orders are active?',
    'Create an inspection task'
  ];

  return (
    <Stack gap="xl" style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
      <Group justify="space-between">
        <div>
          <Title order={1} style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
            FixByte AI Assistant
          </Title>
          <Text size="sm" c="dimmed">
            Ask questions, create maintenance logs, or request inventory status.
          </Text>
        </div>
        <Button
          variant="subtle"
          color="red"
          size="xs"
          leftSection={<IconTrash size={14} />}
          onClick={handleClearHistory}
          disabled={messages.length <= 1}
        >
          Clear History
        </Button>
      </Group>

      {/* Context Alert Tag if asset is linked */}
      {assetId && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Active Asset Context"
          color="violet"
          variant="light"
          withCloseButton
          onClose={clearAssetContext}
        >
          Your queries are focused on: <Text span fw={700}>{assetName}</Text>. Creating work orders or logging activities will target this asset automatically.
        </Alert>
      )}

      {/* Messages Panel */}
      <Card
        p="md"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden'
        }}
      >
        {/* Messages list */}
        <Box style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }} mb="md">
          <Stack gap="md">
            {messages.map((msg, idx) => {
              const isAI = msg.role === 'assistant';
              return (
                <Group
                  key={idx}
                  align="flex-start"
                  justify={isAI ? 'flex-start' : 'flex-end'}
                  gap="sm"
                >
                  {isAI && (
                    <Avatar radius="xl" color="violet">
                      <IconRobot size={18} />
                    </Avatar>
                  )}
                  <Box
                    p="md"
                    style={{
                      maxWidth: '75%',
                      borderRadius: 12,
                      background: isAI ? 'var(--color-surface-2)' : 'rgba(108, 99, 255, 0.15)',
                      border: isAI ? '1px solid var(--color-border)' : '1px solid rgba(108, 99, 255, 0.25)',
                    }}
                  >
                    <Text size="sm" style={{ whiteSpace: 'pre-line', color: 'var(--color-text)' }}>
                      {msg.content}
                    </Text>
                  </Box>
                  {!isAI && (
                    <Avatar radius="xl" color="blue">
                      <IconUser size={18} />
                    </Avatar>
                  )}
                </Group>
              );
            })}
            {loading && (
              <Group align="center" gap="sm">
                <Avatar radius="xl" color="violet">
                  <IconRobot size={18} />
                </Avatar>
                <Box p="md" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 12 }}>
                  <Loader size="xs" color="violet" type="dots" />
                </Box>
              </Group>
            )}
            <div ref={messagesEndRef} />
          </Stack>
        </Box>

        {/* Suggested prompts / Input field */}
        <Stack gap="xs">
          {messages.length === 1 && (
            <Group gap="xs">
              {quickPrompts.map((p, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  color="gray"
                  size="xs"
                  radius="xl"
                  onClick={() => setInput(p)}
                >
                  {p}
                </Button>
              ))}
            </Group>
          )}

          <form onSubmit={handleSend}>
            <Group gap="xs">
              <Textarea
                placeholder={assetId ? `Ask anything about ${assetName}...` : "Type a message to FixByte AI..."}
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                autosize
                minRows={1}
                maxRows={5}
                style={{ flex: 1 }}
                styles={{ input: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' } }}
                disabled={loading}
              />
              <ActionIcon
                type="submit"
                color="violet"
                size={36}
                radius="md"
                disabled={!input.trim() || loading}
              >
                <IconSend size={18} />
              </ActionIcon>
            </Group>
          </form>
        </Stack>
      </Card>
    </Stack>
  );
}
