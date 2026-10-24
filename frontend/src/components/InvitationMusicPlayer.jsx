import { useEffect, useRef, useState } from "react";

function InvitationMusicPlayer({ music, visible }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playError, setPlayError] = useState("");

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setIsPlaying(false);
    setPlayError("");
    audio.load();
  }, [music?.audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !visible || !music?.autoplay || !music?.audioUrl) return;

    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [visible, music?.autoplay, music?.audioUrl]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    setPlayError("");
    if (!audio.paused) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      setPlayError("Tap play again if your browser blocked audio.");
    }
  };

  if (!music?.audioUrl) return null;

  return (
    <aside
      className={`invitation-music-player ${visible ? "music-player-visible" : "music-player-hidden"}`}
      aria-label="Wedding invitation music"
      aria-hidden={!visible}
      inert={!visible}
    >
      <audio
        ref={audioRef}
        src={music.audioUrl}
        loop={music.loop !== false}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          setIsPlaying(false);
          setPlayError("This stream is temporarily unavailable.");
        }}
      />
      <button
        className="music-player-toggle"
        type="button"
        onClick={togglePlayback}
        aria-label={isPlaying ? "Pause wedding music" : "Play wedding music"}
        aria-pressed={isPlaying}
      >
        <span className="music-player-glyph" aria-hidden="true">{isPlaying ? "Ⅱ" : "♫"}</span>
        <span>{isPlaying ? "Pause music" : "Play music"}</span>
      </button>
      <div className="music-player-track">
        <strong>{music.title || "Wedding instrumental"}</strong>
        {music.artist && <span>{music.artist}</span>}
        {music.attribution && (
          <span className="music-player-credit">Music by {music.attribution}</span>
        )}
      </div>
      <div className="music-player-links">
        {music.shareUrl && (
          <a href={music.shareUrl} target="_blank" rel="noreferrer">Track</a>
        )}
        {music.licenseUrl && (
          <a href={music.licenseUrl} target="_blank" rel="noreferrer">License</a>
        )}
      </div>
      {playError && <span className="music-player-error" role="status">{playError}</span>}
    </aside>
  );
}

export default InvitationMusicPlayer;
