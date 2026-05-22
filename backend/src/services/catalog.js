/**
 * Catálogo — dados do Spotify for Artists do KYAN.
 * Snapshot manual (ver meta.note no JSON). Lê o arquivo e expõe + resumo.
 */
const path = require('path');
const data = require(path.join(__dirname, '../data/spotifyArtists.json'));

function getCatalog() {
  const topSong  = data.topSongs?.[0] || null;
  const topAlbum = data.albums?.[0]   || null;
  const totalAlbumStreams = (data.albums || []).reduce((s, a) => s + (a.streams || 0), 0);

  // álbum com maior crescimento (da análise detalhada)
  const growing = (data.albumAnalysis || [])
    .filter(a => String(a.growthStreams || '').startsWith('+'))
    .sort((a, b) => parseInt(b.growthStreams) - parseInt(a.growthStreams))[0] || null;

  return {
    ...data,
    summary: {
      topSong:  topSong  ? { title: topSong.title,  streams: topSong.streams }  : null,
      topAlbum: topAlbum ? { title: topAlbum.title, streams: topAlbum.streams } : null,
      totalAlbumStreams,
      tracksTracked:  (data.topSongs  || []).length,
      albumsTracked:  (data.albums    || []).length,
      fastestGrowing: growing ? { title: growing.title, growth: growing.growthStreams } : null,
    },
  };
}

module.exports = { getCatalog, data };
