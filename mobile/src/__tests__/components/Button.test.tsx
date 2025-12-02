import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('should render with children text', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('should handle press events', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button onPress={onPressMock}>Click me</Button>);

    fireEvent.press(getByText('Click me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('should not call onPress when disabled', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button onPress={onPressMock} disabled>
        Click me
      </Button>
    );

    fireEvent.press(getByText('Click me'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('should not call onPress when loading', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button onPress={onPressMock} loading>
        Click me
      </Button>
    );

    fireEvent.press(getByText('Click me'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  // Helper to get the Pressable container (grandparent of text)
  const getButtonContainer = (element: any) => element.parent?.parent;

  it('should render with primary variant by default', () => {
    const { getByText } = render(<Button>Primary</Button>);
    const button = getButtonContainer(getByText('Primary'));
    expect(button?.props.className).toContain('bg-blue-600');
  });

  it('should render with secondary variant', () => {
    const { getByText } = render(<Button variant="secondary">Secondary</Button>);
    const button = getButtonContainer(getByText('Secondary'));
    expect(button?.props.className).toContain('bg-gray-600');
  });

  it('should render with outline variant', () => {
    const { getByText } = render(<Button variant="outline">Outline</Button>);
    const button = getButtonContainer(getByText('Outline'));
    expect(button?.props.className).toContain('border-2 border-blue-600');
  });

  it('should render with ghost variant', () => {
    const { getByText } = render(<Button variant="ghost">Ghost</Button>);
    const button = getButtonContainer(getByText('Ghost'));
    expect(button?.props.className).toContain('bg-transparent');
  });

  it('should render with danger variant', () => {
    const { getByText } = render(<Button variant="danger">Danger</Button>);
    const button = getButtonContainer(getByText('Danger'));
    expect(button?.props.className).toContain('bg-red-600');
  });

  it('should render with small size', () => {
    const { getByText } = render(<Button size="sm">Small</Button>);
    const button = getButtonContainer(getByText('Small'));
    expect(button?.props.className).toContain('px-3 py-2');
  });

  it('should render with medium size by default', () => {
    const { getByText } = render(<Button>Medium</Button>);
    const button = getButtonContainer(getByText('Medium'));
    expect(button?.props.className).toContain('px-4 py-3');
  });

  it('should render with large size', () => {
    const { getByText } = render(<Button size="lg">Large</Button>);
    const button = getButtonContainer(getByText('Large'));
    expect(button?.props.className).toContain('px-6 py-4');
  });

  it('should render full width when specified', () => {
    const { getByText } = render(<Button fullWidth>Full Width</Button>);
    const button = getButtonContainer(getByText('Full Width'));
    expect(button?.props.className).toContain('w-full');
  });

  it('should show loading indicator when loading', () => {
    const { UNSAFE_getByType } = render(<Button loading>Loading</Button>);
    const activityIndicator = UNSAFE_getByType('ActivityIndicator' as any);
    expect(activityIndicator).toBeTruthy();
  });

  it('should apply opacity when disabled', () => {
    const { getByText } = render(<Button disabled>Disabled</Button>);
    const button = getButtonContainer(getByText('Disabled'));
    expect(button?.props.className).toContain('opacity-50');
  });

  it('should apply opacity when loading', () => {
    const { getByText } = render(<Button loading>Loading</Button>);
    const button = getButtonContainer(getByText('Loading'));
    expect(button?.props.className).toContain('opacity-50');
  });
});
