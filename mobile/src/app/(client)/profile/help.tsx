import { useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
  Alert,
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeView } from '@/components/ui/SafeView';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

interface IFAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: IFAQItem[] = [
  {
    id: '1',
    category: 'Bookings',
    question: 'How do I book an appointment?',
    answer:
      'To book an appointment, browse barbers from the home screen, select your preferred barber, choose a service and time slot, then confirm your booking. You can pay online or in person.',
  },
  {
    id: '2',
    category: 'Bookings',
    question: 'Can I cancel or reschedule my appointment?',
    answer:
      'Yes, you can cancel or reschedule your appointment up to 2 hours before the scheduled time. Go to your appointments, select the booking, and choose Cancel or Reschedule.',
  },
  {
    id: '3',
    category: 'Bookings',
    question: 'What happens if I miss my appointment?',
    answer:
      'If you miss an appointment without canceling, you may be charged a no-show fee. Please cancel at least 2 hours in advance to avoid any charges.',
  },
  {
    id: '4',
    category: 'Payments',
    question: 'What payment methods are accepted?',
    answer:
      'We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover). You can also save cards for faster checkout.',
  },
  {
    id: '5',
    category: 'Payments',
    question: 'How do refunds work?',
    answer:
      'Refunds for cancelled appointments are processed within 5-7 business days to your original payment method. Contact support if you have issues with a refund.',
  },
  {
    id: '6',
    category: 'Account',
    question: 'How do I change my password?',
    answer:
      'Go to Profile > Edit Profile > Change Password. You will need to enter your current password and then set a new one.',
  },
  {
    id: '7',
    category: 'Account',
    question: 'Can I delete my account?',
    answer:
      'Yes, you can delete your account from Settings. Note that this action is permanent and all your data will be erased. Any active appointments will be cancelled.',
  },
  {
    id: '8',
    category: 'Products',
    question: 'How long does product shipping take?',
    answer:
      'Standard shipping takes 3-5 business days. Express shipping (2-3 days) is available for an additional fee. You will receive tracking information once your order ships.',
  },
];

interface IFAQAccordionProps {
  item: IFAQItem;
  isExpanded: boolean;
  onToggle: () => void;
}

function FAQAccordion({ item, isExpanded, onToggle }: IFAQAccordionProps) {
  return (
    <Pressable onPress={onToggle} className="border-b border-gray-100 last:border-b-0">
      <View className="flex-row items-center justify-between py-4">
        <Text className="text-base font-medium text-gray-900 flex-1 mr-4">{item.question}</Text>
        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#6B7280" />
      </View>
      {isExpanded && (
        <View className="pb-4">
          <Text className="text-sm text-gray-600 leading-relaxed">{item.answer}</Text>
        </View>
      )}
    </Pressable>
  );
}

interface IContactFormData {
  subject: string;
  message: string;
}

