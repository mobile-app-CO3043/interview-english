import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import PracticeScreen from './src/PracticeScreen';
import { fetchLearningContent } from './src/api';
type Status = 'spoke' | 'review';
type Progress = Record<string, Status>;
type Prompt = {
  id: string;
  question: string;
  vietnamese: string;
  phrase: string;
  meaning: string;
  answer: string;
  translation: string;
};
type Lesson = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  prompts: Prompt[];
};
const KEY = '@interview-english/software-intern/v1';

// Kiểm tra các trường bắt buộc có phải chuỗi hay không.
  function hasStringFields(
    value: unknown,
    fields: string[],
  ): boolean {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const record = value as Record<string, unknown>;

    return fields.every((field) => typeof record[field] === 'string');
  }

  // Kiểm tra cấu trúc bản lưu trước khi đưa vào giao diện.
  function isCachedLessons(value: unknown): value is Lesson[] {
    if (!Array.isArray(value)) {
      return false;
    }

    return value.every((lesson) =>
      hasStringFields(lesson, [
        'id', 'number', 'title', 'subtitle', 'icon', 'color',
      ]) &&
      Array.isArray(lesson.prompts) &&
      lesson.prompts.every((prompt: unknown) =>
        hasStringFields(prompt, [
          'id', 'question', 'vietnamese',
          'phrase', 'meaning', 'answer', 'translation',
        ]),
      ),
    );
  }
