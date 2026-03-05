import { useState, useCallback } from 'react';
import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  Pressable,
  TextInput,
  Alert,
  RefreshControl,
  Switch,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

type StatusFilter = 'all' | 'draft' | 'active' | 'expired';
type AudienceFilter = 'all' | 'all' | 'clients' | 'barbers';
type DisplayType = 'banner' | 'modal' | 'push';
type Priority = 'low' | 'normal' | 'high' | 'urgent';

interface Announcement {
  _id: string;
  title: string;
  body: string;
  targetAudience: 'all' | 'clients' | 'barbers';
  displayType: DisplayType;
  priority: Priority;
  publishAt: number;
  expiresAt?: number;
  isDraft: boolean;
  isActive: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
  creator?: { name: string; email: string } | null;
}

function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadgeVariant(
  announcement: Announcement
): 'default' | 'success' | 'warning' | 'danger' {
  const now = Date.now();
  if (announcement.isDraft) return 'warning';
  if (!announcement.isActive) return 'danger';
  if (announcement.expiresAt && announcement.expiresAt <= now) return 'default';
  return 'success';
}

function getStatusText(announcement: Announcement): string {
  const now = Date.now();
  if (announcement.isDraft) return 'Draft';
  if (!announcement.isActive) return 'Inactive';
  if (announcement.expiresAt && announcement.expiresAt <= now) return 'Expired';
  return 'Active';
}

interface IFilterBarProps {
  status: StatusFilter;
  audience: AudienceFilter;
  onStatusChange: (status: StatusFilter) => void;
  onAudienceChange: (audience: AudienceFilter) => void;
}

