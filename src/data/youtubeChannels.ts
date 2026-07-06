/**
 * Canais fixos da página de vídeos. IDs resolvidos manualmente no YouTube
 * (busca por nome, filtro de canais) — a playlist de uploads de um canal é
 * o ID trocando o prefixo UC por UU.
 */
export interface YoutubeChannel {
  id: string;
  name: string;
  description: string;
}

export const YOUTUBE_CHANNELS: YoutubeChannel[] = [
  {
    id: 'UCpJrs2BwKwzILfoGNlu51_w',
    name: 'English Learning Podcast',
    description: 'Podcasts para treinar listening no dia a dia',
  },
  {
    id: 'UC_XmvfBdXyow1ek5Z9o13eQ',
    name: 'English Daily Practice',
    description: 'Prática diária de inglês em situações reais',
  },
  {
    id: 'UCKgpamMlm872zkGDcBJHYDg',
    name: 'Learn English With TV Series',
    description: 'Aprenda com cenas de séries e filmes',
  },
  {
    id: 'UCo3dBJKNW-iq4JXkYP1m2JQ',
    name: 'Daily English Talk',
    description: 'Conversações do cotidiano em inglês',
  },
  {
    id: 'UC2nc2XFaVKoyQuk5RIA2lmw',
    name: 'Confident English with Kirsty',
    description: 'Ganhe confiança para falar inglês',
  },
  {
    id: 'UCorR8eNgsM1BYp7sT-qLlMg',
    name: 'English Leap Podcast',
    description: 'Podcast para dar um salto no seu inglês',
  },
];

export function uploadsPlaylistId(channelId: string): string {
  return `UU${channelId.slice(2)}`;
}
