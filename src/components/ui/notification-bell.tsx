'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, HStack, IconButton, Text, VStack } from '@chakra-ui/react';
import { FiBell, FiCheck, FiExternalLink, FiTrash2 } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { apiService, AppNotification } from '@/services/api';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toaster } from '@/components/ui/toaster';

type NotificationState = {
  items: AppNotification[];
  unreadCount: number;
};

function formatRelative(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<NotificationState>({ items: [], unreadCount: 0 });

  const { permission, subscribed, requestPermission } = usePushNotifications();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiService.getNotifications();
      setState({
        items: res.data.notifications || [],
        unreadCount: res.data.unreadCount || 0,
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Poll every 20s as a fallback if websocket broadcast isn't wired for notifications
  useEffect(() => {
    const timer = setInterval(fetchNotifications, 20000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadLabel = useMemo(() => {
    if (state.unreadCount <= 0) return '';
    return state.unreadCount > 99 ? '99+' : String(state.unreadCount);
  }, [state.unreadCount]);

  const markRead = async (id: number, link?: string | null) => {
    try {
      await apiService.markNotificationRead(id);
      setState((prev) => ({
        unreadCount: Math.max(0, prev.unreadCount - (prev.items.find((i) => i.id === id && !i.read) ? 1 : 0)),
        items: prev.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
      }));
      if (link) router.push(link);
    } catch {
      toaster.create({ title: 'Failed to update notification', type: 'error', duration: 3000 });
    }
  };

  const markAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setState((prev) => ({ unreadCount: 0, items: prev.items.map((n) => ({ ...n, read: true })) }));
    } catch {
      toaster.create({ title: 'Failed to mark all as read', type: 'error', duration: 3000 });
    }
  };

  const deleteOne = async (id: number) => {
    try {
      const wasUnread = state.items.find((n) => n.id === id && !n.read);
      await apiService.deleteNotification(id);
      setState((prev) => ({
        unreadCount: wasUnread ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount,
        items: prev.items.filter((n) => n.id !== id),
      }));
    } catch {
      toaster.create({ title: 'Failed to delete notification', type: 'error', duration: 3000 });
    }
  };

  return (
    <Box position="relative" ref={wrapperRef}>
      <IconButton
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        variant="ghost"
        size="sm"
        borderRadius="lg"
        color="gray.500"
        _hover={{ bg: 'blue.50', color: 'blue.600' }}
      >
        <FiBell size={17} />
      </IconButton>

      {unreadLabel && (
        <Box
          position="absolute"
          top="-1"
          right="-1"
          minW="18px"
          h="18px"
          px="1"
          borderRadius="999px"
          bg="red.500"
          color="white"
          fontSize="10px"
          fontWeight="700"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {unreadLabel}
        </Box>
      )}

      {open && (
        <Box
          position="absolute"
          top="calc(100% + 8px)"
          right={0}
          w="360px"
          maxW="90vw"
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="xl"
          boxShadow="lg"
          p={3}
          zIndex={40}
        >
          <HStack justify="space-between" mb={2}>
            <Text fontWeight="700" fontSize="sm">Notifications</Text>
            <Button size="xs" variant="ghost" onClick={markAllRead}>Mark all read</Button>
          </HStack>

          {permission === 'default' && (
            <Button size="xs" colorPalette="blue" mb={2} onClick={requestPermission}>
              Enable browser push
            </Button>
          )}

          {permission === 'denied' && (
            <Text fontSize="xs" color="orange.600" mb={2}>
              Browser notifications are blocked in your browser settings.
            </Text>
          )}

          {permission === 'granted' && !subscribed && (
            <Button size="xs" colorPalette="blue" mb={2} onClick={requestPermission}>
              Finish push setup
            </Button>
          )}

          <VStack align="stretch" gap={2} maxH="360px" overflowY="auto" pr={1}>
            {!loading && state.items.length === 0 && (
              <Text fontSize="sm" color="gray.500">No notifications yet.</Text>
            )}

            {state.items.map((n) => (
              <Box
                key={n.id}
                border="1px solid"
                borderColor={n.read ? 'gray.200' : 'blue.200'}
                bg={n.read ? 'white' : 'blue.50'}
                borderRadius="lg"
                p={2.5}
              >
                <HStack justify="space-between" align="start">
                  <VStack align="start" gap={0.5} flex={1}>
                    <Text fontWeight="600" fontSize="sm" color="gray.900">{n.title}</Text>
                    <Text fontSize="xs" color="gray.600">{n.body}</Text>
                    <Text fontSize="11px" color="gray.400">{formatRelative(n.created_at)}</Text>
                  </VStack>

                  <HStack>
                    <IconButton
                      aria-label="Mark as read"
                      size="xs"
                      variant="ghost"
                      onClick={() => markRead(n.id, n.link)}
                    >
                      <FiCheck size={14} />
                    </IconButton>

                    {n.link && (
                      <IconButton
                        aria-label="Open"
                        size="xs"
                        variant="ghost"
                        onClick={() => markRead(n.id, n.link)}
                      >
                        <FiExternalLink size={14} />
                      </IconButton>
                    )}

                    <IconButton
                      aria-label="Delete"
                      size="xs"
                      variant="ghost"
                      color="gray.500"
                      _hover={{ bg: 'red.50', color: 'red.600' }}
                      onClick={() => deleteOne(n.id)}
                    >
                      <FiTrash2 size={14} />
                    </IconButton>
                  </HStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
}
