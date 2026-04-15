import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import LoadingSpinner from '../components/LoadingSpinner';
import RecordingCard from '../components/RecordingCard';
import {
  deleteStoredRecording,
  getStoredRecordings,
  saveRecordingFromUri,
} from '../services/recordingsService';
import { StoredRecording } from '../types/recording';

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function getDefaultRecordingName(): string {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  return `Grabacion ${day}-${month} ${hours}:${minutes}`;
}

type MicGlyphProps = {
  size?: number;
  color?: string;
  isRecording?: boolean;
};

function MicGlyph({ size = 52, color = '#ffffff', isRecording = false }: Readonly<MicGlyphProps>) {
  return (
    <MaterialCommunityIcons
      name={isRecording ? 'record-rec' : 'microphone'}
      size={size}
      color={color}
    />
  );
}

function getFileExtension(sourceUri: string): string {
  const cleanUri = sourceUri.split('?')[0];
  const extensionRegex = /\.([a-z0-9]+)$/i;
  const match = extensionRegex.exec(cleanUri);
  return match?.[1] ?? 'm4a';
}

const ListSeparator = () => <View style={styles.separator} />;
const WAVE_KEYS = ['wave-a', 'wave-b', 'wave-c', 'wave-d', 'wave-e'] as const;

export default function RecorderScreen() {
  const [recordings, setRecordings] = useState<StoredRecording[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [message, setMessage] = useState('Toca para comenzar a grabar');
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [recordingName, setRecordingName] = useState('');
  const [pendingRecording, setPendingRecording] = useState<{ uri: string; durationMs: number } | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseValue = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const waveValues = useRef([
    new Animated.Value(0.28),
    new Animated.Value(0.45),
    new Animated.Value(0.35),
    new Animated.Value(0.52),
    new Animated.Value(0.3),
  ]).current;

  const helperText = useMemo(() => {
    if (isLoadingInitial) {
      return 'Cargando grabaciones guardadas...';
    }

    if (isRecording) {
      return `Grabando ${formatClock(elapsedSeconds)}`;
    }

    return message;
  }, [elapsedSeconds, isLoadingInitial, isRecording, message]);

  useEffect(() => {
    const configureAudio = async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
      });
    };

    const loadRecordings = async () => {
      try {
        const storedRecordings = await getStoredRecordings();
        setRecordings(storedRecordings);
        setMessage(
          storedRecordings.length > 0 ? 'Pulsa una grabacion para reproducirla' : 'Aun no tienes grabaciones'
        );
      } catch {
        setMessage('No se pudieron cargar las grabaciones guardadas');
      } finally {
        setIsLoadingInitial(false);
      }
    };

    void configureAudio().catch(() => {
      setMessage('No se pudo configurar el audio del dispositivo');
    });

    void loadRecordings();

    return () => {
      clearTimer();
      void unloadSound();

      if (recordingRef.current) {
        void recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation | null = null;
    let scaleAnimation: Animated.CompositeAnimation | null = null;

    if (isRecording) {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 750,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 0,
            duration: 750,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );

      scaleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(buttonScale, {
            toValue: 1.05,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(buttonScale, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();
      scaleAnimation.start();
    } else {
      pulseValue.setValue(0);
      buttonScale.setValue(1);
    }

    return () => {
      pulseAnimation?.stop();
      scaleAnimation?.stop();
    };
  }, [buttonScale, isRecording, pulseValue]);

  useEffect(() => {
    const waveAnimations: Animated.CompositeAnimation[] = [];

    if (isRecording) {
      waveValues.forEach((waveValue, index) => {
        const loopAnimation = Animated.loop(
          Animated.sequence([
            Animated.delay(index * 90),
            Animated.timing(waveValue, {
              toValue: 1,
              duration: 300,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(waveValue, {
              toValue: 0.22,
              duration: 320,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        );

        waveAnimations.push(loopAnimation);
        loopAnimation.start();
      });
    } else {
      waveValues.forEach((waveValue, index) => {
        waveValue.setValue(index % 2 === 0 ? 0.25 : 0.38);
      });
    }

    return () => {
      waveAnimations.forEach((animation) => {
        animation.stop();
      });
    };
  }, [isRecording, waveValues]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);
  };

  const unloadSound = async () => {
    if (!soundRef.current) {
      setPlayingId(null);
      return;
    }

    try {
      await soundRef.current.unloadAsync();
    } finally {
      soundRef.current = null;
      setPlayingId(null);
    }
  };

  const startRecording = async () => {
    if (isRequestingPermission || isSaving || isRecording) {
      return;
    }

    try {
      setIsRequestingPermission(true);
      setMessage('Solicitando permisos de grabacion...');

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setMessage('Debes permitir el acceso al microfono para grabar');
        return;
      }

      await unloadSound();
      setElapsedSeconds(0);

      const createdRecording = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = createdRecording.recording;
      setIsRecording(true);
      setMessage('Grabando...');
      startTimer();
    } catch {
      setMessage('Ocurrio un error al iniciar la grabacion');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const stopRecording = async () => {
    const activeRecording = recordingRef.current;

    if (!activeRecording) {
      return;
    }

    try {
      setIsSaving(true);
      clearTimer();

      await activeRecording.stopAndUnloadAsync();
      recordingRef.current = null;

      const sourceUri = activeRecording.getURI();
      const durationMs = elapsedSeconds * 1000;

      setIsRecording(false);
      setIsSaving(false);

      if (!sourceUri) {
        setMessage('No se pudo guardar la grabacion');
        return;
      }

      if (!FileSystem.documentDirectory) {
        setMessage('No se pudo preparar el archivo para guardar');
        return;
      }

      const pendingDirectory = `${FileSystem.documentDirectory}pending-recordings`;
      await FileSystem.makeDirectoryAsync(pendingDirectory, { intermediates: true });
      const pendingUri = `${pendingDirectory}/pending-${Date.now()}.${getFileExtension(sourceUri)}`;
      await FileSystem.copyAsync({ from: sourceUri, to: pendingUri });

      setPendingRecording({ uri: pendingUri, durationMs });
      setRecordingName(getDefaultRecordingName());
      setIsNameModalVisible(true);
      setMessage('Elige un nombre para guardar la grabacion');
    } catch {
      setMessage('Ocurrio un error al detener la grabacion');
    } finally {
      setIsRecording(false);
      setIsSaving(false);
    }
  };

  const confirmRecordingName = async () => {
    if (!pendingRecording) {
      return;
    }

    try {
      setIsSaving(true);
      const finalRecordingName = recordingName.trim() || getDefaultRecordingName();
      const savedRecording = await saveRecordingFromUri(
        pendingRecording.uri,
        pendingRecording.durationMs,
        finalRecordingName
      );
      await FileSystem.deleteAsync(pendingRecording.uri, { idempotent: true });
      setRecordings((currentRecordings) => [savedRecording, ...currentRecordings]);
      setMessage('Grabacion guardada correctamente');
      setIsNameModalVisible(false);
      setPendingRecording(null);
      setRecordingName('');
    } catch {
      setMessage('No se pudo guardar la grabacion');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelRecordingName = () => {
    if (pendingRecording?.uri) {
      void FileSystem.deleteAsync(pendingRecording.uri, { idempotent: true });
    }

    setIsNameModalVisible(false);
    setPendingRecording(null);
    setRecordingName('');
    setMessage('Grabacion descartada');
  };

  const playRecording = async (recording: StoredRecording) => {
    if (playingId === recording.id) {
      return;
    }

    try {
      await unloadSound();
      setMessage('Reproduciendo grabacion...');
      setPlayingId(recording.id);

      const { sound } = await Audio.Sound.createAsync({ uri: recording.uri });
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          return;
        }

        if (status.didJustFinish) {
          setMessage('Reproduccion terminada');
          setPlayingId(null);
        }
      });

      await sound.playAsync();
    } catch {
      setMessage('No se pudo reproducir la grabacion');
      setPlayingId(null);
    }
  };

  const deleteRecording = async (recordingId: string) => {
    try {
      if (playingId === recordingId) {
        await unloadSound();
      }

      const nextRecordings = await deleteStoredRecording(recordingId);
      setRecordings(nextRecordings);
      setMessage(nextRecordings.length > 0 ? 'Grabacion eliminada' : 'Aun no tienes grabaciones');
    } catch {
      setMessage('No se pudo borrar la grabacion');
    }
  };

  let recordButtonLabel = 'Grabar';
  if (isLoadingInitial) {
    recordButtonLabel = 'Cargando';
  } else if (isRecording || isRequestingPermission || isSaving) {
    recordButtonLabel = 'Grabando';
  }

  const recordButtonDisabled =
    isLoadingInitial || isRequestingPermission || isSaving || isNameModalVisible;
  const saveButtonDisabled = isSaving || !pendingRecording;

  const recordButtonScale = buttonScale.interpolate({
    inputRange: [1, 1.05],
    outputRange: [1, 1.05],
  });

  const pulseScale = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const pulseOpacity = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0],
  });

  const renderContent = () => {
    if (isLoadingInitial) {
      return (
        <View style={styles.loadingState}>
          <LoadingSpinner label="Cargando grabaciones" color="#b81a57" size={42} />
        </View>
      );
    }

    return (
      <>
        <View style={styles.heroSection}>
          <View style={styles.heroHeader}>
            <Text style={styles.title}>Grabadora</Text>
          </View>

          <View style={styles.recordSection}>
            <View style={styles.recordStage}>
            {isRecording && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.pulse,
                  {
                    opacity: pulseOpacity,
                    transform: [{ scale: pulseScale }],
                  },
                ]}
              />
            )}

            <Animated.View
              style={[
                styles.recordButtonWrapper,
                {
                  transform: [{ scale: recordButtonScale }],
                },
              ]}
            >
              <Pressable
                onPress={isRecording ? stopRecording : startRecording}
                disabled={recordButtonDisabled}
                style={({ pressed }) => [
                  styles.recordButton,
                  isRecording && styles.recordButtonActive,
                  pressed && styles.recordButtonPressed,
                ]}
              >
                {isRequestingPermission || isSaving ? (
                  <LoadingSpinner label="" color="#ffffff" size={26} />
                ) : (
                  <MicGlyph size={54} color="#ffffff" isRecording={isRecording} />
                )}
              </Pressable>
            </Animated.View>
            </View>

            <Text style={styles.helperText}>{helperText}</Text>
            <Text style={styles.clock}>{formatClock(elapsedSeconds)}</Text>

            {isRecording && (
              <View style={styles.waveContainer}>
                {waveValues.map((waveValue, index) => {
                  const waveOpacity = waveValue.interpolate({
                    inputRange: [0.2, 1],
                    outputRange: [0.35, 1],
                  });

                  return (
                    <Animated.View
                      key={WAVE_KEYS[index]}
                      style={[
                        styles.waveBar,
                        {
                          opacity: waveOpacity,
                          transform: [{ scaleY: waveValue }],
                        },
                      ]}
                    />
                  );
                })}
              </View>
            )}
          </View>
        </View>

        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Mis grabaciones</Text>
            <Text style={styles.listCount}>{recordings.length}</Text>
          </View>

          {recordings.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MicGlyph size={44} color="#c8c1b8" isRecording={false} />
              </View>
              <Text style={styles.emptyTitle}>Aun no tienes grabaciones</Text>
              <Text style={styles.emptyText}>Graba un audio y quedara guardado en el dispositivo.</Text>
            </View>
          ) : (
            <FlatList
              data={recordings}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <RecordingCard
                  recording={item}
                  isPlaying={playingId === item.id}
                  onPlay={() => {
                    void playRecording(item);
                  }}
                  onDelete={() => {
                    void deleteRecording(item.id);
                  }}
                />
              )}
              ItemSeparatorComponent={ListSeparator}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.recordingsListContent}
            />
          )}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.card}>{renderContent()}</View>

      <Modal
        animationType="fade"
        transparent
        visible={isNameModalVisible}
        onRequestClose={cancelRecordingName}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nombre de la grabacion</Text>
            <Text style={styles.modalHint}>Como quieres llamar este audio?</Text>

            <TextInput
              style={styles.modalInput}
              value={recordingName}
              onChangeText={setRecordingName}
              placeholder="Ejemplo: Nota de voz"
              placeholderTextColor="#9ca3af"
              maxLength={50}
              autoFocus
            />

            <View style={styles.modalActions}>
              <Pressable onPress={cancelRecordingName} style={({ pressed }) => [styles.modalButton, pressed && styles.modalButtonPressed]}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  void confirmRecordingName();
                }}
                disabled={saveButtonDisabled}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  saveButtonDisabled && styles.disabledButton,
                  pressed && styles.modalButtonPressed,
                ]}
              >
                <Text style={styles.modalButtonText}>{isSaving ? 'Guardando...' : 'Guardar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {!isLoadingInitial && (
        <View style={styles.footerNotice}>
          <Text style={styles.footerText}>{message}</Text>
          <Text style={styles.footerHint}>{recordButtonLabel}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2f352f',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
  },
  card: {
    flex: 1,
    borderRadius: 34,
    backgroundColor: '#ffffff',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 18,
    shadowColor: '#08111d',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 8,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    gap: 18,
    paddingBottom: 18,
  },
  heroHeader: {
    width: '100%',
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
    color: '#111111',
  },
  recordSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 4,
    minHeight: 260,
  },
  recordStage: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulse: {
    position: 'absolute',
    width: 174,
    height: 174,
    borderRadius: 999,
    backgroundColor: '#b81a57',
  },
  recordButtonWrapper: {
    width: 122,
    height: 122,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#a40f51',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 5,
  },
  recordButton: {
    width: 122,
    height: 122,
    borderRadius: 999,
    backgroundColor: '#b81a57',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: '#ffffff',
  },
  recordButtonActive: {
    backgroundColor: '#ab124f',
  },
  recordButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  helperText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
  clock: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#8d99a8',
    textAlign: 'center',
    alignSelf: 'center',
    width: '100%',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    height: 34,
  },
  waveBar: {
    width: 6,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#b81a57',
  },
  listSection: {
    flex: 1,
    paddingTop: 2,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#b7b2a8',
  },
  listCount: {
    minWidth: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#f3efe6',
    color: '#7c756d',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 28,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  emptyIcon: {
    opacity: 0.18,
    transform: [{ scale: 0.88 }],
  },
  emptyTitle: {
    color: '#a79f96',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyText: {
    color: '#c5beb6',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  recordingsListContent: {
    paddingBottom: 10,
  },
  separator: {
    height: 10,
  },
  footerNotice: {
    marginTop: 12,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    color: '#e8e3da',
    fontSize: 12,
    textAlign: 'center',
  },
  footerHint: {
    color: '#b9b1a3',
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    padding: 18,
    gap: 12,
  },
  modalTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  modalHint: {
    color: '#6b7280',
    fontSize: 14,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#9ca3af',
  },
  modalButtonPrimary: {
    backgroundColor: '#b81a57',
  },
  modalButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  modalButtonPressed: {
    opacity: 0.88,
  },
  disabledButton: {
    opacity: 0.45,
  },
});