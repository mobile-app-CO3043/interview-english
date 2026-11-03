/// <reference types="jest" />
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import { AppState } from 'react-native';
import * as Speech from 'expo-speech';
import { AudioModule, setAudioModeAsync } from 'expo-audio';
import PracticeScreen from '../PracticeScreen';
import { usePracticeAudio } from '../usePracticeAudio';

const mockRecorder = {
  uri: null as string | null,
  prepareToRecordAsync: jest.fn(),
  record: jest.fn(),
  stop: jest.fn(),
};
const mockRecorderState = { durationMillis: 0 };
const mockPlayer = {
  playing: false,
  pause: jest.fn(),
  play: jest.fn(),
  replace: jest.fn(),
  seekTo: jest.fn(),
};
const mockPlayerStatus = { playing: false, isLoaded: true, error: null };
let mockRecorderEvent: (status: { hasError: boolean; isFinished: boolean }) => void;
const mockDelete = jest.fn();

jest.mock('expo-audio', () => ({
  AudioModule: { requestRecordingPermissionsAsync: jest.fn() },
  RecordingPresets: { HIGH_QUALITY: {} },
  setAudioModeAsync: jest.fn(),
  useAudioPlayer: () => mockPlayer,
  useAudioPlayerStatus: () => mockPlayerStatus,
  useAudioRecorder: (_options: unknown, callback: typeof mockRecorderEvent) => {
    mockRecorderEvent = callback;
    return mockRecorder;
  },
  useAudioRecorderState: () => mockRecorderState,
}));
jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation((uri: string) => ({ exists: true, delete: () => mockDelete(uri) })),
}));

let onAppState: (state: 'active' | 'background' | 'inactive') => void;
beforeEach(() => {
  jest.clearAllMocks();
  mockRecorder.uri = null;
  mockRecorderState.durationMillis = 0;
  mockPlayer.playing = false;
  mockPlayer.pause.mockImplementation(() => { mockPlayer.playing = false; });
  mockPlayer.play.mockImplementation(() => { mockPlayer.playing = true; });
  mockPlayer.seekTo.mockResolvedValue(undefined);
  mockRecorder.prepareToRecordAsync.mockImplementation(async () => { mockRecorder.uri = 'file:///cache/answer.m4a'; });
  mockRecorder.stop.mockResolvedValue(undefined);
  jest.mocked(AudioModule.requestRecordingPermissionsAsync).mockResolvedValue({ granted: true, canAskAgain: true } as never);
  jest.mocked(setAudioModeAsync).mockResolvedValue(undefined);
  jest.mocked(Speech.stop).mockResolvedValue(undefined);
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => {
    onAppState = callback;
    return { remove: jest.fn() };
  });
});

afterEach(() => { jest.useRealTimers(); });

test('does not ask for microphone permission just by opening a question', async () => {
  const { result } = await renderHook(usePracticeAudio);
  expect(result.current.recordingUri).toBeNull();
  expect(AudioModule.requestRecordingPermissionsAsync).not.toHaveBeenCalled();
});

test('permission denial gives a useful message and never starts recording', async () => {
  jest.mocked(AudioModule.requestRecordingPermissionsAsync).mockResolvedValue({ granted: false, canAskAgain: false } as never);
  const { result } = await renderHook(usePracticeAudio);
  await act(() => result.current.startRecording());
  expect(result.current.error).toContain('Cài đặt');
  expect(result.current.busy).toBe(false);
  expect(mockRecorder.record).not.toHaveBeenCalled();
});

