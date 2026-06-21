import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  slideUp?: boolean;
  slideOffset?: number;
  style?: any;
}

export function FadeInView({
  children,
  delay = 0,
  duration = 350,
  slideUp = true,
  slideOffset = 25,
  style,
}: FadeInViewProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(slideUp ? slideOffset : 0)).current;

  useEffect(() => {
    const animations = [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ];

    if (slideUp) {
      animations.push(
        Animated.spring(slideAnim, {
          toValue: 0,
          speed: 12,
          bounciness: 4,
          delay,
          useNativeDriver: true,
        })
      );
    }

    Animated.parallel(animations).start();
  }, [fadeAnim, slideAnim, delay, duration, slideUp]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
