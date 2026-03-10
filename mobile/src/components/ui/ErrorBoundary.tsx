import React, { Component, type ReactNode } from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';

interface IErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface IErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<IErrorBoundaryProps, IErrorBoundaryState> {
  constructor(props: IErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): IErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 items-center justify-center p-6 bg-white">
          <Text allowFontScaling className="text-6xl mb-4">
            ⚠️
          </Text>
          <Text allowFontScaling className="text-xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </Text>
          <Text allowFontScaling className="text-base text-gray-600 text-center mb-6">
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Button onPress={this.handleReset} variant="primary">
            Try Again
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}
