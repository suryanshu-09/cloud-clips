import { ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui';

interface IContentRouteCardProps {
  title: string;
  description: string;
  icon: string;
  route:
    | '/(admin)/content/featured-barbers'
    | '/(admin)/content/announcements'
    | '/(admin)/content/support-tickets'
    | '/(admin)/content/product-catalog';
}

function ContentRouteCard({ title, description, icon, route }: IContentRouteCardProps) {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push(route as any)}>
      <Card className="p-4" variant="outlined">
        <View className="flex-row items-start gap-3">
          <View className="w-11 h-11 bg-purple-100 rounded-xl items-center justify-center">
            <Text className="text-xl">{icon}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">{title}</Text>
            <Text className="text-sm text-gray-500 mt-1">{description}</Text>
          </View>
          <Text className="text-purple-600 text-lg">›</Text>
        </View>
      </Card>
    </Pressable>
  );
}

export default function AdminContentScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pt-5 pb-3 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Content Management</Text>
        <Text className="text-sm text-gray-500 mt-1">
          Manage featured placement, announcements, support, and marketplace catalog.
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
        <ContentRouteCard
          title="Featured Barbers"
          description="Promote verified barbers on discovery surfaces."
          icon="⭐"
          route="/(admin)/content/featured-barbers"
        />
        <ContentRouteCard
          title="Announcements"
          description="Create and manage user-facing broadcast messages."
          icon="📢"
          route="/(admin)/content/announcements"
        />
        <ContentRouteCard
          title="Support Tickets"
          description="Review and respond to support requests."
          icon="🎫"
          route="/(admin)/content/support-tickets"
        />
        <ContentRouteCard
          title="Product Catalog"
          description="Moderate products and maintain product categories."
          icon="🛍️"
          route="/(admin)/content/product-catalog"
        />
      </ScrollView>
    </View>
  );
}
