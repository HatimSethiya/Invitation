import { useEffect, useRef, useState } from "react";
import { resolveMediaUrl } from "../services/api";

function InvitationMusicPlayer({
  music,
  visible,
  audioRef: sharedAudioRef,
  startRequestedRef: sharedStartRequestedRef,
  showControls = true,
}) {
  const localAudioRef = useRef(null);
  const audioRef = sharedAudioRef || localAudioRef;
  const previousAudioUrlRef = useRef(music?.audioUrl);
  const localStartRequestedRef = useRef(false);
  const startRequestedRef = sharedStartRequestedRef || localStartRequestedRef;
  const [isPlaying, setIsPlaying] = useState(false);
  const [playError, setPlayError] = useState("");

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || previousAudioUrlRef.current === music?.audioUrl) return;

    previousAudioUrlRef.current = music?.audioUrl;
    audio.pause();
    setIsPlaying(false);
    setPlayError("");
  }, [music?.audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !visible || !music?.autoplay || !music?.audioUrl) return;

    startRequestedRef.current = true;
    audio.play()
      .then(() => {
        startRequestedRef.current = false;
        setIsPlaying(true);
      })
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

    startRequestedRef.current = true;
    try {
      await audio.play();
      startRequestedRef.current = false;
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      setPlayError("Music could not start. Check the selected audio source.");
    }
  };

  if (!music?.audioUrl) return null;

  const retryRequestedPlayback = () => {
    const audio = audioRef.current;
    if (!audio || !startRequestedRef.current || !audio.paused) return;

    audio.play()
      .then(() => {
        startRequestedRef.current = false;
        setIsPlaying(true);
      })
      .catch(() => setIsPlaying(false));
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={resolveMediaUrl(music.audioUrl)}
        loop={music.loop !== false}
        preload="auto"
        onCanPlay={retryRequestedPlayback}
        onPlay={() => {
          startRequestedRef.current = false;
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          startRequestedRef.current = false;
          setIsPlaying(false);
          setPlayError("This audio source is unavailable or unsupported.");
        }}
      />
      {showControls && (
        <aside
          className={`invitation-music-player ${visible ? "music-player-visible" : "music-player-hidden"}`}
          aria-label="Wedding invitation music"
          aria-hidden={!visible}
          inert={!visible}
        >
          <button
            className="music-player-toggle music-player-icon-toggle"
            type="button"
            onClick={togglePlayback}
            aria-label={isPlaying ? "Pause wedding music" : "Resume wedding music"}
            title={playError || (isPlaying ? "Pause music" : "Resume music")}
            aria-pressed={isPlaying}
          >
            <span className="music-player-glyph" aria-hidden="true">{isPlaying ? "Ⅱ" : "♫"}</span>
          </button>
        </aside>
      )}
    </>
  );
}

export default InvitationMusicPlayer;
