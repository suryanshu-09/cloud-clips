import { SafeAreaView } from 'react-native-safe-area-context';
import { type ViewProps } from 'react-native';

interface ISafeViewProps extends ViewProps {
  children: React.ReactNode;
}

export function SafeView({ children, ...props }: ISafeViewProps) {
  return (
    <SafeAreaView {...props} className="flex-1 bg-white">
      {children}
    </SafeAreaView>
  );
}
