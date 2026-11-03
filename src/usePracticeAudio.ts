import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { File } from 'expo-file-system';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

const playbackMode = {
  allowsRecording: false,
  playsInSilentMode: true,
  shouldPlayInBackground: false,
  allowsBackgroundRecording: false,
} as const;

// Only delete URIs created by this practice session, never other app files.
function deleteTemporaryRecording(uri: string) {
  try {
    if (Platform.OS === 'web') {
      if (uri.startsWith('blob:')) URL.revokeObjectURL(uri);
    } else {
      const file = new File(uri);
      if (file.exists) file.delete();
    }
  } catch {
    // A cache file may already have been removed by the operating system.
  }
}

export function usePracticeAudio() {
  const [busy, setBusy] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const alive = useRef(true);
  const pending = useRef<Promise<void> | null>(null);
  const cancelVersion = useRef(0);
  const speechVersion = useRef(0);
  const recording = useRef(false);
  const temporaryFiles = useRef(new Set<string>());
  const handleRecorderEvent = useRef<(failed: boolean) => void>(() => {});

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, status => {
    if (status.hasError || status.isFinished) handleRecorderEvent.current(status.hasError);
  });
  const recorderState = useAudioRecorderState(recorder, 250);
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const playerStatus = useAudioPlayerStatus(player);

  // A synchronous lock also prevents double taps before React has re-rendered.
  function run(task: () => Promise<void>) {
    if (pending.current || !alive.current) return Promise.resolve();
    setBusy(true);
    setError('');
    const operation = Promise.resolve().then(task).catch(() => {
      if (alive.current) setError('Không thể xử lý âm thanh. Hãy thử lại; bạn vẫn có thể tự nói và xem gợi ý.');
    }).finally(() => {
      pending.current = null;
      if (alive.current) setBusy(false);
    });
    pending.current = operation;
    return operation;
  }

  async function stopOutput() {
    speechVersion.current += 1;
    if (alive.current) setSpeakingKey(null);
    player.pause();
    await Speech.stop();
  }

  async function finishRecording() {
    if (!recording.current) return;
    recording.current = false;
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('No recording was produced');
      temporaryFiles.current.add(uri);
      if (alive.current) {
        player.replace(uri);
        setRecordingUri(uri);
      }
    } finally {
      if (alive.current) setIsRecording(false);
      await setAudioModeAsync(playbackMode);
    }
  }

  function discardFiles() {
    player.replace(null);
    temporaryFiles.current.forEach(deleteTemporaryRecording);
    temporaryFiles.current.clear();
    if (alive.current) setRecordingUri(null);
  }

  function startRecording() {
    const version = cancelVersion.current;
    const cancelled = () => !alive.current || version !== cancelVersion.current || AppState.currentState === 'background';
    return run(async () => {
      if (recording.current) return;
      await stopOutput();
      if (cancelled()) return;
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (cancelled()) return;
      if (!permission.granted) {
        setError(permission.canAskAgain
          ? 'Chưa có quyền micro. Bạn có thể thử cấp quyền lại hoặc tự nói mà không ghi âm.'
          : 'Quyền micro đang bị tắt. Hãy mở Cài đặt của điện thoại và cấp quyền micro cho ứng dụng (hoặc Expo Go).');
        return;
      }
      let prepared = false;
      try {
        await setAudioModeAsync({ ...playbackMode, allowsRecording: true });
        if (cancelled()) return;
        await recorder.prepareToRecordAsync();
        prepared = true;
        if (recorder.uri) temporaryFiles.current.add(recorder.uri);
        if (cancelled()) return;
        player.replace(null);
        setRecordingUri(null);
        recorder.record();
        recording.current = true;
        setIsRecording(true);
      } finally {
        if (!recording.current) {
          if (prepared) await recorder.stop().catch(() => {});
          await setAudioModeAsync(playbackMode);
        }
      }
    });
  }

  const stopRecording = () => run(finishRecording);

  function replay() {
    const version = cancelVersion.current;
    return run(async () => {
      if (recording.current || !recordingUri) return;
      const wasPlaying = player.playing;
      await stopOutput();
      if (wasPlaying) return;
      await setAudioModeAsync(playbackMode);
      await player.seekTo(0);
      if (alive.current && version === cancelVersion.current) player.play();
    });
  }

  function speak(key: string, text: string) {
    const version = cancelVersion.current;
    return run(async () => {
      if (recording.current) return;
      const wasSpeaking = speakingKey === key;
      await stopOutput();
      if (wasSpeaking) return;
      await setAudioModeAsync(playbackMode);
      if (!alive.current || version !== cancelVersion.current) return;
      const token = ++speechVersion.current;
      const current = () => alive.current && token === speechVersion.current;
      setSpeakingKey(key);
      try {
        Speech.speak(text, {
          language: 'en-US',
          rate: 0.85,
          onDone: () => { if (current()) setSpeakingKey(null); },
          onStopped: () => { if (current()) setSpeakingKey(null); },
          onError: () => {
            if (!current()) return;
            setSpeakingKey(null);
            setError('Không đọc được câu mẫu. Hãy kiểm tra âm lượng và giọng đọc tiếng Anh trong cài đặt điện thoại.');
          },
        });
      } catch (cause) {
        setSpeakingKey(null);
        throw cause;
      }
    });
  }

  const removeRecording = () => run(async () => {
    await stopOutput();
    await finishRecording();
    discardFiles();
  });

  const stopListening = () => run(stopOutput);

  // Navigation waits for microphone shutdown before mounting another question.
  const leave = (onLeave: () => void) => {
    cancelVersion.current += 1;
    const operation = pending.current ?? Promise.resolve();
    return operation.then(() => run(async () => {
      await stopOutput();
      await finishRecording();
      discardFiles();
      if (alive.current) onLeave();
    }));
  };

  handleRecorderEvent.current = failed => {
    if (!alive.current || !recording.current) return;
    // Unexpected termination (for example an audio interruption) must not leave
    // a permanent red "recording" indicator or a silently active microphone.
    recording.current = false;
    setIsRecording(false);
    if (failed) {
      setError('Ghi âm bị gián đoạn. Hãy thử ghi lại trong nơi yên tĩnh.');
    } else if (recorder.uri) {
      temporaryFiles.current.add(recorder.uri);
      player.replace(recorder.uri);
      setRecordingUri(recorder.uri);
    }
    void setAudioModeAsync(playbackMode).catch(() => {});
  };

  const interrupt = useRef(() => {});
  interrupt.current = () => {
    cancelVersion.current += 1;
    const operation = pending.current ?? Promise.resolve();
    void operation.then(() => run(async () => {
      await stopOutput();
      await finishRecording();
    }));
  };

  useEffect(() => {
    alive.current = true;
    const files = temporaryFiles.current;
    const subscription = AppState.addEventListener('change', state => {
      // The permission popup can briefly make the app inactive. Do not cancel
      // that request unless the app actually goes to the background.
      if (state === 'background' || (state === 'inactive' && !pending.current)) interrupt.current();
    });
    return () => {
      alive.current = false;
      cancelVersion.current += 1;
      speechVersion.current += 1;
      subscription.remove();
      void Speech.stop().catch(() => {});
      // Expo's recorder/player hooks release their native resources on unmount.
      files.forEach(deleteTemporaryRecording);
      files.clear();
    };
  }, []);

  const stopAtLimit = useRef(stopRecording);
  stopAtLimit.current = stopRecording;
  useEffect(() => {
    if (!isRecording) return;
    const timer = setTimeout(() => { void stopAtLimit.current(); }, 60_000);
    return () => clearTimeout(timer);
  }, [isRecording]);

  return {
    busy, isRecording, recordingUri, speakingKey,
    error: error || (playerStatus.error ? 'Không phát được bản thu. Hãy ghi âm lại.' : ''),
    durationMillis: recorderState.durationMillis,
    playing: playerStatus.playing,
    playbackReady: !!recordingUri && playerStatus.isLoaded,
    startRecording, stopRecording, replay, speak, stopListening, removeRecording, leave,
  };
}
