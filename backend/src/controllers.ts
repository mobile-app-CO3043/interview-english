import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateLessonDto, CreateQuestionDto, ErrorResponse, LessonResponse, QuestionResponse, UpdateLessonDto, UpdateQuestionDto } from './dto';
import { PostgresStore } from './postgres-store';

@ApiTags('1. Lessons - Bài học')
@ApiBadRequestResponse({ type: ErrorResponse, description: 'Dữ liệu đầu vào không hợp lệ.' })
@ApiNotFoundResponse({ type: ErrorResponse, description: 'Không tìm thấy bài học.' })
@ApiConflictResponse({ type: ErrorResponse, description: 'ID trùng, đổi ID hoặc bài học còn câu hỏi.' })
@Controller('lessons')
export class LessonsController {
    constructor(private readonly store: PostgresStore) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bài học', description: 'Dữ liệu ban đầu gồm 3 bài học từ app Expo.' })
  @ApiOkResponse({ type: LessonResponse, isArray: true })
  list() { return this.store.listLessons(); }

  @Get(':lessonId/questions')
  @ApiOperation({ summary: 'Lấy câu hỏi của một bài học' })
  @ApiParam({ name: 'lessonId', example: 'intro' })
  @ApiOkResponse({ type: QuestionResponse, isArray: true })
  questions(@Param('lessonId') id: string) { return this.store.listQuestions(id); }

  @Get(':lessonId')
  @ApiOperation({ summary: 'Xem chi tiết bài học' })
  @ApiParam({ name: 'lessonId', example: 'intro' })
  @ApiOkResponse({ type: LessonResponse })
  get(@Param('lessonId') id: string) { return this.store.getLesson(id); }

  @Post()
  @ApiOperation({ summary: 'Tạo bài học', description: 'Yêu cầu Bearer token quản trị. Chỉ dùng dữ liệu thử nghiệm khi demo.' })
  @ApiCreatedResponse({ type: LessonResponse })
  create(@Body() input: CreateLessonDto) { return this.store.createLesson(input); }

  @Patch(':lessonId')
  @ApiOperation({ summary: 'Cập nhật bài học', description: 'Gửi các trường cần sửa. Không được đổi ID.' })
  @ApiParam({ name: 'lessonId', example: 'demo-lesson' })
  @ApiOkResponse({ type: LessonResponse })
  update(@Param('lessonId') id: string, @Body() input: UpdateLessonDto) { return this.store.updateLesson(id, input); }

  @Delete(':lessonId') @HttpCode(204)
  @ApiOperation({ summary: 'Xóa bài học', description: 'Trả 409 nếu bài học còn câu hỏi.' })
  @ApiParam({ name: 'lessonId', example: 'demo-lesson' })
  @ApiNoContentResponse({ description: 'Đã xóa, không có response body.' })
  remove(@Param('lessonId') id: string) { return this.store.deleteLesson(id); }
}

@ApiTags('2. Questions - Câu hỏi')
@ApiBadRequestResponse({ type: ErrorResponse, description: 'Dữ liệu đầu vào không hợp lệ.' })
@ApiNotFoundResponse({ type: ErrorResponse, description: 'Không tìm thấy câu hỏi hoặc bài học liên quan.' })
@ApiConflictResponse({ type: ErrorResponse, description: 'ID trùng hoặc cố đổi ID.' })
@Controller('questions')
export class QuestionsController {
    constructor(private readonly store: PostgresStore) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách câu hỏi', description: 'Có thể lọc theo lessonId. Ban đầu có 9 câu hỏi.' })
  @ApiQuery({ name: 'lessonId', required: false, example: 'intro' })
  @ApiOkResponse({ type: QuestionResponse, isArray: true })
  list(@Query('lessonId') lessonId?: string) { return this.store.listQuestions(lessonId); }

  @Get(':questionId')
  @ApiOperation({ summary: 'Xem chi tiết câu hỏi' })
  @ApiParam({ name: 'questionId', example: 'yourself' })
  @ApiOkResponse({ type: QuestionResponse })
  get(@Param('questionId') id: string) { return this.store.getQuestion(id); }

  @Post()
  @ApiOperation({ summary: 'Tạo câu hỏi', description: 'lessonId phải trỏ tới bài học đã tồn tại.' })
  @ApiCreatedResponse({ type: QuestionResponse })
  create(@Body() input: CreateQuestionDto) { return this.store.createQuestion(input); }

  @Patch(':questionId')
  @ApiOperation({ summary: 'Cập nhật câu hỏi', description: 'Gửi các trường cần sửa. Có thể chuyển sang bài học khác; không được đổi ID.' })
  @ApiParam({ name: 'questionId', example: 'demo-question' })
  @ApiOkResponse({ type: QuestionResponse })
  update(@Param('questionId') id: string, @Body() input: UpdateQuestionDto) { return this.store.updateQuestion(id, input); }

  @Delete(':questionId') @HttpCode(204)
  @ApiOperation({ summary: 'Xóa câu hỏi' })
  @ApiParam({ name: 'questionId', example: 'demo-question' })
  @ApiNoContentResponse({ description: 'Đã xóa, không có response body.' })
  remove(@Param('questionId') id: string) { return this.store.deleteQuestion(id); }
}
