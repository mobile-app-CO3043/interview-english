import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { CreateLessonDto, CreateQuestionDto, UpdateLessonDto, UpdateQuestionDto } from './dto';

type Database = { lessons: CreateLessonDto[]; questions: CreateQuestionDto[] };

@Injectable()
export class Store {
  private readonly path = resolve(process.env.DATA_FILE || 'data/database.json');
  private db: Database;

  constructor() {
    const seedPath = resolve(__dirname, '../seed.json');
    this.db = JSON.parse(readFileSync(existsSync(this.path) ? this.path : seedPath, 'utf8'));
    if (!existsSync(this.path)) this.commit(this.db);
  }

  // Ghi đồng bộ một bản mới rồi đổi tên; chỉ cập nhật RAM sau khi ghi thành công.
  private commit(next: Database) {
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(`${this.path}.tmp`, JSON.stringify(next, null, 2), 'utf8');
    renameSync(`${this.path}.tmp`, this.path);
    this.db = next;
  }

  listLessons() { return this.db.lessons.map(lesson => this.describe(lesson)); }
  private describe(lesson: CreateLessonDto) {
    return { ...lesson, questionCount: this.db.questions.filter(q => q.lessonId === lesson.id).length };
  }
  getLesson(id: string) {
    const lesson = this.db.lessons.find(item => item.id === id);
    if (!lesson) throw new NotFoundException('Không tìm thấy bài học.');
    return this.describe(lesson);
  }
  createLesson(input: CreateLessonDto) {
    if (this.db.lessons.some(item => item.id === input.id)) throw new ConflictException('ID bài học đã tồn tại.');
    this.commit({ ...this.db, lessons: [...this.db.lessons, input] });
    return this.getLesson(input.id);
  }
  updateLesson(id: string, input: UpdateLessonDto) {
    this.getLesson(id);
    if (input.id && input.id !== id) throw new ConflictException('Không được đổi ID bài học.');
    const lessons = this.db.lessons.map(item => item.id === id ? { ...item, ...input } : item);
    this.commit({ ...this.db, lessons });
    return this.getLesson(id);
  }
  deleteLesson(id: string) {
    this.getLesson(id);
    if (this.db.questions.some(q => q.lessonId === id)) throw new ConflictException('Bài học còn câu hỏi. Hãy xóa hoặc chuyển câu hỏi trước.');
    this.commit({ ...this.db, lessons: this.db.lessons.filter(item => item.id !== id) });
  }
  listQuestions(lessonId?: string) {
    if (lessonId !== undefined) this.getLesson(lessonId);
    return this.db.questions.filter(item => lessonId === undefined || item.lessonId === lessonId);
  }
  getQuestion(id: string) {
    const question = this.db.questions.find(item => item.id === id);
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi.');
    return question;
  }
  createQuestion(input: CreateQuestionDto) {
    this.getLesson(input.lessonId);
    if (this.db.questions.some(item => item.id === input.id)) throw new ConflictException('ID câu hỏi đã tồn tại.');
    this.commit({ ...this.db, questions: [...this.db.questions, input] });
    return this.getQuestion(input.id);
  }
  updateQuestion(id: string, input: UpdateQuestionDto) {
    this.getQuestion(id);
    if (input.id && input.id !== id) throw new ConflictException('Không được đổi ID câu hỏi.');
    if (input.lessonId !== undefined) this.getLesson(input.lessonId);
    const questions = this.db.questions.map(item => item.id === id ? { ...item, ...input } : item);
    this.commit({ ...this.db, questions });
    return this.getQuestion(id);
  }
  deleteQuestion(id: string) {
    this.getQuestion(id);
    this.commit({ ...this.db, questions: this.db.questions.filter(item => item.id !== id) });
  }
}
