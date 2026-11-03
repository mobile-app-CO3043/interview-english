// Địa chỉ backend đang chạy trên Render.
const API_URL = 'https://interview-english.onrender.com';

// Cấu trúc một bài học backend trả về.
export type ApiLesson = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  questionCount: number;
};

// Cấu trúc một câu hỏi backend trả về.
export type ApiQuestion = {
  id: string;
  lessonId: string;
  question: string;
  vietnamese: string;
  phrase: string;
  meaning: string;
  answer: string;
  translation: string;
};

// Hàm dùng chung để gửi yêu cầu đọc dữ liệu.
async function getJson<T>(path: string): Promise<T> {
  const controller = new AbortController();

  // Cho phép chờ tối đa 90 giây khi Render đang khởi động.
  const timeout = setTimeout(() => controller.abort(), 90_000);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Không tải được dữ liệu. Mã HTTP: ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('Server phản hồi quá lâu. Bạn hãy thử lại.');
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Lấy danh sách bài học.
export function fetchLessons(): Promise<ApiLesson[]> {
  return getJson<ApiLesson[]>('/api/lessons');
}

// Lấy toàn bộ câu hỏi.
export function fetchQuestions(): Promise<ApiQuestion[]> {
  return getJson<ApiQuestion[]>('/api/questions');
}

// Lấy các câu hỏi của một bài học.
export function fetchLessonQuestions(
  lessonId: string,
): Promise<ApiQuestion[]> {
  return getJson<ApiQuestion[]>(
    `/api/lessons/${encodeURIComponent(lessonId)}/questions`,
  );
}

// Một bài học kèm các câu hỏi để app sử dụng.
export type LessonWithQuestions = ApiLesson & {
  prompts: ApiQuestion[];
};

// Tải bài học và câu hỏi, rồi ghép theo lessonId.
export async function fetchLearningContent(): Promise<
  LessonWithQuestions[]
> {
  const [lessons, questions] = await Promise.all([
    fetchLessons(),
    fetchQuestions(),
  ]);

  return lessons.map((lesson) => ({
    ...lesson,
    prompts: questions.filter(
      (question) => question.lessonId === lesson.id,
    ),
  }));
}