test('records, stops, and can play the same recording from the beginning twice', async () => {
  const { result } = await renderHook(usePracticeAudio);
  await act(() => result.current.startRecording());
  expect(result.current.isRecording).toBe(true);
  await act(() => result.current.stopRecording());
  expect(result.current.isRecording).toBe(false);
  expect(result.current.recordingUri).toBe('file:///cache/answer.m4a');
  expect(setAudioModeAsync).toHaveBeenLastCalledWith(expect.objectContaining({ allowsRecording: false }));
  await act(() => result.current.replay());
  mockPlayer.playing = false; // The audio finishes playing.
  await act(() => result.current.replay());
  expect(mockPlayer.seekTo).toHaveBeenNthCalledWith(1, 0);
  expect(mockPlayer.seekTo).toHaveBeenNthCalledWith(2, 0);
  expect(mockPlayer.play).toHaveBeenCalledTimes(2);
});

test('stops sample speech before using the microphone and forbids speech during recording', async () => {
  const { result } = await renderHook(usePracticeAudio);
  await act(() => result.current.speak('answer', 'I built an app.'));
  expect(Speech.speak).toHaveBeenCalledWith('I built an app.', expect.objectContaining({ language: 'en-US' }));
  await act(() => result.current.startRecording());
  expect(result.current.speakingKey).toBeNull();
  expect(Speech.stop).toHaveBeenCalledTimes(2);
  await act(() => result.current.speak('question', 'Tell me about yourself.'));
  expect(Speech.speak).toHaveBeenCalledTimes(1);
});

test('fast double taps create only one recording', async () => {
  const { result } = await renderHook(usePracticeAudio);
  await act(async () => {
    await Promise.all([result.current.startRecording(), result.current.startRecording()]);
  });
  expect(AudioModule.requestRecordingPermissionsAsync).toHaveBeenCalledTimes(1);
  expect(mockRecorder.record).toHaveBeenCalledTimes(1);
});

test('prepare failure restores playback mode and permits retry', async () => {
  mockRecorder.prepareToRecordAsync.mockRejectedValueOnce(new Error('Microphone busy'));
  const { result } = await renderHook(usePracticeAudio);
  await act(() => result.current.startRecording());
  expect(result.current.error).not.toBe('');
  expect(result.current.busy).toBe(false);
  expect(setAudioModeAsync).toHaveBeenLastCalledWith(expect.objectContaining({ allowsRecording: false }));
  await act(() => result.current.startRecording());
  expect(result.current.isRecording).toBe(true);
});

test('missing recording URI is reported instead of enabling empty playback', async () => {
  const { result } = await renderHook(usePracticeAudio);
  await act(() => result.current.startRecording());
  mockRecorder.uri = null;
  await act(() => result.current.stopRecording());
  expect(result.current.error).not.toBe('');
  expect(result.current.recordingUri).toBeNull();
  expect(result.current.isRecording).toBe(false);
});

test('backgrounding stops recording and keeps the answer available to replay', async () => {
  const { result } = await renderHook(usePracticeAudio);
  await act(() => result.current.startRecording());
  await act(async () => { onAppState('background'); });
  expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
  expect(result.current.isRecording).toBe(false);
  expect(result.current.recordingUri).not.toBeNull();
});

test('does not start recording if backgrounded during the permission request', async () => {
  let grant!: (permission: never) => void;
  jest.mocked(AudioModule.requestRecordingPermissionsAsync).mockImplementationOnce(() => new Promise(resolve => { grant = resolve; }));
  const { result } = await renderHook(usePracticeAudio);
  await act(async () => { void result.current.startRecording(); });
  await act(async () => {
    onAppState('background');
    grant({ granted: true, canAskAgain: true } as never);
  });
  expect(mockRecorder.record).not.toHaveBeenCalled();
  expect(result.current.busy).toBe(false);
});

test('a recording interruption clears the recording indicator', async () => {
  const { result } = await renderHook(usePracticeAudio);
  await act(() => result.current.startRecording());
  await act(async () => { mockRecorderEvent({ hasError: true, isFinished: true }); });
  expect(result.current.isRecording).toBe(false);
  expect(result.current.error).toContain('gián đoạn');
});

