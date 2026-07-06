import { uploadsPlaylistId } from '../data/youtubeChannels';

export interface YoutubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1h

export function hasYoutubeApiKey(): boolean {
  return Boolean(import.meta.env.VITE_YOUTUBE_API_KEY);
}

/**
 * Lista os vídeos mais recentes de um canal via playlist de uploads
 * (playlistItems.list = 1 unidade de quota; nunca usar search.list = 100).
 * Cache em sessionStorage para não gastar quota a cada navegação.
 */
export async function getChannelVideos(
  channelId: string,
  maxResults = 24,
): Promise<YoutubeVideo[]> {
  const cacheKey = `ingles.yt.${channelId}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { at, videos } = JSON.parse(cached);
      if (Date.now() - at < CACHE_TTL_MS) return videos;
    }
  } catch {
    // cache corrompido: segue para a API
  }

  const key = import.meta.env.VITE_YOUTUBE_API_KEY;
  const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('playlistId', uploadsPlaylistId(channelId));
  url.searchParams.set('maxResults', String(maxResults));
  url.searchParams.set('key', key);

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const reason = body?.error?.errors?.[0]?.reason;
    if (reason === 'quotaExceeded') {
      throw new Error('Cota diária do YouTube esgotada. Tente amanhã.');
    }
    throw new Error('Não foi possível carregar os vídeos deste canal.');
  }
  const data = await res.json();

  const videos: YoutubeVideo[] = (data.items ?? [])
    .filter((i: { snippet?: { resourceId?: { videoId?: string } } }) =>
      i.snippet?.resourceId?.videoId,
    )
    .map(
      (i: {
        snippet: {
          title: string;
          publishedAt: string;
          resourceId: { videoId: string };
          thumbnails?: Record<string, { url: string }>;
        };
      }) => ({
        videoId: i.snippet.resourceId.videoId,
        title: i.snippet.title,
        thumbnail:
          i.snippet.thumbnails?.medium?.url ??
          i.snippet.thumbnails?.default?.url ??
          '',
        publishedAt: i.snippet.publishedAt,
      }),
    );

  sessionStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), videos }));
  return videos;
}
