import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";

function MusicLibraryDialog({ selectedTrackId = "", onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [previewTrackId, setPreviewTrackId] = useState("");
  const previewAudioRef = useRef(null);
  const requestIdRef = useRef(0);

  const loadTracks = useCallback(async ({ search = "", start = 0, append = false } = {}) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/music/catalog", {
        params: { query: search, offset: start, limit: 24 },
      });

      if (requestId !== requestIdRef.current) return;

      const nextTracks = Array.isArray(response.data.tracks) ? response.data.tracks : [];
      setTracks((current) => append ? [...current, ...nextTracks] : nextTracks);
      setOffset(Number(response.data.nextOffset ?? start + nextTracks.length));
      setHasMore(Boolean(response.data.hasMore));
      setCatalogLoaded(true);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.response?.data?.message || "Unable to load instrumental tracks.");
      setCatalogLoaded(true);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!catalogLoaded && !loading) loadTracks();
  }, [catalogLoaded, loading, loadTracks]);

  useEffect(() => () => {
    requestIdRef.current += 1;
    if (previewAudioRef.current) previewAudioRef.current.pause();
  }, []);

  const previewTrack = async (track) => {
    const audio = previewAudioRef.current;
    if (!audio) return;

    if (previewTrackId === track.id && !audio.paused) {
      audio.pause();
      setPreviewTrackId("");
      return;
    }

    audio.pause();
    audio.src = track.audioUrl;
    setPreviewTrackId(track.id);
    setError("");

    try {
      await audio.play();
    } catch {
      setPreviewTrackId("");
      setError("This preview could not start. Try another track.");
    }
  };

  const chooseTrack = (track) => {
    if (previewAudioRef.current) previewAudioRef.current.pause();
    setPreviewTrackId("");
    onSelect(track);
  };

  const handleBackdropMouseDown = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="music-dialog-backdrop" onMouseDown={handleBackdropMouseDown}>
      <section
        className="music-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="music-dialog-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <header className="music-dialog-header">
          <div>
            <span className="eyebrow">Streamed audio</span>
            <h2 id="music-dialog-title">Choose wedding music</h2>
            <p>Preview an instrumental and attach its stream to this invitation.</p>
          </div>
          <button className="music-dialog-close" type="button" onClick={onClose} aria-label="Close music library">×</button>
        </header>

        <div className="music-search-row">
          <label className="music-search-field">Search instrumentals
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  loadTracks({ search: query, start: 0, append: false });
                }
              }}
              placeholder="Romantic piano, soft strings, acoustic..."
            />
          </label>
          <button className="primary-button" type="button" disabled={loading} onClick={() => loadTracks({ search: query, start: 0, append: false })}>
            {loading ? "Loading…" : "Search"}
          </button>
        </div>

        <div className="music-library-note">
          <span aria-hidden="true">ⓘ</span>
          <p>Tracks stream from Internet Archive; no song file is downloaded into this project. Only public-domain, CC0, CC BY and CC BY-SA tracks are listed.</p>
        </div>

        {error && (
          <div className="music-library-error" role="alert">
            <span>{error}</span>
            <button className="small-button" type="button" disabled={loading} onClick={() => loadTracks({ search: query, start: 0, append: false })}>Retry</button>
          </div>
        )}

        {loading && tracks.length === 0 && <div className="music-library-empty">Finding instrumentals…</div>}
        {!loading && catalogLoaded && tracks.length === 0 && !error && <div className="music-library-empty">No tracks found. Try “piano”, “strings” or “acoustic”.</div>}

        <div className="music-track-list music-dialog-track-list">
          {tracks.map((track) => {
            const selected = selectedTrackId === track.id;
            const previewing = previewTrackId === track.id;
            return (
              <article className={`music-track-card ${selected ? "selected" : ""}`} key={track.id}>
                <div className="music-track-artwork">
                  {track.artworkUrl
                    ? <img src={track.artworkUrl} alt="" loading="lazy" decoding="async" />
                    : <span aria-hidden="true">♫</span>}
                </div>
                <div className="music-track-info">
                  <strong>{track.title}</strong>
                  <span>{track.artist}</span>
                  <small>{Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, "0")} · Instrumental</small>
                  <div className="music-track-links">
                    {track.shareUrl && <a href={track.shareUrl} target="_blank" rel="noreferrer">Track details ↗</a>}
                    {track.licenseUrl && <a href={track.licenseUrl} target="_blank" rel="noreferrer">License ↗</a>}
                  </div>
                </div>
                <div className="music-track-actions">
                  <button className="small-button" type="button" disabled={!track.audioUrl} onClick={() => previewTrack(track)}>
                    {previewing ? "Pause preview" : "Preview"}
                  </button>
                  <button className={selected ? "music-use-button selected" : "music-use-button"} type="button" disabled={selected} onClick={() => chooseTrack(track)}>
                    {selected ? "Selected ✓" : "Use track"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {loading && tracks.length > 0 && <div className="music-library-loading-more">Loading more tracks…</div>}
        {hasMore && !loading && (
          <div className="music-load-more">
            <button className="secondary-button" type="button" onClick={() => loadTracks({ search: query, start: offset, append: true })}>Load more instrumentals</button>
          </div>
        )}
        <audio ref={previewAudioRef} preload="none" onEnded={() => setPreviewTrackId("")} />
      </section>
    </div>
  );
}

export default MusicLibraryDialog;