test('each recording gets its own 60-second limit', async () => {
  const { result } = await renderHook(usePracticeAudio);
  jest.useFakeTimers();
  await act(() => result.current.startRecording());
  await act(async () => { jest.advanceTimersByTime(60_000); });
  expect(result.current.isRecording).toBe(false);
  mockRecorderState.durationMillis = 60_000;
  await act(() => result.current.startRecording());
  expect(result.current.isRecording).toBe(true);
  await act(async () => { jest.advanceTimersByTime(60_000); });
  expect(result.current.isRecording).toBe(false);
  expect(mockRecorder.stop).toHaveBeenCalledTimes(2);
});

test('leaving a question stops audio and removes only its own temporary recording', async () => {
  const onLeave = jest.fn();
  const { result } = await renderHook(usePracticeAudio);
  await act(() => result.current.startRecording());
  await act(() => result.current.leave(onLeave));
  expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
  expect(mockDelete).toHaveBeenCalledWith('file:///cache/answer.m4a');
  expect(result.current.recordingUri).toBeNull();
  expect(onLeave).toHaveBeenCalledTimes(1);
});

test('speech errors clear the stop label and give a recovery message', async () => {
  const { result } = await renderHook(usePracticeAudio);
  await act(() => result.current.speak('answer', 'I built an app.'));
  const options = jest.mocked(Speech.speak).mock.calls[0][1]!;
  await act(async () => { (options.onError as (error: Error) => void)(new Error('No voice')); });
  expect(result.current.speakingKey).toBeNull();
  expect(result.current.error).toContain('giọng đọc tiếng Anh');
});

test('old speech callbacks cannot clear the label of a newer sample', async () => {
  const { result } = await renderHook(usePracticeAudio);
  await act(() => result.current.speak('question', 'Tell me about yourself.'));
  const firstOptions = jest.mocked(Speech.speak).mock.calls[0][1]!;
  await act(() => result.current.speak('answer', 'I am a student.'));
  await act(async () => { (firstOptions.onStopped as () => void)(); });
  expect(result.current.speakingKey).toBe('answer');
});

test('deleting a recording clears playback and never navigates or changes progress', async () => {
  const { result } = await renderHook(usePracticeAudio);
  await act(() => result.current.startRecording());
  await act(() => result.current.stopRecording());
  await act(() => result.current.removeRecording());
  expect(mockPlayer.replace).toHaveBeenLastCalledWith(null);
  expect(result.current.playbackReady).toBe(false);
  expect(mockDelete).toHaveBeenCalledWith('file:///cache/answer.m4a');
});

test('unmount stops speech and cleans temporary files', async () => {
  const { result, unmount } = await renderHook(usePracticeAudio);
  await act(() => result.current.startRecording());
  await act(() => result.current.stopRecording());
  await act(() => result.current.speak('answer', 'I am a student.'));
  jest.mocked(Speech.stop).mockClear();
  await unmount();
  expect(Speech.stop).toHaveBeenCalledTimes(1);
  expect(mockDelete).toHaveBeenCalledWith('file:///cache/answer.m4a');
});

test('the learner can reveal and listen to the example without microphone permission', async () => {
  await render(<PracticeScreen title="Giới thiệu bản thân" number="BÀI 01" color="#4F46E5" index={0} total={3}
    prompt={{ question: 'Tell me about yourself.', vietnamese: 'Giới thiệu bản thân.', phrase: 'I am a student.', meaning: 'Tôi là sinh viên.', answer: 'I am a student. I built an app.', translation: 'Tôi là sinh viên. Tôi đã làm một app.' }}
    onBack={jest.fn()} onMark={jest.fn()} />);
  expect(screen.queryByText('I am a student. I built an app.')).toBeNull();
  await fireEvent.press(screen.getByText('Xem câu trả lời mẫu'));
  await fireEvent.press(screen.getByText('🔊 Nghe câu trả lời mẫu'));
  expect(Speech.speak).toHaveBeenCalledWith('I am a student. I built an app.', expect.any(Object));
  expect(AudioModule.requestRecordingPermissionsAsync).not.toHaveBeenCalled();
});
