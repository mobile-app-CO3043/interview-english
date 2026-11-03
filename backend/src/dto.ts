import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateLessonDto {
  @ApiProperty({ example: 'demo-lesson', description: 'ID duy nhất, chữ thường, số và dấu gạch ngang.' })
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(80)
  id!: string;

  @ApiProperty({ example: 'BÀI 04' })
  @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(80)
  number!: string;

  @ApiProperty({ example: 'Luyện phỏng vấn thử' })
  @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Bài học tạo từ Swagger' })
  @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(500)
  subtitle!: string;

  @ApiProperty({ example: '🎯' })
  @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(40)
  icon!: string;

  @ApiProperty({ example: '#4F46E5' })
  @IsString() @Matches(/^#[0-9a-fA-F]{6}$/)
  color!: string;
}

export class UpdateLessonDto extends PartialType(CreateLessonDto, { skipNullProperties: false }) {}

export class CreateQuestionDto {
  @ApiProperty({ example: 'demo-question', description: 'ID duy nhất trên toàn bộ nhóm câu hỏi.' })
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(80)
  id!: string;

  @ApiProperty({ example: 'intro', description: 'ID bài học đã tồn tại.' })
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(80)
  lessonId!: string;

  @ApiProperty({ example: 'Why do you want to learn English?' })
  @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(2000)
  question!: string;

  @ApiProperty({ example: 'Vì sao bạn muốn học tiếng Anh?' })
  @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(2000)
  vietnamese!: string;

  @ApiProperty({ example: 'I want to communicate with my team.' })
  @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(2000)
  phrase!: string;

  @ApiProperty({ example: 'Tôi muốn giao tiếp với nhóm.' })
  @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(2000)
  meaning!: string;

  @ApiProperty({ example: 'I want to learn English to communicate with my team and prepare for interviews.' })
  @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(5000)
  answer!: string;

  @ApiProperty({ example: 'Tôi muốn học tiếng Anh để giao tiếp với nhóm và chuẩn bị phỏng vấn.' })
  @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(5000)
  translation!: string;
}

export class UpdateQuestionDto extends PartialType(CreateQuestionDto, { skipNullProperties: false }) {}

export class LessonResponse extends CreateLessonDto {
  @ApiProperty({ example: 3 })
  questionCount!: number;
}

export class QuestionResponse extends CreateQuestionDto {}

export class ErrorResponse {
  @ApiProperty({ example: 404 }) statusCode!: number;
  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }], example: 'Không tìm thấy bài học.' })
  message!: string | string[];
  @ApiProperty({ example: 'Not Found' }) error!: string;
}