export default function HelpScreen() {
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [contactForm, setContactForm] = useState<IContactFormData>({
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['All', ...new Set(FAQ_DATA.map((item) => item.category))];

  const filteredFAQs =
    selectedCategory === 'All'
      ? FAQ_DATA
      : FAQ_DATA.filter((item) => item.category === selectedCategory);

  const handleToggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const handleContactSupport = () => {
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowContactModal(false);
      setContactForm({ subject: '', message: '' });
      Alert.alert(
        'Message Sent',
        'Thank you for contacting us. We will get back to you within 24-48 hours.'
      );
    }, 1000);
  };

  const handleReportBug = () => {
    if (!contactForm.message.trim()) {
      Alert.alert('Error', 'Please describe the issue');
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowReportModal(false);
      setContactForm({ subject: '', message: '' });
      Alert.alert(
        'Bug Reported',
        'Thank you for helping us improve. Our team will investigate the issue.'
      );
    }, 1000);
  };

  const handleRateApp = () => {
    Alert.alert('Rate Cloud Clips', 'Enjoying Cloud Clips? Rate us on the App Store!', [
      { text: 'Not Now', style: 'cancel' },
      {
        text: 'Rate Now',
        onPress: () => {
          // This would open the App Store / Play Store
          Alert.alert('Info', 'App Store rating will open in production');
        },
      },
    ]);
  };

  return (
    <SafeView>
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <View className="flex-row items-center mb-2">
          <Pressable onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-2xl font-bold text-gray-900">Help & Support</Text>
        </View>
        <Text className="text-gray-600 ml-10">Get answers and contact us</Text>
      </View>

      <ScrollView className="flex-1 bg-gray-50">
        <View className="p-4">
          {/* Quick Actions */}
          <View className="flex-row mb-6">
            <Pressable className="flex-1 mr-2" onPress={() => setShowContactModal(true)}>
              <Card variant="elevated" padding="md" className="items-center">
                <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-2">
                  <Ionicons name="mail-outline" size={24} color="#2563EB" />
                </View>
                <Text className="text-sm font-medium text-gray-900">Contact Us</Text>
              </Card>
            </Pressable>

            <Pressable
              className="flex-1 ml-2"
              onPress={() => handleOpenLink('mailto:support@cloudclips.com')}
            >
              <Card variant="elevated" padding="md" className="items-center">
                <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mb-2">
                  <Ionicons name="chatbubble-outline" size={24} color="#10B981" />
                </View>
                <Text className="text-sm font-medium text-gray-900">Email Support</Text>
              </Card>
            </Pressable>
          </View>

          {/* FAQ Section */}
          <Text className="text-lg font-bold text-gray-900 mb-3">Frequently Asked Questions</Text>

          {/* Category Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row">
              {categories.map((category) => (
                <Pressable
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  className={`mr-2 px-4 py-2 rounded-full ${
                    selectedCategory === category ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedCategory === category ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {category}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* FAQ List */}
          <Card variant="elevated" padding="md" className="mb-6">
            {filteredFAQs.map((item) => (
              <FAQAccordion
                key={item.id}
                item={item}
                isExpanded={expandedFAQ === item.id}
                onToggle={() => handleToggleFAQ(item.id)}
              />
            ))}
          </Card>

          {/* Legal Links */}
          <Text className="text-lg font-bold text-gray-900 mb-3">Legal</Text>
          <Card variant="elevated" padding="none" className="mb-6">
            <Pressable
              className="flex-row items-center justify-between p-4 border-b border-gray-100"
              onPress={() => handleOpenLink('https://cloudclips.com/privacy')}
            >
              <View className="flex-row items-center">
                <Ionicons name="document-text-outline" size={20} color="#6B7280" />
                <Text className="text-base text-gray-900 ml-3">Privacy Policy</Text>
              </View>
              <Ionicons name="open-outline" size={18} color="#9CA3AF" />
            </Pressable>

            <Pressable
              className="flex-row items-center justify-between p-4 border-b border-gray-100"
              onPress={() => handleOpenLink('https://cloudclips.com/terms')}
            >
              <View className="flex-row items-center">
                <Ionicons name="document-outline" size={20} color="#6B7280" />
                <Text className="text-base text-gray-900 ml-3">Terms of Service</Text>
              </View>
              <Ionicons name="open-outline" size={18} color="#9CA3AF" />
            </Pressable>

            <Pressable
              className="flex-row items-center justify-between p-4"
              onPress={() => handleOpenLink('https://cloudclips.com/licenses')}
            >
              <View className="flex-row items-center">
                <Ionicons name="code-slash-outline" size={20} color="#6B7280" />
                <Text className="text-base text-gray-900 ml-3">Open Source Licenses</Text>
              </View>
              <Ionicons name="open-outline" size={18} color="#9CA3AF" />
            </Pressable>
          </Card>

          {/* Other Actions */}
          <Text className="text-lg font-bold text-gray-900 mb-3">Feedback</Text>
          <Card variant="elevated" padding="none" className="mb-6">
            <Pressable
              className="flex-row items-center justify-between p-4 border-b border-gray-100"
              onPress={() => setShowReportModal(true)}
            >
              <View className="flex-row items-center">
                <Ionicons name="bug-outline" size={20} color="#EF4444" />
                <Text className="text-base text-gray-900 ml-3">Report a Problem</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>

            <Pressable
              className="flex-row items-center justify-between p-4"
              onPress={handleRateApp}
            >
              <View className="flex-row items-center">
                <Ionicons name="star-outline" size={20} color="#F59E0B" />
                <Text className="text-base text-gray-900 ml-3">Rate the App</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>
          </Card>

          {/* App Info */}
          <View className="items-center py-6">
            <Text className="text-sm text-gray-500 mb-1">Cloud Clips</Text>
            <Text className="text-xs text-gray-400">Version 1.0.0 (Build 1)</Text>
            <Text className="text-xs text-gray-400 mt-2">
              Made with care by the Cloud Clips team
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Contact Support Modal */}
      <Modal
        visible={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="Contact Support"
        size="lg"
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="mb-4">
            <Input
              label="Subject"
              placeholder="What's your question about?"
              value={contactForm.subject}
              onChangeText={(text) => setContactForm({ ...contactForm, subject: text })}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Message</Text>
            <TextInput
              placeholder="Describe your issue or question..."
              value={contactForm.message}
              onChangeText={(text) => setContactForm({ ...contactForm, message: text })}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              className="border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-900 min-h-[120px]"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View className="flex-row">
            <Button
              variant="ghost"
              onPress={() => setShowContactModal(false)}
              className="flex-1 mr-2"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={handleContactSupport}
              loading={isSubmitting}
              className="flex-1 ml-2"
            >
              Send Message
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Report Bug Modal */}
      <Modal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report a Problem"
        size="lg"
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Text className="text-sm text-gray-600 mb-4">
            Help us improve by reporting bugs or issues you encounter.
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Describe the Problem</Text>
            <TextInput
              placeholder="What went wrong? Please include steps to reproduce..."
              value={contactForm.message}
              onChangeText={(text) => setContactForm({ ...contactForm, message: text })}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              className="border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-900 min-h-[120px]"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <Card variant="outlined" padding="sm" className="mb-4">
            <View className="flex-row items-center">
              <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
              <Text className="text-xs text-gray-500 ml-2 flex-1">
                Device info and app logs will be automatically included to help us diagnose the
                issue.
              </Text>
            </View>
          </Card>

          <View className="flex-row">
            <Button
              variant="ghost"
              onPress={() => setShowReportModal(false)}
              className="flex-1 mr-2"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={handleReportBug}
              loading={isSubmitting}
              className="flex-1 ml-2"
            >
              Submit Report
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeView>
  );
}