// Khóa lưu bản sao bài học tải từ backend.
const CONTENT_CACHE_KEY = '@interview-english/content/v1';
const LESSONS: Lesson[] = [
  {
    id: 'intro',
    number: 'BÀI 01',
    title: 'Giới thiệu bản thân',
    subtitle: 'Bản thân, mục tiêu và điểm mạnh',
    icon: '👋',
    color: '#4F46E5',
    prompts: [
      {
        id: 'yourself',
        question: 'Tell me about yourself.',
        vietnamese: 'Hãy giới thiệu về bản thân bạn.',
        phrase: 'I am a final-year Computer Science student.',
        meaning: 'Tôi là sinh viên năm cuối ngành Khoa học Máy tính.',
        answer:
          'I am a final-year Computer Science student. I am interested in web development, and I have built several small projects using React.',
        translation:
          'Tôi là sinh viên năm cuối ngành Khoa học Máy tính. Tôi quan tâm đến phát triển web và đã làm một số dự án nhỏ bằng React.',
      },
      {
        id: 'why-role',
        question: 'Why are you applying for this Software Intern position?',
        vietnamese: 'Vì sao bạn ứng tuyển vị trí thực tập sinh lập trình này?',
        phrase: 'I am interested in learning from an experienced team.',
        meaning: 'Tôi muốn học hỏi từ một đội ngũ có kinh nghiệm.',
        answer:
          'I am applying because I want to gain practical experience. I am interested in learning from an experienced team and contributing to real products.',
        translation:
          'Tôi ứng tuyển vì muốn có kinh nghiệm thực tế. Tôi muốn học hỏi từ một đội ngũ có kinh nghiệm và đóng góp vào sản phẩm thật.',
      },
      {
        id: 'strength',
        question: 'What is one of your strengths?',
        vietnamese: 'Một điểm mạnh của bạn là gì?',
        phrase: 'My strength is solving problems step by step.',
        meaning: 'Điểm mạnh của tôi là giải quyết vấn đề từng bước.',
        answer:
          'My strength is solving problems step by step. When I face a bug, I first understand the issue, then test possible solutions carefully.',
        translation:
          'Điểm mạnh của tôi là giải quyết vấn đề từng bước. Khi gặp lỗi, tôi tìm hiểu nguyên nhân trước rồi cẩn thận thử các giải pháp.',
      },
    ],
  },
  {
    id: 'projects',
    number: 'BÀI 02',
    title: 'Dự án và kỹ năng kỹ thuật',
    subtitle: 'Kể về sản phẩm bạn đã xây dựng',
    icon: '💻',
    color: '#0EA5E9',
    prompts: [
      {
        id: 'project',
        question: 'Tell me about a project you have worked on.',
        vietnamese: 'Hãy kể về một dự án bạn từng làm.',
        phrase: 'I built a web application using React and Firebase.',
        meaning: 'Tôi đã xây dựng một ứng dụng web bằng React và Firebase.',
        answer:
          'I built a web application using React and Firebase. The app helps students track their study tasks and deadlines.',
        translation:
          'Tôi đã xây dựng một ứng dụng web bằng React và Firebase. Ứng dụng giúp sinh viên theo dõi công việc học tập và hạn chót.',
      },
      {
        id: 'role',
        question: 'What was your role in that project?',
        vietnamese: 'Vai trò của bạn trong dự án đó là gì?',
        phrase: 'I was responsible for the front-end interface.',
        meaning: 'Tôi chịu trách nhiệm cho giao diện front-end.',
        answer:
          'I was responsible for the front-end interface. I designed the screens, connected them to the API, and tested the main user flows.',
        translation:
          'Tôi chịu trách nhiệm cho giao diện front-end. Tôi thiết kế màn hình, kết nối với API và kiểm thử các luồng người dùng chính.',
      },
      {
        id: 'skills',
        question: 'What technologies are you comfortable using?',
        vietnamese: 'Bạn tự tin sử dụng những công nghệ nào?',
        phrase: 'I am comfortable using Java, JavaScript, and Git.',
        meaning: 'Tôi tự tin sử dụng Java, JavaScript và Git.',
        answer:
          'I am comfortable using Java, JavaScript, and Git. I am also learning React Native because I want to build mobile applications.',
        translation:
          'Tôi tự tin sử dụng Java, JavaScript và Git. Tôi cũng đang học React Native vì muốn xây dựng ứng dụng di động.',
      },
    ],
  },
  {
    id: 'teamwork',
    number: 'BÀI 03',
    title: 'Teamwork và giải quyết vấn đề',
    subtitle: 'Phối hợp và xử lý khó khăn',
    icon: '🤝',
    color: '#059669',
    prompts: [
      {
        id: 'teamwork',
        question: 'Tell me about a time you worked in a team.',
        vietnamese: 'Hãy kể về một lần bạn làm việc nhóm.',
        phrase: 'I worked with a team of three to build a mobile app.',
        meaning:
          'Tôi đã làm việc với một nhóm ba người để xây dựng ứng dụng di động.',
        answer:
          'I worked with a team of three to build a mobile app. We divided the tasks, shared updates every week, and helped each other when we had problems.',
        translation:
          'Tôi đã làm việc với nhóm ba người để xây dựng ứng dụng di động. Chúng tôi chia việc, cập nhật hằng tuần và hỗ trợ nhau khi gặp khó khăn.',
      },
      {
        id: 'challenge',
        question: 'Tell me about a challenge you faced in a project.',
        vietnamese: 'Hãy kể về một khó khăn bạn gặp trong dự án.',
        phrase: 'We had a problem with the database connection.',
        meaning: 'Chúng tôi gặp vấn đề với kết nối cơ sở dữ liệu.',
        answer:
          'We had a problem with the database connection. I read the documentation, tested the configuration, and solved the issue with my teammate.',
        translation:
          'Chúng tôi gặp vấn đề với kết nối cơ sở dữ liệu. Tôi đọc tài liệu, kiểm tra cấu hình và cùng đồng đội giải quyết vấn đề.',
      },
      {
        id: 'deadline',
        question: 'How do you work when you have a deadline?',
        vietnamese: 'Bạn làm việc thế nào khi có hạn chót?',
        phrase: 'I break the work into smaller tasks and set priorities.',
        meaning:
          'Tôi chia công việc thành những nhiệm vụ nhỏ và đặt thứ tự ưu tiên.',
        answer:
          'When I have a deadline, I break the work into smaller tasks and set priorities. I focus on the most important features first and communicate early if I need support.',
        translation:
          'Khi có hạn chót, tôi chia công việc thành nhiệm vụ nhỏ và đặt thứ tự ưu tiên. Tôi làm các chức năng quan trọng trước và trao đổi sớm nếu cần hỗ trợ.',
      },
    ],
  },
];

