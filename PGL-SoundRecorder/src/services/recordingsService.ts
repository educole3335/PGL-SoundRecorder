import * as FileSystem from 'expo-file-system/legacy';

import { StoredRecording } from '../types/recording';

const RECORDINGS_METADATA_FILE = `${FileSystem.documentDirectory}recordings-metadata.json`;

function parseJson<T>(rawValue: string | null, fallbackValue: T): T {
  if (!rawValue) {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch (error) {
    console.warn('Error parsing JSON:', error);
    return fallbackValue;
  }
}

async function readRecordings(): Promise<StoredRecording[]> {
  try {
    if (!RECORDINGS_METADATA_FILE) {
      return [];
    }

    const fileInfo = await FileSystem.getInfoAsync(RECORDINGS_METADATA_FILE);
    if (!fileInfo.exists) {
      return [];
    }

    const rawValue = await FileSystem.readAsStringAsync(RECORDINGS_METADATA_FILE);
    const recordings = parseJson<StoredRecording[]>(rawValue, []);

    return recordings.sort((first, second) => {
      return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
    });
  } catch (error) {
    console.warn('Error reading recordings metadata:', error);
    return [];
  }
}

async function writeRecordings(recordings: StoredRecording[]): Promise<void> {
  try {
    if (!RECORDINGS_METADATA_FILE) {
      throw new Error('Document directory is not available.');
    }

    const jsonData = JSON.stringify(recordings, null, 2);
    await FileSystem.writeAsStringAsync(RECORDINGS_METADATA_FILE, jsonData);
  } catch (error) {
    console.error('Error writing recordings metadata:', error);
    throw error;
  }
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

  const sourceInfo = await FileSystem.getInfoAsync(sourceUri);
  if (!sourceInfo.exists) {
    throw new Error('The recording source file does not exist.');
  }

  try {
    await FileSystem.copyAsync({ from: sourceUri, to: destinationUri });
  } catch {
    await FileSystem.moveAsync({ from: sourceUri, to: destinationUri });
  }

  // Validar que el archivo se guardó correctamente
  const savedFileInfo = await FileSystem.getInfoAsync(destinationUri);
  if (!savedFileInfo.exists) {
    throw new Error('Failed to save recording file to destination.');
  }

  const newRecording: StoredRecording = {
    id,
    title: customTitle?.trim() ? customTitle.trim() : formatTitle(createdAt),
    uri: destinationUri,
    fileName,
    createdAt,
    durationMs,
  };

  const recordings = await readRecordings();
  const updatedRecordings = [newRecording, ...recordings];
  await writeRecordings(updatedRecordings);

  // Validar que se guardó en el archivo de metadatos
  const verificacion = await readRecordings();
  if (!verificacion.find((r) => r.id === id)) {
    throw new Error('Failed to save recording metadata to file.');
  }

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

  if (RECORDINGS_METADATA_FILE) {
    await FileSystem.deleteAsync(RECORDINGS_METADATA_FILE, { idempotent: true });
  }
}