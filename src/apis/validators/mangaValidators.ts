import {
  MangaDetailDto,
  MangaSearchResultDto,
  type IMangaDetailDto,
  type IMangaSearchResultDto,
} from '@/apis/dtos/mangaDto'

export function isMangaSearchResultDto(value: unknown): value is IMangaSearchResultDto {
  return MangaSearchResultDto.safeParse(value).success
}

export function validateMangaSearchResultDto(value: unknown): IMangaSearchResultDto {
  return MangaSearchResultDto.parse(value)
}

export function isMangaSearchResultDtoArray(value: unknown): value is IMangaSearchResultDto[] {
  return Array.isArray(value) && value.every(isMangaSearchResultDto)
}

export function validateMangaSearchResultDtoArray(value: unknown): IMangaSearchResultDto[] {
  if (!Array.isArray(value)) throw new Error('Expected array')
  return value.map(validateMangaSearchResultDto)
}

export function isMangaDetailDto(value: unknown): value is IMangaDetailDto {
  return MangaDetailDto.safeParse(value).success
}

export function validateMangaDetailDto(value: unknown): IMangaDetailDto {
  return MangaDetailDto.parse(value)
}
