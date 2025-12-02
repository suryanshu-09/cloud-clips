import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('should render with placeholder', () => {
    const { getByPlaceholderText } = render(<Input placeholder="Enter text" />);
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('should render with label', () => {
    const { getByText } = render(<Input label="Username" />);
    expect(getByText('Username')).toBeTruthy();
  });

  it('should render with error message', () => {
    const { getByText } = render(<Input error="This field is required" />);
    expect(getByText('This field is required')).toBeTruthy();
  });

  it('should render with helper text', () => {
    const { getByText } = render(<Input helperText="Enter your email address" />);
    expect(getByText('Enter your email address')).toBeTruthy();
  });

  it('should not show helper text when error is present', () => {
    const { queryByText, getByText } = render(
      <Input error="Error message" helperText="Helper text" />
    );
    expect(getByText('Error message')).toBeTruthy();
    expect(queryByText('Helper text')).toBeNull();
  });

  it('should handle text changes', () => {
    const onChangeTextMock = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter text" onChangeText={onChangeTextMock} />
    );

    fireEvent.changeText(getByPlaceholderText('Enter text'), 'Hello World');
    expect(onChangeTextMock).toHaveBeenCalledWith('Hello World');
  });

  it('should handle focus events', () => {
    const onFocusMock = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter text" onFocus={onFocusMock} />
    );

    fireEvent(getByPlaceholderText('Enter text'), 'focus');
    expect(onFocusMock).toHaveBeenCalled();
  });

  it('should handle blur events', () => {
    const onBlurMock = jest.fn();
    const { getByPlaceholderText } = render(<Input placeholder="Enter text" onBlur={onBlurMock} />);

    fireEvent(getByPlaceholderText('Enter text'), 'blur');
    expect(onBlurMock).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    const { getByPlaceholderText } = render(<Input placeholder="Enter text" disabled />);
    const input = getByPlaceholderText('Enter text');
    expect(input.props.editable).toBe(false);
  });

  it('should render with left icon', () => {
    const LeftIcon = () => <Text testID="left-icon">L</Text>;
    const { getByTestId } = render(<Input leftIcon={<LeftIcon />} />);
    expect(getByTestId('left-icon')).toBeTruthy();
  });

  it('should render with right icon', () => {
    const RightIcon = () => <Text testID="right-icon">R</Text>;
    const { getByTestId } = render(<Input rightIcon={<RightIcon />} />);
    expect(getByTestId('right-icon')).toBeTruthy();
  });

  it('should apply fullWidth styles by default', () => {
    const { getByTestId } = render(<Input placeholder="Enter text" />);
    const container = getByTestId('input-container');
    expect(container.props.className).toContain('w-full');
  });

  it('should not apply fullWidth when set to false', () => {
    const { getByTestId } = render(<Input placeholder="Enter text" fullWidth={false} />);
    const container = getByTestId('input-container');
    // When fullWidth is false, className is empty string
    expect(container.props.className || '').not.toContain('w-full');
  });
});
