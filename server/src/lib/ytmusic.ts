// Fast search via ytmusic-api. videoIds cleaned before use.
import YTMusic from 'ytmusic-api';

let ytmusic: YTMusic | null = null;

async function getClient(): Promise<YTMusic> {
  if (!ytmusic) {
    ytmusic = new YTMusic();
    await ytmusic.initialize();
  }
  return ytmusic;
}

export interface Track {
  videoId: string;
  title: string;
  artist: string;
  album: string;
  thumbnail: string;
  duration: number;
}

export interface SearchResults {
  songs: Track[];
  albums: { albumId: string; title: string; artist: string; thumbnail: string }[];
  artists: { artistId: string; name: string; thumbnail: string }[];
}

function thumb(thumbnails: unknown): string {
  if (!Array.isArray(thumbnails) || thumbnails.length === 0) return '';
  const sorted = [...thumbnails].sort(
    (a: { width?: number }, b: { width?: number }) => (b.width ?? 0) - (a.width ?? 0)
  );
  return (sorted[0] as { url?: string }).url ?? '';
}

function parseDuration(d: unknown): number {
  if (typeof d === 'number') return d;
  if (typeof d === 'string') {
    const parts = d.split(':').map(Number);
    if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
    if (parts.length === 3) return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  }
  return 0;
}

// YouTube videoIds are always exactly 11 chars — strip anything else
function cleanId(id: unknown): string {
  if (typeof id !== 'string') return '';
  return id.split('&')[0].split('?')[0].trim().slice(0, 11);
}

export async function searchMusic(query: string): Promise<SearchResults> {
  const client = await getClient();

  const [songs, albums, artists] = await Promise.allSettled([
    client.searchSongs(query),
    client.searchAlbums(query),
    client.searchArtists(query),
  ]);

  return {
    songs: songs.status === 'fulfilled'
      ? songs.value
        .slice(0, 20)
        .map((s: Record<string, unknown>) => ({
          videoId: cleanId(s['videoId']),
          title: (s['name'] as string) ?? (s['title'] as string) ?? 'Unknown',
          artist: (s['artist'] as Record<string, string>)?.['name'] ?? (s['artist'] as string) ?? 'Unknown',
          album: (s['album'] as Record<string, string>)?.['name'] ?? '',
          thumbnail: thumb(s['thumbnails']),
          duration: parseDuration(s['duration']),
        }))
        .filter(s => s.videoId.length === 11)
      : [],

    albums: albums.status === 'fulfilled'
      ? albums.value.slice(0, 10).map((a: Record<string, unknown>) => ({
        albumId: (a['albumId'] as string) ?? '',
        title: (a['name'] as string) ?? '',
        artist: (a['artist'] as Record<string, string>)?.['name'] ?? '',
        thumbnail: thumb(a['thumbnails']),
      }))
      : [],

    artists: artists.status === 'fulfilled'
      ? artists.value.slice(0, 10).map((a: Record<string, unknown>) => ({
        artistId: (a['artistId'] as string) ?? '',
        name: (a['name'] as string) ?? '',
        thumbnail: thumb(a['thumbnails']),
      }))
      : [],
  };
}

export async function getArtistData(artistId: string) {
  const client = await getClient();
  const a = await client.getArtist(artistId) as Record<string, unknown>;
  const topSongs = ((a['topSongs'] as Record<string, unknown>[]) ?? []).slice(0, 15);
  const albumsList = ((a['albums'] as Record<string, unknown>[]) ?? []).slice(0, 20);

  return {
    artistId,
    name: (a['name'] as string) ?? '',
    thumbnail: thumb(a['thumbnails']),
    topTracks: topSongs
      .map((s: Record<string, unknown>) => ({
        videoId: cleanId(s['videoId']),
        title: (s['name'] as string) ?? '',
        artist: (a['name'] as string) ?? '',
        album: '',
        thumbnail: thumb(s['thumbnails']),
        duration: parseDuration(s['duration']),
      }))
      .filter((s: Track) => s.videoId.length === 11),
    albums: albumsList.map((al: Record<string, unknown>) => ({
      albumId: (al['albumId'] as string) ?? '',
      title: (al['name'] as string) ?? '',
      thumbnail: thumb(al['thumbnails']),
    })),
  };
}

export async function getAlbumData(albumId: string) {
  const client = await getClient();
  const a = await client.getAlbum(albumId) as Record<string, unknown>;
  const tracks = ((a['songs'] as Record<string, unknown>[]) ?? []);

  return {
    albumId,
    title: (a['name'] as string) ?? '',
    artist: (a['artist'] as Record<string, string>)?.['name'] ?? '',
    thumbnail: thumb(a['thumbnails']),
    tracks: tracks
      .map((s: Record<string, unknown>) => ({
        videoId: cleanId(s['videoId']),
        title: (s['name'] as string) ?? '',
        artist: (a['artist'] as Record<string, string>)?.['name'] ?? '',
        album: (a['name'] as string) ?? '',
        thumbnail: thumb(a['thumbnails']),
        duration: parseDuration(s['duration']),
      }))
      .filter((s: Track) => s.videoId.length === 11),
  };
}

export async function getRelatedTracks(videoId: string): Promise<Track[]> {
  const client = await getClient();
  try {
    const related = await client.getUpNexts(videoId);
    return related
      .slice(0, 20)
      .map((s) => ({
        videoId: cleanId(s.videoId),
        title: s.title ?? 'Unknown',
        artist: s.artists?.name ?? 'Unknown',
        album: '',
        thumbnail: thumb(s.thumbnails),
        duration: s.duration ?? 0,
      }))
      .filter(s => s.videoId.length === 11);
  } catch {
    return [];
  }
}