const progressKey = (lesson: Lesson, prompt: Prompt) =>
  `${lesson.id}:${prompt.id}`;

export default function App() {
  const [progress, setProgress] = useState<Progress>({});
  // Dùng nội dung có sẵn làm dự phòng, thay bằng API khi tải thành công.
  const [lessons, setLessons] = useState<Lesson[]>(LESSONS);
  const [lessonId, setLessonId] = useState<string | null>(null);

  const [index, setIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  // Ngăn nhiều thao tác ghi tiến độ chạy cùng lúc.
  const saving = useRef(false);

  // Tải tiến độ trên máy và nội dung từ backend.
  useEffect(() => {
    let active = true;

    const progressTask = AsyncStorage.getItem(KEY)
      .then((value) => {
        if (active && value) {
          setProgress(JSON.parse(value) as Progress);
        }
      })
      .catch(() => {
        if (active) {
          Alert.alert('Không thể tải tiến độ');
        }
      });

    const contentTask = fetchLearningContent()
    .then(async (data) => {
      if (!active) return;

      setLessons(data);

      // Lưu riêng nội dung bài học, không ghi đè tiến độ.
      try {
        await AsyncStorage.setItem(
          CONTENT_CACHE_KEY,
          JSON.stringify(data),
        );
      } catch {
        Alert.alert(
          'Chưa lưu được bài học trên máy',
          'Bạn vẫn có thể học nội dung vừa tải, nhưng bản mới chưa được lưu để dùng khi mất mạng.',
        );
      }
    })
    .catch(async () => {
      if (!active) return;

      try {
        const saved = await AsyncStorage.getItem(CONTENT_CACHE_KEY);

        if (!active) return;

        if (saved !== null) {
          const cached: unknown = JSON.parse(saved);

          if (!isCachedLessons(cached)) {
            throw new Error('Bản lưu bài học không hợp lệ.');
          }

          setLessons(cached);

          Alert.alert(
            'Đang dùng bài học đã lưu',
            'Chưa kết nối được server. Bạn vẫn có thể học nội dung đã tải trước đó.',
          );

          return;
        }
      } catch {
        // Không đọc được bản lưu thì dùng nội dung có sẵn.
      }

      if (active) {
        setLessons(LESSONS);

        Alert.alert(
          'Đang dùng nội dung có sẵn',
          'Chưa tải được từ server và chưa có bản lưu hợp lệ trên máy.',
        );
      }
    });

    void Promise.all([progressTask, contentTask]).finally(() => {
      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const lesson = useMemo(
    () => lessons.find((item) => item.id === lessonId) ?? null,
    [lessons, lessonId],
  );

  const prompt = lesson?.prompts[index];

  const total = lessons.reduce(
    (sum, item) => sum + item.prompts.length,
    0,
  );

  const spoke = Object.values(progress).filter(
    (status) => status === 'spoke',
  ).length;

  const review = Object.values(progress).filter(
    (status) => status === 'review',
  ).length;

  const openLesson = (item: Lesson) => {
    setLessonId(item.id);
    setIndex(0);
  };

  const completedIn = (item: Lesson) =>
    item.prompts.filter((p) => progress[progressKey(item, p)] === 'spoke')
      .length;

    // Chỉ chuyển câu sau khi ghi tiến độ thành công.
  const mark = async (status: Status) => {
    if (!lesson || !prompt || saving.current) return;

      // Khóa ngay để tránh bấm xác nhận liên tiếp.
      saving.current = true;

      const nextProgress: Progress = {
        ...progress,
        [progressKey(lesson, prompt)]: status,
      };

    try {
        await AsyncStorage.setItem(KEY, JSON.stringify(nextProgress));
        setProgress(nextProgress);

      if (index === lesson.prompts.length - 1) {
          setLessonId(null);

          Alert.alert(
            'Đã lưu tự đánh giá',
            'Bạn đã đến cuối bài. Tiến độ đã được lưu trên thiết bị.',
          );
        } else {
          setIndex((current) => current + 1);
        }
      } catch {
        Alert.alert(
          'Chưa lưu được tiến độ',
          'Bạn vẫn ở câu hiện tại. Hãy bấm xác nhận để thử lại.',
        );
      } finally {
        saving.current = false;
      }
    };

  const reset = () =>
    Alert.alert('Đặt lại tiến độ?', 'Tất cả trạng thái sẽ bị xóa.', [
      {
        text: 'Hủy',
        style: 'cancel',
      },
      {
        text: 'Đặt lại',
        style: 'destructive',
        onPress: () => {
          if (saving.current) return;
          saving.current = true;

          void AsyncStorage.setItem(KEY, JSON.stringify({}))
            .then(() => setProgress({}))
            .catch(() => {
              Alert.alert('Không thể đặt lại tiến độ', 'Bạn hãy thử lại.');
            })
            .finally(() => {
              saving.current = false;
            });
        },
      },
    ]);

  if (loading)
    return (
      <SafeAreaView style={s.center}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={s.muted}>Đang tải tiến độ…</Text>
      </SafeAreaView>
    );
  if (lesson && prompt)
    return (
      <PracticeScreen
        key={progressKey(lesson, prompt)}
        title={lesson.title}
        number={lesson.number}
        color={lesson.color}
        index={index}
        total={lesson.prompts.length}
        prompt={prompt}
        onBack={() => setLessonId(null)}
        onMark={mark}
      />
    );
  return (
    <SafeAreaView style={s.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={s.home}>
        <Text style={s.brand}>Interview English</Text>
        <Text style={s.tagline}>
          Luyện trả lời phỏng vấn cho Software Intern.
        </Text>
        <View style={s.hero}>
          <Text style={s.heroLabel}>MỤC TIÊU HÔM NAY</Text>
          <Text style={s.heroTitle}>Nói được, không chỉ nhớ từ.</Text>
          <Text style={s.heroText}>
            Mỗi bài chỉ 3–5 phút: tự nói trước, xem gợi ý sau.
          </Text>
          <View style={s.statRow}>
            <View>
              <Text style={s.statNumber}>
                {spoke}/{total}
              </Text>
              <Text style={s.statLabel}>câu đã nói được</Text>
            </View>
            <View style={s.divider} />
            <View>
              <Text style={s.statNumber}>{review}</Text>
              <Text style={s.statLabel}>câu cần luyện lại</Text>
            </View>
          </View>
        </View>
        <Text style={s.section}>Lộ trình Software Intern</Text>
        {lessons.map((item) => (
          <Pressable
            key={item.id}
            style={s.lessonCard}
            onPress={() => openLesson(item)}
          >
            <View
              style={[
                s.lessonIcon,
                {
                  backgroundColor: item.color,
                },
              ]}
            >
              <Text style={s.iconText}>{item.icon}</Text>
            </View>
            <View style={s.lessonInfo}>
              <Text
                style={[
                  s.number,
                  {
                    color: item.color,
                  },
                ]}
              >
                {item.number}
              </Text>
              <Text style={s.lessonTitle}>{item.title}</Text>
              <Text style={s.muted}>{item.subtitle}</Text>
              <Text
                style={[
                  s.lessonProgress,
                  {
                    color: item.color,
                  },
                ]}
              >
                {completedIn(item)}/{item.prompts.length} câu đã nói được
              </Text>
            </View>
            <Text
              style={[
                s.arrow,
                {
                  color: item.color,
                },
              ]}
            >
              ›
            </Text>
          </Pressable>
        ))}
        <View style={s.how}>
          <Text style={s.howTitle}>Cách học</Text>
          <Text style={s.howText}>
            {'1. Đọc câu hỏi  •  2. Tự nói  •  3. Xem gợi ý  •  4. Đánh dấu tiến độ'}
          </Text>
        </View>
        <Pressable style={s.reset} onPress={reset}>
          <Text style={s.resetText}>Đặt lại tiến độ</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
  },
  home: {
    padding: 24,
    paddingTop: 38,
    paddingBottom: 34,
  },
  brand: {
    color: '#312E81',
    fontSize: 29,
    fontWeight: '800',
  },
  tagline: {
    color: '#64748B',
    fontSize: 16,
    marginTop: 5,
  },
  hero: {
    backgroundColor: '#312E81',
    borderRadius: 22,
    marginTop: 25,
    padding: 22,
  },
  heroLabel: {
    color: '#C7D2FE',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 25,
    fontWeight: '800',
    marginTop: 8,
  },
  heroText: {
    color: '#E0E7FF',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
  statRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  statNumber: {
    color: '#FFF',
    fontSize: 21,
    fontWeight: '800',
  },
  statLabel: {
    color: '#C7D2FE',
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: '#6366F1',
    marginHorizontal: 24,
  },
  section: {
    color: '#1E293B',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 28,
    marginBottom: 12,
  },
  lessonCard: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 17,
    flexDirection: 'row',
    marginBottom: 11,
    padding: 14,
  },
  lessonIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 51,
    justifyContent: 'center',
    width: 51,
  },
  iconText: {
    fontSize: 24,
  },
  lessonInfo: {
    flex: 1,
    marginLeft: 12,
  },
  number: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 3,
  },
  lessonTitle: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 3,
  },
  lessonProgress: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
  },
  arrow: {
    fontSize: 31,
    fontWeight: '300',
  },
  how: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    marginTop: 12,
    padding: 17,
  },
  howTitle: {
    color: '#3730A3',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  howText: {
    color: '#4F46E5',
    fontSize: 13,
    lineHeight: 20,
  },
  reset: {
    alignSelf: 'center',
    marginTop: 10,
    padding: 14,
  },
  resetText: {
    color: '#64748B',
    fontWeight: '700',
  },
  muted: {
    color: '#64748B',
    fontSize: 13,
  },
  learnHeader: {
    padding: 20,
    paddingBottom: 13,
  },
  back: {
    color: '#4F46E5',
    fontWeight: '800',
    marginBottom: 13,
  },
  learnTitle: {
    color: '#1E293B',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  track: {
    backgroundColor: '#E2E8F0',
    height: 6,
  },
  trackFill: {
    height: '100%',
  },
  learnContent: {
    padding: 20,
    paddingBottom: 34,
  },
  questionCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    borderWidth: 2,
    padding: 20,
  },
  label: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 7,
  },
  question: {
    color: '#1E293B',
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 31,
    marginTop: 4,
  },
  questionVi: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 9,
  },
  recallCard: {
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    marginTop: 16,
    padding: 24,
  },
  recallIcon: {
    fontSize: 34,
  },
  recallTitle: {
    color: '#312E81',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 9,
    textAlign: 'center',
  },
  recallText: {
    color: '#4F46E5',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
  showButton: {
    borderRadius: 13,
    marginTop: 20,
    paddingHorizontal: 17,
    paddingVertical: 14,
  },
  showText: {
    color: '#FFF',
    fontWeight: '800',
  },
  answerArea: {
    marginTop: 17,
  },
  phraseCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 17,
  },
  phrase: {
    color: '#1E293B',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 24,
  },
  phraseMeaning: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
  },
  answerCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderRadius: 15,
    borderWidth: 1,
    padding: 17,
    marginBottom: 14,
  },
  answer: {
    color: '#065F46',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  translation: {
    color: '#047857',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 9,
  },
  selfCheck: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  reviewButton: {
    alignItems: 'center',
    borderColor: '#CBD5E1',
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  reviewText: {
    color: '#475569',
    fontWeight: '800',
  },
  spokeButton: {
    alignItems: 'center',
    borderRadius: 13,
    flex: 1,
    padding: 14,
  },
  spokeText: {
    color: '#FFF',
    fontWeight: '800',
  },
});
