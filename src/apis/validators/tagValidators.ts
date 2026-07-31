import { CreateTagDto, TagDto, type ICreateTagDto, type ITagDto } from '@/apis/dtos/tagDto'

export function isTagDto(value: unknown): value is ITagDto {
  return TagDto.safeParse(value).success
}

export function validateTagDto(value: unknown): ITagDto {
  return TagDto.parse(value)
}

export function isTagDtoArray(value: unknown): value is ITagDto[] {
  return Array.isArray(value) && value.every(isTagDto)
}

export function validateTagDtoArray(value: unknown): ITagDto[] {
  if (!Array.isArray(value)) throw new Error('Expected array')
  return value.map(validateTagDto)
}

export function isCreateTagDto(value: unknown): value is ICreateTagDto {
  return CreateTagDto.safeParse(value).success
}

export function validateCreateTagDto(value: unknown): ICreateTagDto {
  return CreateTagDto.parse(value)
}
