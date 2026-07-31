import {
  AnimeDetailDto,
  AnimeSearchResultDto,
  type IAnimeDetailDto,
  type IAnimeSearchResultDto,
} from '@/apis/dtos/animeDto'

export function isAnimeSearchResultDto(value: unknown): value is IAnimeSearchResultDto {
  return AnimeSearchResultDto.safeParse(value).success
}

export function validateAnimeSearchResultDto(value: unknown): IAnimeSearchResultDto {
  return AnimeSearchResultDto.parse(value)
}

export function isAnimeSearchResultDtoArray(value: unknown): value is IAnimeSearchResultDto[] {
  return Array.isArray(value) && value.every(isAnimeSearchResultDto)
}

export function validateAnimeSearchResultDtoArray(value: unknown): IAnimeSearchResultDto[] {
  if (!Array.isArray(value)) throw new Error('Expected array')
  return value.map(validateAnimeSearchResultDto)
}

export function isAnimeDetailDto(value: unknown): value is IAnimeDetailDto {
  return AnimeDetailDto.safeParse(value).success
}

export function validateAnimeDetailDto(value: unknown): IAnimeDetailDto {
  return AnimeDetailDto.parse(value)
}
