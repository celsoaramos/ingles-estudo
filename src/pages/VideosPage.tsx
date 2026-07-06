import { useEffect, useState } from 'react';
import {
  uploadsPlaylistId,
  YOUTUBE_CHANNELS,
} from '../data/youtubeChannels';
import {
  getChannelVideos,
  hasYoutubeApiKey,
  type YoutubeVideo,
} from '../services/youtube';

export function VideosPage() {
  const [channelId, setChannelId] = useState(YOUTUBE_CHANNELS[0].id);
  const [videos, setVideos] = useState<YoutubeVideo[] | null>(null);
  const [playing, setPlaying] = useState<YoutubeVideo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const channel = YOUTUBE_CHANNELS.find((c) => c.id === channelId)!;
  const withApi = hasYoutubeApiKey();

  useEffect(() => {
    if (!withApi) return;
    let active = true;
    setVideos(null);
    setError(null);
    setPlaying(null);
    getChannelVideos(channelId)
      .then((v) => active && setVideos(v))
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [channelId, withApi]);

  return (
    <div className="container">
      <header className="home-header">
        <div className="label">Listening</div>
        <h1>
          Vídeos para <span className="accent">treinar o ouvido</span>
        </h1>
        <p className="subtitle">
          Canais selecionados do YouTube — assista sem sair daqui
        </p>
      </header>

      <div className="category-chips video-channels">
        {YOUTUBE_CHANNELS.map((c) => (
          <button
            type="button"
            key={c.id}
            className={`chip ${c.id === channelId ? 'active' : ''}`}
            onClick={() => setChannelId(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <p className="video-channel-desc">{channel.description}</p>

      {playing && (
        <div className="video-player">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${playing.videoId}?autoplay=1`}
            title={playing.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <p className="video-playing-title">{playing.title}</p>
        </div>
      )}

      {!withApi ? (
        <>
          <div className="video-player">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/videoseries?list=${uploadsPlaylistId(channelId)}`}
              title={channel.name}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="stats-tip">
            💡 Configure a <code>VITE_YOUTUBE_API_KEY</code> no .env para ver a
            lista de vídeos com títulos e miniaturas. Por enquanto, navegue
            pela playlist dentro do player acima.
          </p>
        </>
      ) : error ? (
        <p className="auth-error">{error}</p>
      ) : videos === null ? (
        <p className="empty-state">Carregando vídeos…</p>
      ) : (
        <div className="video-grid">
          {videos.map((v) => (
            <button
              type="button"
              key={v.videoId}
              className={`video-card ${playing?.videoId === v.videoId ? 'playing' : ''}`}
              onClick={() => {
                setPlaying(v);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <img src={v.thumbnail} alt="" loading="lazy" />
              <span className="video-title">{v.title}</span>
              <span className="video-date">
                {new Date(v.publishedAt).toLocaleDateString('pt-BR')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
