import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { type ViewProps } from 'react-native';

export interface ISafeViewProps extends ViewProps {
  children: React.ReactNode;
  edges?: Edge[];
}

export function SafeView({ children, edges, ...props }: ISafeViewProps) {
  return (
    <SafeAreaView {...props} edges={edges} className="flex-1 bg-white">
      {children}
    </SafeAreaView>
  );
}
