import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

type LoadingSpinnerProps = {
  label?: string;
  color?: string;
  size?: number;
};

export default function LoadingSpinner({
  label = 'Cargando...',
  color = '#b81a57',
  size = 34,
}: LoadingSpinnerProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    spinAnimation.start();
    pulseAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
    };
  }, [pulseValue, spinValue]);

  const rotation = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulseScale = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.06],
  });

  const pulseOpacity = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.18],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.orbit,
          {
            width: size,
            height: size,
            borderColor: `${color}22`,
            borderTopColor: color,
            transform: [{ rotate: rotation }, { scale: pulseScale }],
            opacity: pulseOpacity,
          },
        ]}
      />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  orbit: {
    borderRadius: 999,
    borderWidth: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});