import * as Haptics from 'expo-haptics';

function safeTrigger(effect: () => Promise<void>): void {
  effect().catch(() => {
    // no-op
  });
}

export function triggerSelectionHaptic(): void {
  safeTrigger(() => Haptics.selectionAsync());
}

export function triggerImpactHaptic(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light
): void {
  safeTrigger(() => Haptics.impactAsync(style));
}

export function triggerNotificationHaptic(
  type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success
): void {
  safeTrigger(() => Haptics.notificationAsync(type));
}
