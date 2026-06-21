import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onPress?: (event: any) => void;
  style?: any;
  disabled?: boolean;
  activeOpacity?: number;
}

export function AnimatedButton({
  children,
  onPress,
  style,
  disabled,
}: AnimatedButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        { opacity: disabled ? 0.5 : pressed ? 0.9 : 1.0 }
      ]}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
