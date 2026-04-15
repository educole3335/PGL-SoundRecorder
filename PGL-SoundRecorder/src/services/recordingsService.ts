import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

import { StoredRecording } from '../types/recording';

const STORAGE_KEY = '@pgl-sound-recorder/recordings';

function parseJson<T>(rawValue: string | null, fallbackValue: T): T {
  if (!rawValue) {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallbackValue;
  }
}

async function readRecordings(): Promise<StoredRecording[]> {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEY);
  const recordings = parseJson<StoredRecording[]>(rawValue, []);

  return recordings.sort((first, second) => {
    return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
  });
}

async function writeRecordings(recordings: StoredRecording[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recordings));
}

function formatTitle(dateValue: string): string {
  return `Grabacion ${new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateValue))}`;
}

function getExtension(sourceUri: string): string {
  const cleanUri = sourceUri.split('?')[0];
  const extensionRegex = /\.([a-z0-9]+)$/i;
  const match = extensionRegex.exec(cleanUri);
  return match?.[1] ?? 'm4a';
}

async function ensureRecordingsDirectory(): Promise<string> {
  if (!FileSystem.documentDirectory) {
    throw new Error('Document directory is not available.');
  }

  const directory = `${FileSystem.documentDirectory}recordings`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  return directory;
}

async function filterMissingFiles(recordings: StoredRecording[]): Promise<StoredRecording[]> {
  const filteredRecordings: StoredRecording[] = [];

  for (const recording of recordings) {
    const info = await FileSystem.getInfoAsync(recording.uri);
    if (info.exists) {
      filteredRecordings.push(recording);
    }
  }

  if (filteredRecordings.length !== recordings.length) {
    await writeRecordings(filteredRecordings);
  }

  return filteredRecordings;
}

export async function getStoredRecordings(): Promise<StoredRecording[]> {
  const recordings = await readRecordings();
  return filterMissingFiles(recordings);
}

export async function saveRecordingFromUri(
  sourceUri: string,
  durationMs: number,
  customTitle?: string
): Promise<StoredRecording> {
  const directory = await ensureRecordingsDirectory();
  const createdAt = new Date().toISOString();
  const id = `recording-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const fileName = `${id}.${getExtension(sourceUri)}`;
  const destinationUri = `${directory}/${fileName}`;

  await FileSystem.copyAsync({ from: sourceUri, to: destinationUri });

  const newRecording: StoredRecording = {
    id,
    title: customTitle?.trim() ? customTitle.trim() : formatTitle(createdAt),
    uri: destinationUri,
    fileName,
    createdAt,
    durationMs,
  };

  const recordings = await readRecordings();
  await writeRecordings([newRecording, ...recordings]);

  return newRecording;
}

export async function deleteStoredRecording(recordingId: string): Promise<StoredRecording[]> {
  const recordings = await readRecordings();
  const targetRecording = recordings.find((recording) => recording.id === recordingId);

  if (targetRecording) {
    await FileSystem.deleteAsync(targetRecording.uri, { idempotent: true });
  }

  const nextRecordings = recordings.filter((recording) => recording.id !== recordingId);
  await writeRecordings(nextRecordings);

  return nextRecordings;
}

export async function clearStoredRecordings(): Promise<void> {
  const recordings = await readRecordings();

  for (const recording of recordings) {
    await FileSystem.deleteAsync(recording.uri, { idempotent: true });
  }

  await AsyncStorage.removeItem(STORAGE_KEY);
}