function FilterBar({ status, audience, onStatusChange, onAudienceChange }: IFilterBarProps) {
  const statusOptions: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Draft', value: 'draft' },
    { label: 'Active', value: 'active' },
    { label: 'Expired', value: 'expired' },
  ];

  const audienceOptions: { label: string; value: AudienceFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Clients', value: 'clients' },
    { label: 'Barbers', value: 'barbers' },
  ];

  return (
    <Card className="p-3 mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-2">Filters</Text>
      <View className="flex-row gap-2 mb-3">
        {statusOptions.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => onStatusChange(opt.value)}
            className={`px-3 py-1.5 rounded-full ${
              status === opt.value ? 'bg-purple-600' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                status === opt.value ? 'text-white' : 'text-gray-600'
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="flex-row gap-2">
        {audienceOptions.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => onAudienceChange(opt.value as AudienceFilter)}
            className={`px-3 py-1.5 rounded-full ${
              audience === opt.value ? 'bg-blue-600' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                audience === opt.value ? 'text-white' : 'text-gray-600'
              }`}
            >
              {opt.label === 'All' ? 'All Users' : opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

interface IAnnouncementCardProps {
  announcement: Announcement;
  onEdit: (announcement: Announcement) => void;
  onPublish: (id: string) => void;
  onDeactivate: (id: string) => void;
  onDelete: (id: string) => void;
}

function AnnouncementCard({
  announcement,
  onEdit,
  onPublish,
  onDeactivate,
  onDelete,
}: IAnnouncementCardProps) {
  const priorityColors: Record<Priority, string> = {
    low: 'bg-gray-100 text-gray-600',
    normal: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  const audienceLabels: Record<string, string> = {
    all: 'All Users',
    clients: 'Clients',
    barbers: 'Barbers',
  };

  return (
    <Card className="mb-3" variant="outlined">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-base font-semibold text-gray-900" numberOfLines={2}>
            {announcement.title}
          </Text>
        </View>
        <Badge variant={getStatusBadgeVariant(announcement)} size="sm">
          {getStatusText(announcement)}
        </Badge>
      </View>

      <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
        {announcement.body}
      </Text>

      <View className="flex-row flex-wrap gap-2 mb-3">
        <View className={`px-2 py-1 rounded ${priorityColors[announcement.priority]}`}>
          <Text className="text-xs font-medium capitalize">{announcement.priority}</Text>
        </View>
        <View className="px-2 py-1 rounded bg-gray-100">
          <Text className="text-xs font-medium text-gray-600 capitalize">
            {announcement.displayType}
          </Text>
        </View>
        <View className="px-2 py-1 rounded bg-gray-100">
          <Text className="text-xs font-medium text-gray-600">
            {audienceLabels[announcement.targetAudience]}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between text-xs text-gray-500 mb-3">
        <Text>Publish: {formatDate(announcement.publishAt)}</Text>
        {announcement.expiresAt && <Text>Expires: {formatDate(announcement.expiresAt)}</Text>}
      </View>

      {announcement.creator && (
        <Text className="text-xs text-gray-400 mb-3">
          Created by: {announcement.creator.name || announcement.creator.email}
        </Text>
      )}

      <View className="flex-row gap-2 border-t border-gray-100 pt-3">
        <Button variant="outline" size="sm" onPress={() => onEdit(announcement)} className="flex-1">
          Edit
        </Button>
        {announcement.isDraft && (
          <Button
            variant="primary"
            size="sm"
            onPress={() => onPublish(announcement._id)}
            className="flex-1"
          >
            Publish
          </Button>
        )}
        {announcement.isActive && !announcement.isDraft && (
          <Button
            variant="secondary"
            size="sm"
            onPress={() => onDeactivate(announcement._id)}
            className="flex-1"
          >
            Deactivate
          </Button>
        )}
        {announcement.isDraft && (
          <Button variant="danger" size="sm" onPress={() => onDelete(announcement._id)}>
            Delete
          </Button>
        )}
      </View>
    </Card>
  );
}

interface IAnnouncementFormProps {
  announcement?: Announcement | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    body: string;
    targetAudience: 'all' | 'clients' | 'barbers';
    displayType: DisplayType;
    priority: Priority;
    publishAt?: number;
    expiresAt?: number;
    isDraft: boolean;
    ctaLabel?: string;
    ctaUrl?: string;
    imageUrl?: string;
  }) => void;
  isSaving: boolean;
}

function AnnouncementForm({ announcement, onClose, onSave, isSaving }: IAnnouncementFormProps) {
  const [title, setTitle] = useState(announcement?.title || '');
  const [body, setBody] = useState(announcement?.body || '');
  const [targetAudience, setTargetAudience] = useState<'all' | 'clients' | 'barbers'>(
    announcement?.targetAudience || 'all'
  );
  const [displayType, setDisplayType] = useState<DisplayType>(
    announcement?.displayType || 'banner'
  );
  const [priority, setPriority] = useState<Priority>(announcement?.priority || 'normal');
  const [isDraft, setIsDraft] = useState(announcement?.isDraft ?? true);
  const [ctaLabel, setCtaLabel] = useState(announcement?.ctaLabel || '');
  const [ctaUrl, setCtaUrl] = useState(announcement?.ctaUrl || '');
  const [imageUrl, setImageUrl] = useState(announcement?.imageUrl || '');

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    if (!body.trim()) {
      Alert.alert('Error', 'Body is required');
      return;
    }

    onSave({
      title: title.trim(),
      body: body.trim(),
      targetAudience,
      displayType,
      priority,
      isDraft,
      ctaLabel: ctaLabel.trim() || undefined,
      ctaUrl: ctaUrl.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    });
  };

  const audienceOptions: { label: string; value: 'all' | 'clients' | 'barbers' }[] = [
    { label: 'All Users', value: 'all' },
    { label: 'Clients Only', value: 'clients' },
    { label: 'Barbers Only', value: 'barbers' },
  ];

  const displayTypeOptions: { label: string; value: DisplayType }[] = [
    { label: 'Banner', value: 'banner' },
    { label: 'Modal', value: 'modal' },
    { label: 'Push', value: 'push' },
  ];

  const priorityOptions: { label: string; value: Priority }[] = [
    { label: 'Low', value: 'low' },
    { label: 'Normal', value: 'normal' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' },
  ];

  return (
    <ScrollView className="flex-1 bg-white" keyboardShouldPersistTaps="handled">
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-gray-900">
            {announcement ? 'Edit Announcement' : 'New Announcement'}
          </Text>
          <Pressable onPress={onClose} className="p-2">
            <Text className="text-gray-500 text-lg">✕</Text>
          </Pressable>
        </View>

        <Text className="text-sm font-medium text-gray-700 mb-2">Title *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Enter announcement title"
          className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white mb-4"
          placeholderTextColor="#9ca3af"
        />

        <Text className="text-sm font-medium text-gray-700 mb-2">Body *</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Enter announcement body"
          multiline
          numberOfLines={4}
          className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white mb-4 min-h-[100px]"
          placeholderTextColor="#9ca3af"
        />

        <Text className="text-sm font-medium text-gray-700 mb-2">Target Audience</Text>
        <View className="flex-row gap-2 mb-4">
          {audienceOptions.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setTargetAudience(opt.value)}
              className={`px-4 py-2 rounded-lg border ${
                targetAudience === opt.value
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-300 bg-white'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  targetAudience === opt.value ? 'text-purple-700' : 'text-gray-600'
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-sm font-medium text-gray-700 mb-2">Display Type</Text>
        <View className="flex-row gap-2 mb-4">
          {displayTypeOptions.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setDisplayType(opt.value)}
              className={`px-4 py-2 rounded-lg border ${
                displayType === opt.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 bg-white'
              }`}
            >
              <Text
                className={`text-sm font-medium capitalize ${
                  displayType === opt.value ? 'text-blue-700' : 'text-gray-600'
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-sm font-medium text-gray-700 mb-2">Priority</Text>
        <View className="flex-row gap-2 mb-4">
          {priorityOptions.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setPriority(opt.value)}
              className={`px-4 py-2 rounded-lg border ${
                priority === opt.value
                  ? 'border-orange-600 bg-orange-50'
                  : 'border-gray-300 bg-white'
              }`}
            >
              <Text
                className={`text-sm font-medium capitalize ${
                  priority === opt.value ? 'text-orange-700' : 'text-gray-600'
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-sm font-medium text-gray-700">Save as Draft</Text>
          <Switch
            value={isDraft}
            onValueChange={setIsDraft}
            trackColor={{ false: '#e5e7eb', true: '#a78bfa' }}
            thumbColor={isDraft ? '#7c3aed' : '#f9fafb'}
          />
        </View>

        <Text className="text-sm font-medium text-gray-700 mb-2">CTA Label (Optional)</Text>
        <TextInput
          value={ctaLabel}
          onChangeText={setCtaLabel}
          placeholder="e.g., Learn More"
          className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white mb-4"
          placeholderTextColor="#9ca3af"
        />

        <Text className="text-sm font-medium text-gray-700 mb-2">CTA URL (Optional)</Text>
        <TextInput
          value={ctaUrl}
          onChangeText={setCtaUrl}
          placeholder="https://..."
          className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white mb-4"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          keyboardType="url"
        />

        <Text className="text-sm font-medium text-gray-700 mb-2">Image URL (Optional)</Text>
        <TextInput
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="https://..."
          className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-white mb-6"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          keyboardType="url"
        />

        <View className="flex-row gap-3">
          <Button variant="outline" onPress={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" onPress={handleSubmit} loading={isSaving} className="flex-1">
            {announcement ? 'Update' : 'Create'}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

export default function AnnouncementsScreen() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const announcements = useQuery(api.admin.announcements.getAllAnnouncements, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    audience: audienceFilter === 'all' ? undefined : audienceFilter,
    limit: 50,
  });

  const createAnnouncement = useMutation(api.admin.announcements.createAnnouncement);
  const updateAnnouncement = useMutation(api.admin.announcements.updateAnnouncement);
  const publishAnnouncement = useMutation(api.admin.announcements.publishAnnouncement);
  const deactivateAnnouncement = useMutation(api.admin.announcements.deactivateAnnouncement);
  const deleteAnnouncement = useMutation(api.admin.announcements.deleteAnnouncement);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleCreate = async (data: {
    title: string;
    body: string;
    targetAudience: 'all' | 'clients' | 'barbers';
    displayType: DisplayType;
    priority: Priority;
    isDraft: boolean;
    ctaLabel?: string;
    ctaUrl?: string;
    imageUrl?: string;
  }) => {
    try {
      await createAnnouncement(data);
      setShowForm(false);
      Alert.alert('Success', 'Announcement created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create announcement');
    }
  };

  const handleUpdate = async (data: {
    title: string;
    body: string;
    targetAudience: 'all' | 'clients' | 'barbers';
    displayType: DisplayType;
    priority: Priority;
    isDraft: boolean;
    ctaLabel?: string;
    ctaUrl?: string;
    imageUrl?: string;
  }) => {
    if (!editingAnnouncement) return;
    try {
      await updateAnnouncement({
        announcementId: editingAnnouncement._id,
        ...data,
      });
      setEditingAnnouncement(null);
      setShowForm(false);
      Alert.alert('Success', 'Announcement updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update announcement');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishAnnouncement({ announcementId: id });
      Alert.alert('Success', 'Announcement published');
    } catch (error) {
      Alert.alert('Error', 'Failed to publish announcement');
    }
  };

  const handleDeactivate = async (id: string) => {
    Alert.alert(
      'Deactivate Announcement',
      'Are you sure you want to deactivate this announcement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await deactivateAnnouncement({ announcementId: id });
              Alert.alert('Success', 'Announcement deactivated');
            } catch (error) {
              Alert.alert('Error', 'Failed to deactivate announcement');
            }
          },
        },
      ]
    );
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Announcement', 'Are you sure you want to delete this draft?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAnnouncement({ announcementId: id });
            Alert.alert('Success', 'Announcement deleted');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete announcement');
          }
        },
      },
    ]);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAnnouncement(null);
  };

  const handleSave = editingAnnouncement ? handleUpdate : handleCreate;

  if (showForm) {
    return (
      <View className="flex-1 bg-white">
        <AnnouncementForm
          announcement={editingAnnouncement}
          onClose={handleCloseForm}
          onSave={handleSave}
          isSaving={false}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pt-4 pb-2 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-2xl font-bold text-gray-900">Announcements</Text>
          <Button variant="primary" size="sm" onPress={() => setShowForm(true)}>
            + New
          </Button>
        </View>
        <Text className="text-sm text-gray-500">Manage system-wide announcements</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <FilterBar
          status={statusFilter}
          audience={audienceFilter}
          onStatusChange={setStatusFilter}
          onAudienceChange={setAudienceFilter}
        />

        {announcements === undefined ? (
          <Card className="p-8 items-center">
            <ActivityIndicator color="#7c3aed" size="large" />
            <Text className="text-gray-500 mt-2">Loading announcements...</Text>
          </Card>
        ) : announcements.length === 0 ? (
          <Card className="p-8 items-center">
            <Text className="text-4xl mb-2">📢</Text>
            <Text className="text-lg font-medium text-gray-900 mb-1">No announcements</Text>
            <Text className="text-gray-500 text-center">
              Create your first announcement to communicate with users
            </Text>
          </Card>
        ) : (
          announcements.map((announcement: Announcement) => (
            <AnnouncementCard
              key={announcement._id}
              announcement={announcement}
              onEdit={handleEdit}
              onPublish={handlePublish}
              onDeactivate={handleDeactivate}
              onDelete={handleDelete}
            />
          ))
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
