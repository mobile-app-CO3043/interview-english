import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from './database.service';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  CreateLessonDto,
  UpdateLessonDto,
  LessonResponse,
  QuestionResponse,
} from './dto';

const LESSON_COLUMNS = `
  l.id, l.number, l.title, l.subtitle, l.icon, l.color,
  (SELECT COUNT(*)::int
   FROM questions q
   WHERE q.lesson_id = l.id) AS "questionCount"
`;

const QUESTION_COLUMNS = `
  id, lesson_id AS "lessonId", question, vietnamese,
  phrase, meaning, answer, translation
`;

@Injectable()
export class PostgresStore {
  constructor(private readonly database: DatabaseService) {}

  async listLessons(): Promise<LessonResponse[]> {
    const result = await this.database.pool.query<LessonResponse>(`
      SELECT ${LESSON_COLUMNS}
      FROM lessons l
      ORDER BY l.sort_order, l.id
    `);

    return result.rows;
  }

  async getLesson(id: string): Promise<LessonResponse> {
    const result = await this.database.pool.query<LessonResponse>(
      `SELECT ${LESSON_COLUMNS} FROM lessons l WHERE l.id = $1`,
      [id],
    );

    if (!result.rows[0]) {
      throw new NotFoundException('Không tìm thấy bài học.');
    }

    return result.rows[0];
  }

  async listQuestions(lessonId?: string): Promise<QuestionResponse[]> {
    if (lessonId !== undefined) {
      await this.getLesson(lessonId);
    }

    const result = await this.database.pool.query<QuestionResponse>(
      `SELECT ${QUESTION_COLUMNS}
       FROM questions
       ${lessonId === undefined ? '' : 'WHERE lesson_id = $1'}
       ORDER BY sort_order, id`,
      lessonId === undefined ? [] : [lessonId],
    );

    return result.rows;
  }

  async getQuestion(id: string): Promise<QuestionResponse> {
    const result = await this.database.pool.query<QuestionResponse>(
      `SELECT ${QUESTION_COLUMNS} FROM questions WHERE id = $1`,
      [id],
    );

    if (!result.rows[0]) {
      throw new NotFoundException('Không tìm thấy câu hỏi.');
    }

    return result.rows[0];
  }

    async createLesson(input: CreateLessonDto): Promise<LessonResponse> {
    try {
      await this.database.pool.query(
        `INSERT INTO lessons
          (id, number, title, subtitle, icon, color, sort_order)
         VALUES (
           $1, $2, $3, $4, $5, $6,
           (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM lessons)
         )`,
        [
          input.id, input.number, input.title,
          input.subtitle, input.icon, input.color,
        ],
      );
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException('ID bài học đã tồn tại.');
      }
      throw error;
    }

    return this.getLesson(input.id);
  }

  async updateLesson(
    id: string,
    input: UpdateLessonDto,
  ): Promise<LessonResponse> {
    await this.getLesson(id);

    if (input.id !== undefined && input.id !== id) {
      throw new ConflictException('Không được đổi ID bài học.');
    }

    const result = await this.database.pool.query(
      `UPDATE lessons SET
         number = COALESCE($2, number),
         title = COALESCE($3, title),
         subtitle = COALESCE($4, subtitle),
         icon = COALESCE($5, icon),
         color = COALESCE($6, color)
       WHERE id = $1
       RETURNING id`,
      [
        id, input.number, input.title,
        input.subtitle, input.icon, input.color,
      ],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('Không tìm thấy bài học.');
    }

    return this.getLesson(id);
  }

  async deleteLesson(id: string): Promise<void> {
    try {
      const result = await this.database.pool.query(
        'DELETE FROM lessons WHERE id = $1 RETURNING id',
        [id],
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('Không tìm thấy bài học.');
      }
    } catch (error) {
      if (['23503', '23001'].includes((error as { code?: string }).code || '')) {
        throw new ConflictException(
          'Bài học còn câu hỏi. Hãy xóa hoặc chuyển câu hỏi trước.',
        );
      }
      throw error;
    }
  }

    async createQuestion(
    input: CreateQuestionDto,
  ): Promise<QuestionResponse> {
    await this.getLesson(input.lessonId);

    try {
      await this.database.pool.query(
        `INSERT INTO questions
          (id, lesson_id, question, vietnamese, phrase,
           meaning, answer, translation, sort_order)
         VALUES (
            $1, $2::varchar(80), $3, $4, $5, $6, $7, $8,
           (SELECT COALESCE(MAX(sort_order), -1) + 1
             FROM questions WHERE lesson_id = $2::varchar(80))
         )`,
        [
          input.id,
          input.lessonId,
          input.question,
          input.vietnamese,
          input.phrase,
          input.meaning,
          input.answer,
          input.translation,
        ],
      );
    } catch (error) {
      const code = (error as { code?: string }).code;

      if (code === '23505') {
        throw new ConflictException('ID câu hỏi đã tồn tại.');
      }
      if (code === '23503') {
        throw new NotFoundException('Không tìm thấy bài học.');
      }
      throw error;
    }

    return this.getQuestion(input.id);
  }

  async updateQuestion(
    id: string,
    input: UpdateQuestionDto,
  ): Promise<QuestionResponse> {
    await this.getQuestion(id);

    if (input.id !== undefined && input.id !== id) {
      throw new ConflictException('Không được đổi ID câu hỏi.');
    }

    if (input.lessonId !== undefined) {
      await this.getLesson(input.lessonId);
    }

    try {
      const result = await this.database.pool.query(
        `UPDATE questions SET
           lesson_id = COALESCE($2, lesson_id),
           question = COALESCE($3, question),
           vietnamese = COALESCE($4, vietnamese),
           phrase = COALESCE($5, phrase),
           meaning = COALESCE($6, meaning),
           answer = COALESCE($7, answer),
           translation = COALESCE($8, translation)
         WHERE id = $1
         RETURNING id`,
        [
          id,
          input.lessonId,
          input.question,
          input.vietnamese,
          input.phrase,
          input.meaning,
          input.answer,
          input.translation,
        ],
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('Không tìm thấy câu hỏi.');
      }
    } catch (error) {
      if ((error as { code?: string }).code === '23503') {
        throw new NotFoundException('Không tìm thấy bài học.');
      }
      throw error;
    }

    return this.getQuestion(id);
  }

  async deleteQuestion(id: string): Promise<void> {
    const result = await this.database.pool.query(
      'DELETE FROM questions WHERE id = $1 RETURNING id',
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('Không tìm thấy câu hỏi.');
    }
  }
}

