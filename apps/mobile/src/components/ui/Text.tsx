import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { type, type TypeVariant } from '@/theme/typography';

interface TextProps extends RNTextProps {
  variant?: TypeVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export function Text({ variant = 'body', color, align, style, ...rest }: TextProps) {
  return <RNText {...rest} style={[type[variant], color ? { color } : null, align ? { textAlign: align } : null, style]} />;
}
