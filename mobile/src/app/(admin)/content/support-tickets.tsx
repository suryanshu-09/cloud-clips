import { useState, useCallback } from 'react';
import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

type TicketStatus = 'open' | 'in_progress' | 'waiting_on_user' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
type TicketCategory = 'billing' | 'booking' | 'account' | 'technical' | 'barber' | 'other';

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_on_user: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_COLORS: Record<TicketStatus, 'warning' | 'info' | 'danger' | 'success' | 'default'> = {
  open: 'warning',
  in_progress: 'info',
  waiting_on_user: 'default',
  resolved: 'success',
  closed: 'default',
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

const PRIORITY_COLORS: Record<TicketPriority, 'default' | 'info' | 'warning' | 'danger'> = {
  low: 'default',
  normal: 'info',
  high: 'warning',
  urgent: 'danger',
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  billing: 'Billing',
  booking: 'Booking',
  account: 'Account',
  technical: 'Technical',
  barber: 'Barber',
  other: 'Other',
};

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(timestamp: number) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

interface IStatCardProps {
  label: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
}

function StatCard({ label, value, icon, color, bgColor }: IStatCardProps) {
  return (
    <Card className="flex-1 p-3 min-w-[80px]">
      <View className={`w-8 h-8 ${bgColor} rounded-full items-center justify-center mb-2`}>
        <Text className="text-base">{icon}</Text>
      </View>
      <Text className={`text-xl font-bold ${color}`}>{value}</Text>
      <Text className="text-xs text-gray-500 mt-0.5">{label}</Text>
    </Card>
  );
}

interface IFilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function FilterChip({ label, selected, onPress }: IFilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-3 py-1.5 rounded-full border ${
        selected ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-300'
      }`}
    >
      <Text className={`text-xs font-medium ${selected ? 'text-white' : 'text-gray-700'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

interface ITicketRowProps {
  ticket: any;
  onPress: () => void;
}

function TicketRow({ ticket, onPress }: ITicketRowProps) {
  const priorityColor = PRIORITY_COLORS[ticket.priority as TicketPriority] || 'default';
  const statusColor = STATUS_COLORS[ticket.status as TicketStatus] || 'default';

  return (
    <Pressable
      onPress={onPress}
      className="bg-white border-b border-gray-100 p-4 active:bg-gray-50"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-base font-semibold text-gray-900 line-clamp-1">
            {ticket.subject}
          </Text>
          <Text className="text-sm text-gray-500 mt-0.5">
            {ticket.user?.name || ticket.user?.email || 'Unknown User'}
          </Text>
        </View>
        <Badge variant={priorityColor} size="sm">
          {PRIORITY_LABELS[ticket.priority as TicketPriority] || ticket.priority}
        </Badge>
      </View>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Badge variant={statusColor} size="sm">
            {STATUS_LABELS[ticket.status as TicketStatus] || ticket.status}
          </Badge>
          <Badge variant="default" size="sm">
            {CATEGORY_LABELS[ticket.category as TicketCategory] || ticket.category}
          </Badge>
        </View>
        <Text className="text-xs text-gray-400">{formatRelativeTime(ticket.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

interface ITicketFiltersProps {
  statusFilter: TicketStatus | null;
  categoryFilter: TicketCategory | null;
  priorityFilter: TicketPriority | null;
  onStatusChange: (status: TicketStatus | null) => void;
  onCategoryChange: (category: TicketCategory | null) => void;
  onPriorityChange: (priority: TicketPriority | null) => void;
}

function TicketFilters({
  statusFilter,
  categoryFilter,
  priorityFilter,
  onStatusChange,
  onCategoryChange,
  onPriorityChange,
}: ITicketFiltersProps) {
  const statuses: (TicketStatus | null)[] = [
    null,
    'open',
    'in_progress',
    'waiting_on_user',
    'resolved',
    'closed',
  ];
  const categories: (TicketCategory | null)[] = [
    null,
    'billing',
    'booking',
    'account',
    'technical',
    'barber',
    'other',
  ];
  const priorities: (TicketPriority | null)[] = [null, 'urgent', 'high', 'normal', 'low'];

  return (
    <View className="bg-white border-b border-gray-200 p-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
        <View className="flex-row gap-2">
          {statuses.map((status) => (
            <FilterChip
              key={status ?? 'all-status'}
              label={status ? STATUS_LABELS[status] : 'All Status'}
              selected={statusFilter === status}
              onPress={() => onStatusChange(status)}
            />
          ))}
        </View>
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
        <View className="flex-row gap-2">
          {priorities.map((priority) => (
            <FilterChip
              key={priority ?? 'all-priority'}
              label={priority ? PRIORITY_LABELS[priority] : 'All Priority'}
              selected={priorityFilter === priority}
              onPress={() => onPriorityChange(priority)}
            />
          ))}
        </View>
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {categories.map((category) => (
            <FilterChip
              key={category ?? 'all-category'}
              label={category ? CATEGORY_LABELS[category] : 'All Category'}
              selected={categoryFilter === category}
              onPress={() => onCategoryChange(category)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function TicketListScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | null>(null);

  const tickets = useQuery(api.admin.supportTickets.adminGetAllTickets, {
    status: statusFilter ?? undefined,
    category: categoryFilter ?? undefined,
    priority: priorityFilter ?? undefined,
  });

  const stats = useQuery(api.admin.supportTickets.getSupportTicketStats);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleTicketPress = (ticketId: string) => {
    router.push(`/(admin)/content/support-tickets/${ticketId}` as any);
  };

  if (tickets === undefined || stats === undefined) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="text-gray-600 mt-3">Loading tickets...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-center gap-2 mb-3">
          <Text className="text-xl">🎫</Text>
          <Text className="text-xl font-bold text-gray-900">Support Tickets</Text>
        </View>

        <View className="flex-row gap-2">
          <StatCard
            label="Open"
            value={stats.open}
            icon="📬"
            color="text-orange-600"
            bgColor="bg-orange-100"
          />
          <StatCard
            label="Resolved"
            value={stats.resolved}
            icon="✅"
            color="text-green-600"
            bgColor="bg-green-100"
          />
          <StatCard
            label="Total"
            value={stats.total}
            icon="📊"
            color="text-gray-900"
            bgColor="bg-gray-100"
          />
        </View>

        <View className="flex-row gap-2 mt-2">
          <StatCard
            label="Urgent"
            value={stats.byPriority?.urgent ?? 0}
            icon="🚨"
            color="text-red-600"
            bgColor="bg-red-100"
          />
          <StatCard
            label="High"
            value={stats.byPriority?.high ?? 0}
            icon="⚠️"
            color="text-yellow-600"
            bgColor="bg-yellow-100"
          />
          <StatCard
            label="Normal"
            value={stats.byPriority?.normal ?? 0}
            icon="📋"
            color="text-blue-600"
            bgColor="bg-blue-100"
          />
        </View>
      </View>

      <TicketFilters
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        priorityFilter={priorityFilter}
        onStatusChange={setStatusFilter}
        onCategoryChange={setCategoryFilter}
        onPriorityChange={setPriorityFilter}
      />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />
        }
      >
        {tickets.length === 0 ? (
          <View className="p-8 items-center">
            <Text className="text-4xl mb-3">🎫</Text>
            <Text className="text-lg font-semibold text-gray-900 mb-1">No tickets found</Text>
            <Text className="text-gray-500 text-center">
              No tickets match your current filters.
            </Text>
          </View>
        ) : (
          tickets.map((ticket: any) => (
            <TicketRow
              key={ticket._id}
              ticket={ticket}
              onPress={() => handleTicketPress(ticket._id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function TicketDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const ticketId = params.id as string;

  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const ticket = useQuery(api.admin.supportTickets.adminGetTicketById, {
    ticketId: ticketId as any,
  });

  const updateTicket = useMutation(api.admin.supportTickets.adminUpdateTicket);
  const replyToTicket = useMutation(api.admin.supportTickets.adminReplyToTicket);

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    setUpdatingStatus(true);
    try {
      await updateTicket({
        ticketId: ticket._id,
        status: newStatus,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update ticket status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!ticket) return;
    setUpdatingStatus(true);
    try {
      await updateTicket({
        ticketId: ticket._id,
        priority: newPriority,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update ticket priority');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendReply = async () => {
    if (!ticket || !replyText.trim()) return;
    setSendingReply(true);
    try {
      await replyToTicket({
        ticketId: ticket._id,
        message: replyText.trim(),
        isInternal,
      });
      setReplyText('');
      setIsInternal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  if (ticket === undefined) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="text-gray-600 mt-3">Loading ticket...</Text>
      </View>
    );
  }

  if (ticket === null) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Text className="text-4xl mb-4">❌</Text>
        <Text className="text-xl font-bold text-gray-900 mb-2">Ticket not found</Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  const statusOptions: TicketStatus[] = [
    'open',
    'in_progress',
    'waiting_on_user',
    'resolved',
    'closed',
  ];
  const priorityOptions: TicketPriority[] = ['low', 'normal', 'high', 'urgent'];

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="bg-white p-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between mb-3">
            <Pressable onPress={() => router.back()} className="flex-row items-center gap-1">
              <Text className="text-purple-600 text-base">← Back</Text>
            </Pressable>
            <View className="flex-row gap-2">
              <Badge variant={PRIORITY_COLORS[ticket.priority as TicketPriority] || 'default'}>
                {PRIORITY_LABELS[ticket.priority as TicketPriority] || ticket.priority}
              </Badge>
              <Badge variant={STATUS_COLORS[ticket.status as TicketStatus] || 'default'}>
                {STATUS_LABELS[ticket.status as TicketStatus] || ticket.status}
              </Badge>
            </View>
          </View>

          <Text className="text-lg font-bold text-gray-900 mb-2">{ticket.subject}</Text>
          <Text className="text-sm text-gray-600 mb-3">{ticket.description}</Text>

          <View className="flex-row flex-wrap gap-2 mb-3">
            <Badge variant="default">{CATEGORY_LABELS[ticket.category as TicketCategory]}</Badge>
            {ticket.user && (
              <Text className="text-sm text-gray-500">
                From: {ticket.user.name || ticket.user.email}
              </Text>
            )}
          </View>

          <Text className="text-xs text-gray-400">
            Created: {formatDate(ticket.createdAt)}
            {ticket.updatedAt !== ticket.createdAt && ` • Updated: ${formatDate(ticket.updatedAt)}`}
          </Text>
        </View>

        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="text-sm font-semibold text-gray-700 mb-3">Update Ticket</Text>

          <Text className="text-xs text-gray-500 mb-2">Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <View className="flex-row gap-2">
              {statusOptions.map((status) => (
                <Pressable
                  key={status}
                  onPress={() => handleStatusChange(status)}
                  disabled={updatingStatus || ticket.status === status}
                  className={`px-3 py-2 rounded-lg border ${
                    ticket.status === status
                      ? 'bg-purple-600 border-purple-600'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      ticket.status === status ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Text className="text-xs text-gray-500 mb-2">Priority</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {priorityOptions.map((priority) => (
                <Pressable
                  key={priority}
                  onPress={() => handlePriorityChange(priority)}
                  disabled={updatingStatus || ticket.priority === priority}
                  className={`px-3 py-2 rounded-lg border ${
                    ticket.priority === priority
                      ? 'bg-purple-600 border-purple-600'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      ticket.priority === priority ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {PRIORITY_LABELS[priority]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className="p-4">
          <Text className="text-sm font-semibold text-gray-700 mb-3">Message Thread</Text>

          {ticket.messages && ticket.messages.length > 0 ? (
            ticket.messages.map((message: any, index: number) => (
              <Card
                key={message._id ?? index}
                className={`mb-3 ${
                  message.isInternal ? 'bg-yellow-50 border-yellow-300' : 'bg-white'
                }`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-semibold text-gray-900">
                      {message.sender?.name || 'Unknown'}
                    </Text>
                    {message.sender?.role === 'admin' && (
                      <Badge variant="primary" size="sm">
                        Admin
                      </Badge>
                    )}
                    {message.isInternal && (
                      <Badge variant="warning" size="sm">
                        Internal
                      </Badge>
                    )}
                  </View>
                  <Text className="text-xs text-gray-400">
                    {formatRelativeTime(message.createdAt)}
                  </Text>
                </View>
                <Text className="text-sm text-gray-700">{message.message}</Text>
              </Card>
            ))
          ) : (
            <Card className="mb-3">
              <Text className="text-sm text-gray-500 text-center">No messages yet</Text>
            </Card>
          )}
        </View>

        <View className="bg-white p-4 border-t border-gray-200">
          <Text className="text-sm font-semibold text-gray-700 mb-3">Reply</Text>

          <View className="border border-gray-300 rounded-lg mb-3">
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Type your reply..."
              multiline
              numberOfLines={4}
              className="p-3 text-base text-gray-900 min-h-[100px]"
              placeholderTextColor="#9ca3af"
              textAlignVertical="top"
            />
          </View>

          <Pressable
            onPress={() => setIsInternal(!isInternal)}
            className="flex-row items-center gap-2 mb-3"
          >
            <View
              className={`w-5 h-5 rounded border flex items-center justify-center ${
                isInternal ? 'bg-yellow-500 border-yellow-500' : 'border-gray-300'
              }`}
            >
              {isInternal && <Text className="text-white text-xs">✓</Text>}
            </View>
            <Text className="text-sm text-gray-700">Internal note (not visible to user)</Text>
          </Pressable>

          <Button
            onPress={handleSendReply}
            disabled={!replyText.trim() || sendingReply}
            loading={sendingReply}
            fullWidth
          >
            Send Reply
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

export default function SupportTicketsScreen() {
  const params = useLocalSearchParams();
  const ticketId = params.id as string | undefined;

  if (ticketId) {
    return <TicketDetailScreen />;
  }

  return <TicketListScreen />;
}
