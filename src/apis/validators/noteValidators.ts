import { CreateNoteDto, NoteDto, type ICreateNoteDto, type INoteDto } from '@/apis/dtos/noteDto'

export function isNoteDto(value: unknown): value is INoteDto {
  return NoteDto.safeParse(value).success
}

export function validateNoteDto(value: unknown): INoteDto {
  return NoteDto.parse(value)
}

export function isNoteDtoArray(value: unknown): value is INoteDto[] {
  return Array.isArray(value) && value.every(isNoteDto)
}

export function validateNoteDtoArray(value: unknown): INoteDto[] {
  if (!Array.isArray(value)) throw new Error('Expected array')
  return value.map(validateNoteDto)
}

export function isCreateNoteDto(value: unknown): value is ICreateNoteDto {
  return CreateNoteDto.safeParse(value).success
}

export function validateCreateNoteDto(value: unknown): ICreateNoteDto {
  return CreateNoteDto.parse(value)
}
