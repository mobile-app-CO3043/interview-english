import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePracticeAudio } from './usePracticeAudio';

type Props = {
  title: string;
  number: string;
  color: string;
  index: number;
  total: number;
  prompt: { question: string; vietnamese: string; phrase: string; meaning: string; answer: string; translation: string };
  onBack: () => void;
  onMark: (status: 'spoke' | 'review') => Promise<void>;
};

function Action({ label, onPress, disabled = false, primary = false, color = '#4F46E5' }: {
  label: string; onPress: () => void; disabled?: boolean; primary?: boolean; color?: string;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} style={[s.button, primary && { backgroundColor: color, borderColor: color }, disabled && s.disabled]}>
    <Text style={[s.buttonText, primary && s.white]}>{label}</Text>
  </Pressable>;
}

export default function PracticeScreen({ title, number, color, index, total, prompt, onBack, onMark }: Props) {
  const [showAnswer, setShowAnswer] = useState(false);
  // Lưu lựa chọn tạm thời của câu hỏi hiện tại.
  const [assessment, setAssessment] = useState<
    'spoke' | 'review' | null
  >(null);
  // Hiển thị trạng thái và ngăn bấm xác nhận liên tiếp.
  const [isSaving, setIsSaving] = useState(false);
  const savingLock = useRef(false);
  const audio = usePracticeAudio();
  const back = useRef(() => {});
  back.current = () => {
    if (savingLock.current) return;
    void audio.leave(onBack);
   };
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      back.current();
      return true;
    });
    return () => subscription.remove();
  }, []);
  const blocked = audio.busy || audio.isRecording || isSaving;
  const seconds = Math.floor(audio.durationMillis / 1000);
  const timer = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  const listen = (key: string, text: string, label: string) => <Action
    label={audio.speakingKey === key ? '■ Dừng đọc mẫu' : label}
    disabled={blocked} onPress={() => { void audio.speak(key, text); }} />;

  return <SafeAreaView style={s.screen}>
    <StatusBar style="dark" />
    <View style={s.header}>
      <Pressable accessibilityRole="button" onPress={() => back.current()} hitSlop={10} disabled={audio.busy || isSaving}>
        <Text style={s.back}>‹ Quay lại bài học</Text>
      </Pressable>
      <Text style={[s.number, { color }]}>{number}</Text>
      <Text style={s.title}>{title}</Text>
      <Text style={s.muted}>Câu {index + 1}/{total}</Text>
    </View>
    <View style={s.track}><View style={[s.fill, { width: `${((index + 1) / total) * 100}%`, backgroundColor: color }]} /></View>
    <ScrollView contentContainerStyle={s.content}>
      <View style={[s.card, { borderWidth: 2, borderColor: color }]}>
        {/* Khi ghi âm, giữ câu hỏi và ẩn các phần phụ. */}
        {!audio.isRecording && (
          <Text style={s.label}>CÂU HỎI PHỎNG VẤN</Text>
        )}

        <Text style={audio.isRecording ? s.phrase : s.question}>
          {prompt.question}
        </Text>

        {!audio.isRecording && (
          <>
            <Text style={s.translation}>{prompt.vietnamese}</Text>
            {listen('question', prompt.question, '🔊 Nghe câu hỏi')}
          </>
        )}
      </View>

      {!showAnswer && <View style={[s.card, s.recorder]}>
        {/* Đổi màu và hướng dẫn theo trạng thái ghi âm. */}
        <Text
          style={[
            s.cardTitle,
            audio.isRecording && { color: '#DC2626' },
          ]}
        >
          {audio.isRecording
            ? '● Đang ghi âm'
            : audio.recordingUri
              ? '✓ Đã có bản thu'
              : '🎙️ Luyện câu trả lời của bạn'}
        </Text>

        <Text style={s.body}>
          {audio.isRecording
            ? 'Bạn có thể dừng bất cứ lúc nào để nghe lại câu trả lời.'
            : audio.recordingUri
              ? 'Nghe lại câu trả lời của bạn. Bạn có thể ghi âm lại hoặc xem mẫu để đối chiếu.'
              : 'Thử nói 20–30 giây bằng trải nghiệm của bạn. Mỗi lượt ghi âm tối đa 60 giây.'}
        </Text>
        {audio.isRecording && <Text style={s.timer}>{timer} / 01:00</Text>}
        <Action label={audio.isRecording ? '■ Dừng ghi âm' : audio.recordingUri ? '🎙️ Ghi âm lại' : '🎙️ Bắt đầu ghi âm'}
          disabled={audio.busy || isSaving}
          primary
          color={audio.isRecording ? '#DC2626' : color}
          onPress={() => { void (audio.isRecording ? audio.stopRecording() : audio.startRecording()); }} />
        {!!audio.recordingUri && <View style={s.row}>
          <Action label={audio.playing ? '■ Dừng nghe' : '▶ Nghe lại bản thu'} disabled={blocked || !audio.playbackReady}
            onPress={() => { void audio.replay(); }} />
          <Action label="Xóa bản thu" disabled={blocked} onPress={() => { void audio.removeRecording(); }} />
        </View>}
        {audio.busy && <Text style={s.notice} accessibilityLiveRegion="polite">Đang xử lý âm thanh…</Text>}
        <Text style={s.notice}>Bản thu chỉ dùng tạm cho câu này, không gửi lên máy chủ và được dọn khi rời câu. Không có nhận diện hay chấm điểm tự động.</Text>
        </View>}

        {/* Hiện lỗi âm thanh ở cả phần luyện nói và xem mẫu. */}
        {!!audio.error && (
          <Text style={s.error} accessibilityRole="alert">
            {audio.error}
          </Text>
        )}

        {/* Nút phụ mở câu trả lời mẫu. */}
      {!showAnswer ? <Action label="Xem câu trả lời mẫu" disabled={blocked}
        onPress={() => setShowAnswer(true)} /> : <View>
        <View style={s.card}>
          <Text style={s.label}>CỤM TỪ TRỌNG TÂM</Text>
          <Text style={s.phrase}>{prompt.phrase}</Text>
          <Text style={s.translation}>{prompt.meaning}</Text>
          {listen('phrase', prompt.phrase, '🔊 Nghe cụm từ')}
        </View>
        <View style={[s.card, s.sample]}>
          <Text style={s.label}>MẪU TRẢ LỜI THAM KHẢO</Text>
          <Text style={s.answer}>{prompt.answer}</Text>
          <Text style={s.translation}>{prompt.translation}</Text>
          {listen('answer', prompt.answer, '🔊 Nghe câu trả lời mẫu')}
          <Text style={s.notice}>Giọng đọc tổng hợp tiếng Anh. Hãy thay nội dung bằng kinh nghiệm thật của bạn.</Text>
        </View>
        <Action label="Ẩn gợi ý để tự nói lại" disabled={blocked} onPress={() => {
          void audio.stopListening();
          setShowAnswer(false);
        }} />
        {/* Tiêu chí giúp người học tự đánh giá câu trả lời. */}
        <Text style={s.selfCheck}>
          Bạn đã trả lời được ý chính của câu hỏi chưa?
        </Text>

        <Text style={s.notice}>
          Chọn “Đã nói được” nếu bạn tự diễn đạt được ý chính bằng
          trải nghiệm của mình, dù còn lỗi nhỏ. Chọn “Cần luyện lại”
          nếu bạn còn bí ý hoặc phải đọc theo câu mẫu.
        </Text>
        {/* Chọn kết quả trước khi xác nhận chuyển câu. */}
        <View style={s.row}>
          <Action
            label={assessment === 'review'
              ? '● Cần luyện lại'
              : '○ Cần luyện lại'}
            primary={assessment === 'review'}
            color={color}
            disabled={blocked}
            onPress={() => setAssessment('review')}
          />

          <Action
            label={assessment === 'spoke'
              ? '● Đã nói được'
              : '○ Đã nói được'}
            primary={assessment === 'spoke'}
            color={color}
            disabled={blocked}
            onPress={() => setAssessment('spoke')}
          />
        </View>

        <Action
          label={isSaving ? 'Đang lưu…' : 'Xác nhận tự đánh giá'}
          primary
          color={color}
          disabled={blocked || assessment === null}
          onPress={() => {
            if (assessment === null || savingLock.current) return;

            const selected = assessment;
            savingLock.current = true;
            setIsSaving(true);

            void (async () => {
              try {
                let saveTask: Promise<void> | undefined;

                await audio.leave(() => {
                  saveTask = onMark(selected);
                });

                if (saveTask) {
                  await saveTask;
                }
              } finally {
                savingLock.current = false;
                setIsSaving(false);
              }
            })();
          }}
        />
      </View>}
      {/* Chỉ hiện hướng dẫn khi chưa ghi âm. */}
    {!showAnswer && !audio.isRecording && (
      <Text style={s.notice}>
      Không muốn cấp quyền micro? Bạn vẫn có thể tự nói, xem và nghe mẫu.
      </Text>
    )}
      {Platform.OS === 'ios' && <Text style={s.notice}>Nếu không nghe được mẫu trên iPhone, hãy tắt chế độ im lặng và tăng âm lượng.</Text>}
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, paddingBottom: 13 },
  back: { color: '#4F46E5', fontWeight: '800', marginBottom: 13 },
  number: { fontSize: 12, fontWeight: '800', marginBottom: 3 },
  title: { color: '#1E293B', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  muted: { color: '#64748B', fontSize: 13 },
  track: {
    backgroundColor: '#E2E8F0',
    height: 6,
    marginHorizontal: 20,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  content: { padding: 20, paddingBottom: 34, gap: 14 },
  card: { backgroundColor: '#FFF', borderRadius: 18, padding: 20, gap: 8 },
  label: { color: '#64748B', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  question: { color: '#1E293B', fontSize: 23, fontWeight: '800', lineHeight: 31 },
  translation: { color: '#475569', fontSize: 14, lineHeight: 21 },
  recorder: { backgroundColor: '#EEF2FF' },
  cardTitle: { color: '#312E81', fontSize: 18, fontWeight: '800' },
  body: { color: '#4338CA', fontSize: 14, lineHeight: 21 },
  timer: { color: '#B91C1C', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  button: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#334155', fontWeight: '800', textAlign: 'center' },
  white: { color: '#FFF' },
  disabled: { opacity: 0.45 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  notice: { color: '#64748B', fontSize: 12, lineHeight: 18, marginTop: 6 },
  error: { color: '#B91C1C', fontSize: 14, lineHeight: 21 },
  phrase: { color: '#1E293B', fontSize: 17, fontWeight: '800', lineHeight: 24 },
  sample: { backgroundColor: '#ECFDF5', marginTop: 14 },
  answer: { color: '#065F46', fontSize: 16, fontWeight: '700', lineHeight: 24 },
  selfCheck: { color: '#475569', fontSize: 14, lineHeight: 20, marginTop: 16 },
});
