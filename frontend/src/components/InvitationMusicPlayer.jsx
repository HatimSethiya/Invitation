import { useEffect, useRef, useState } from "react";
import { resolveMediaUrl } from "../services/api";

function InvitationMusicPlayer({
  music,
  visible,
  audioRef: sharedAudioRef,
  startRequestedRef: sharedStartRequestedRef,
  showControls = true,
  automaticOpening = false,
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
      .catch((error) => {
        if (error?.name === "NotAllowedError") startRequestedRef.current = false;
        setIsPlaying(false);
      });
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
      .catch((error) => {
        if (error?.name === "NotAllowedError") startRequestedRef.current = false;
        setIsPlaying(false);
      });
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
      {(showControls || automaticOpening) && (
        <aside
          className={`invitation-music-player ${visible || automaticOpening ? "music-player-visible" : "music-player-hidden"}${automaticOpening && !isPlaying ? " music-player-prompt-visible" : ""}`}
          aria-label="Wedding invitation music"
          aria-hidden={!visible && !automaticOpening}
          inert={!visible && !automaticOpening}
        >
          <button
            className={`music-player-toggle music-player-icon-toggle${automaticOpening && !isPlaying ? " music-player-needs-tap" : ""}`}
            type="button"
            onClick={togglePlayback}
            aria-label={isPlaying ? "Pause wedding music" : automaticOpening ? "Tap to enable wedding music" : "Resume wedding music"}
            title={playError || (isPlaying ? "Pause music" : "Resume music")}
            aria-pressed={isPlaying}
          >
            <span className="music-player-glyph" aria-hidden="true">{isPlaying ? "Ⅱ" : "♫"}</span>
            {automaticOpening && !isPlaying && (
              <span className="music-player-tap-label">Tap for sound</span>
            )}
          </button>
        </aside>
      )}
    </>
  );
}

export default InvitationMusicPlayer;
