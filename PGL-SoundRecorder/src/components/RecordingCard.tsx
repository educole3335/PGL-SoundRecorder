import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { StoredRecording } from '../types/recording';

type RecordingCardProps = {
  recording: StoredRecording;
  isPlaying: boolean;
  onPlay: () => void;
  onDelete: () => void;
};

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateValue));
}

export default function RecordingCard({ recording, isPlaying, onPlay, onDelete }: RecordingCardProps) {
  const appearValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(appearValue, {
      toValue: 1,
      friction: 8,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [appearValue]);

  const translateY = appearValue.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: appearValue,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.textBlock}>
        <Text style={styles.title}>{recording.title}</Text>
        <Text style={styles.meta}>{formatDate(recording.createdAt)}</Text>
        <Text style={styles.meta}>{formatDuration(recording.durationMs)}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onPlay}
          style={({ pressed }) => [
            styles.actionButton,
            styles.playButton,
            pressed && styles.pressed,
            isPlaying && styles.playingButton,
          ]}
        >
          <Text style={styles.actionText}>{isPlaying ? '...' : 'Play'}</Text>
        </Pressable>

        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [styles.actionButton, styles.deleteButton, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>Borrar</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    backgroundColor: '#fffdfa',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#f0e6dc',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  meta: {
    fontSize: 12,
    color: '#6b7280',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    minWidth: 70,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#8a0f44',
  },
  deleteButton: {
    backgroundColor: '#c63c49',
  },
  playingButton: {
    backgroundColor: '#5b0a2d',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});