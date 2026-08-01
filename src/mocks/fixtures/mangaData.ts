import type { IMangaDetailDto, IMangaSearchResultDto } from '@/apis/dtos/mangaDto'

// Generated from the owner's Shikimori list; every entry is a real title.
export const mangaSearchResults: IMangaSearchResultDto[] = [
  {
    id: 'shikimori_130934-otonari-no-tenshi-sama-ni-itsunomanika-dame-ningen-ni-sarete',
    title: 'Otonari no Tenshi-sama ni Itsunomanika Dame Ningen ni Sareteita Ken',
    titleRussian: 'Ангел по соседству',
    titleJapanese: 'お隣の天使様にいつの間にか駄目人間にされていた件',
    titleEnglish: 'The Angel Next Door Spoils Me Rotten',
    volumesTotal: 0,
    chaptersTotal: 0,
    status: 'reading',
    score: 10,
    imageUrl: 'https://shikimori.io/system/mangas/original/130934.jpg',
    genres: ['Комедия', 'Романтика'],
    myTags: ['0f1a2b3c-4d5e-4f60-8a91-b2c3d4e5f601'],
    publishedFrom: '2022-01-06',
    source: 'shikimori',
  },
  {
    id: 'shikimori_126287-sousou-no-frieren',
    title: 'Sousou no Frieren',
    titleRussian: 'Провожающая в последний путь Фрирен',
    titleJapanese: '葬送のフリーレン',
    titleEnglish: 'Frieren: Beyond Journey\'s End',
    volumesTotal: 0,
    chaptersTotal: 0,
    status: 'reading',
    imageUrl: 'https://shikimori.io/system/mangas/original/126287.jpg',
    synopsis: 'Отгромыхали салюты и аплодисменты, стихли радостные крики толпы, съеден торжественный ужин, награды получены: герои, долго и упорно шедшие к исполнению цели, добились своего. Зло побеждено, невинные спасены и... что дальше? Наверное, надо к',
    genres: ['Сёнен', 'Приключения', 'Фэнтези'],
    publishedFrom: '2020-04-28',
    source: 'shikimori',
  },
  {
    id: 'shikimori_128534-kanojo-hitomishirimasu',
    title: 'Kanojo, Hitomishirimasu',
    titleRussian: 'Стесняшка на час',
    titleJapanese: '彼女、人見知ります',
    titleEnglish: 'Rent-A-(Really Shy!)-Girlfriend',
    volumesTotal: 3,
    chaptersTotal: 19,
    status: 'reading',
    score: 10,
    imageUrl: 'https://shikimori.io/system/mangas/original/128534.jpg',
    synopsis: 'Ответвление от манги «Девушка на час», рассказывающее о повседневной жизни Суми Сакурасавы.',
    genres: ['Комедия', 'Романтика'],
    myTags: ['0f1a2b3c-4d5e-4f60-8a91-b2c3d4e5f601'],
    publishedFrom: '2020-06-21',
    source: 'shikimori',
  },
]

type MangaDetailExtras = Pick<IMangaDetailDto, 'volumesRead' | 'chaptersRead' | 'authors'>

const DETAIL_EXTRAS: Record<string, MangaDetailExtras> = {
  'shikimori_128534-kanojo-hitomishirimasu': {
    chaptersRead: 19,
    volumesRead: 3,
  },
}

function shikimoriId(mediaId: string): string {
  return mediaId.split('_')[1].split('-')[0]
}

export const mangaDetails: Record<string, IMangaDetailDto> = Object.fromEntries(
  mangaSearchResults.map((item) => [
    item.id,
    {
      ...item,
      ...DETAIL_EXTRAS[item.id],
      externalLinks: [
        { source: 'Shikimori', url: `https://shikimori.one/mangas/${shikimoriId(item.id)}` },
      ],
    },
  ]),
)
