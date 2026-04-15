import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { StoredRecording } from '../types/recording';

type RecordingCardProps = {
  recording: StoredRecording;
  isPlaying: boolean;
  isPaused: boolean;
  playbackProgress: { position: number; duration: number } | null;
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

export default function RecordingCard({
  recording,
  isPlaying,
  isPaused,
  playbackProgress,
  onPlay,
  onDelete,
}: RecordingCardProps) {
  const appearValue = useRef(new Animated.Value(0)).current;
  const playButtonScale = useRef(new Animated.Value(1)).current;
  const deleteButtonScale = useRef(new Animated.Value(1)).current;
  const deleteButtonRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(appearValue, {
      toValue: 1,
      friction: 8,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [appearValue]);

  // Animar el botón de play cuando cambia estado
  useEffect(() => {
    Animated.sequence([
      Animated.timing(playButtonScale, {
        toValue: 1.12,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(playButtonScale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isPaused, isPlaying, playButtonScale]);

  const handleDeletePress = () => {
    // Animar el botón de delete con escala y rotación
    Animated.parallel([
      Animated.sequence([
        Animated.timing(deleteButtonScale, {
          toValue: 0.92,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(deleteButtonScale, {
          toValue: 1.08,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(deleteButtonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(deleteButtonRotate, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    onDelete();
  };

  const translateY = appearValue.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  const deleteRotation = deleteButtonRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '12deg'],
  });

  const progressPercent =
    playbackProgress && playbackProgress.duration > 0
      ? (playbackProgress.position / playbackProgress.duration) * 100
      : 0;

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
      <View style={styles.mainContent}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{recording.title}</Text>
          <Text style={styles.meta}>{formatDate(recording.createdAt)}</Text>
          <Text style={styles.meta}>
            {(isPlaying || isPaused) && playbackProgress
              ? `${formatDuration(playbackProgress.position)} / ${formatDuration(recording.durationMs)}`
              : formatDuration(recording.durationMs)}
          </Text>
        </View>

        <View style={styles.actions}>
          <Animated.View
            style={[
              styles.animatedButtonWrapper,
              {
                transform: [{ scale: playButtonScale }],
              },
            ]}
          >
            <Pressable
              onPress={onPlay}
              style={({ pressed }) => [
                styles.actionButton,
                styles.playButton,
                pressed && styles.pressed,
                (isPlaying || isPaused) && styles.playingButton,
              ]}
            >
              <MaterialCommunityIcons
                name={isPlaying ? 'pause' : 'play'}
                size={20}
                color="#ffffff"
              />
            </Pressable>
          </Animated.View>

          <Animated.View
            style={[
              styles.animatedButtonWrapper,
              {
                transform: [
                  { scale: deleteButtonScale },
                  { rotate: deleteRotation },
                ],
              },
            ]}
          >
            <Pressable
              onPress={handleDeletePress}
              style={({ pressed }) => [
                styles.actionButton,
                styles.deleteButton,
                pressed && styles.deleteButtonPressed,
              ]}
            >
              <MaterialCommunityIcons name="trash-can" size={20} color="#c63c49" />
            </Pressable>
          </Animated.View>
        </View>
      </View>

      {(isPlaying || isPaused) && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressPercent}%`,
                },
              ]}
            />
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
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
    gap: 8,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  animatedButtonWrapper: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: '#8a0f44',
  },
  deleteButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#c63c49',
  },
  playingButton: {
    backgroundColor: '#5b0a2d',
    shadowColor: '#b81a57',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  deleteButtonPressed: {
    backgroundColor: '#c63c4922',
    opacity: 0.9,
  },
  pressed: {
    opacity: 0.75,
  },
  progressBarContainer: {
    paddingHorizontal: 0,
    paddingTop: 8,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#c63c49',
    borderRadius: 2,
  },
});