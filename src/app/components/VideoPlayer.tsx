"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYouTubeApi(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  });
}

function setHighestQuality(target: any) {
  const levels: string[] = target.getAvailableQualityLevels?.() ?? [];
  target.setPlaybackQuality(levels[0] ?? "hd2160");
}

const qualityLabels: Record<string, string> = {
  highres: "4K+",
  hd2160: "2160p",
  hd1440: "1440p",
  hd1080: "1080p",
  hd720: "720p",
  large: "480p",
  medium: "360p",
  small: "240p",
  tiny: "144p",
  auto: "Auto",
  default: "Auto",
};

function qualityLabel(level: string) {
  return qualityLabels[level] ?? level;
}

function formatVideoTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Single engine behind every YouTube player on the site. Owns the YT.Player
 * instance and its custom-controls state; nothing plays until `start()` is
 * called from a user click, so no player autoplays on page load.
 */
export function useVideoPlayer() {
  const rawId = useId();
  const elementId = `yt-player-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const [playing, setPlaying] = useState(false);
  // Starts true so the shield stays up over YouTube's own paused/cued chrome
  // until playback genuinely begins.
  const [paused, setPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(true);
  const [quality, setQuality] = useState("auto");
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userPickedQuality = useRef(false);
  const activeVideoId = useRef<string | null>(null);

  function start(videoId: string, title?: string) {
    activeVideoId.current = videoId;
    setPlaying(true);
    setPaused(true);
    userPickedQuality.current = false;
    loadYouTubeApi().then(() => {
      // Ignore a stale load if the caller moved on to a different video
      // (e.g. rapidly clicking between destination cards).
      if (activeVideoId.current !== videoId) return;
      playerRef.current?.destroy?.();
      playerRef.current = new window.YT.Player(elementId, {
        width: "1920",
        height: "1080",
        videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e: any) => {
            const iframe = e.target.getIframe?.();
            if (iframe && title) iframe.title = title;
            setAvailableQualities(e.target.getAvailableQualityLevels?.() ?? []);
            setHighestQuality(e.target);
            e.target.playVideo();
            setDuration(e.target.getDuration());
            setVolume(e.target.getVolume());
            setMuted(true);
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
              if (playerRef.current) {
                setCurrentTime(playerRef.current.getCurrentTime());
                setDuration(playerRef.current.getDuration());
              }
            }, 250);
          },
          onStateChange: (e: any) => {
            setPaused(e.data !== window.YT.PlayerState.PLAYING);
            if (e.data === window.YT.PlayerState.PLAYING && !userPickedQuality.current) {
              setHighestQuality(e.target);
            }
          },
          onPlaybackQualityChange: (e: any) => {
            setQuality(e.data);
          },
        },
      });
    });
  }

  function stop() {
    activeVideoId.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    playerRef.current?.destroy?.();
    playerRef.current = null;
    setPlaying(false);
    setPaused(true);
    setCurrentTime(0);
    setDuration(0);
    setQuality("auto");
    setAvailableQualities([]);
    userPickedQuality.current = false;
  }

  function changeQuality(e: ChangeEvent<HTMLSelectElement>) {
    const level = e.target.value;
    userPickedQuality.current = level !== "default";
    playerRef.current?.setPlaybackQuality(level);
    setQuality(level === "default" ? "auto" : level);
  }

  function togglePlayPause() {
    if (!playerRef.current) return;
    if (paused) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }

  function seek(e: ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    setCurrentTime(value);
    playerRef.current?.seekTo(value, true);
  }

  function toggleMute() {
    if (!playerRef.current) return;
    if (muted) {
      playerRef.current.unMute();
      setMuted(false);
    } else {
      playerRef.current.mute();
      setMuted(true);
    }
  }

  function handleVolume(e: ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    setVolume(value);
    playerRef.current?.setVolume(value);
    if (value === 0) {
      setMuted(true);
      playerRef.current?.mute();
    } else {
      setMuted(false);
      playerRef.current?.unMute();
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      playerRef.current?.destroy?.();
    };
  }, []);

  return {
    elementId,
    playing,
    paused,
    currentTime,
    duration,
    volume,
    muted,
    quality,
    availableQualities,
    start,
    stop,
    togglePlayPause,
    seek,
    toggleMute,
    handleVolume,
    changeQuality,
  };
}

export type VideoPlayer = ReturnType<typeof useVideoPlayer>;

/** Mount point YT.Player replaces with its iframe, plus the cover shield
 * that masks YouTube's own paused/cued frame until playback truly starts. */
export function VideoStage({ player }: { player: VideoPlayer }) {
  return (
    <>
      <div id={player.elementId} />
      <div className={`video-shield${player.paused ? "" : " is-hidden"}`} aria-hidden="true" />
    </>
  );
}

/** The one custom control bar (play/pause, seek, volume, quality) shared by
 * every video on the site — ambient sections and the film modal alike. */
export function VideoControls({ player }: { player: VideoPlayer }) {
  return (
    <div className="video-controls">
      <button
        type="button"
        className="video-control-btn"
        onClick={player.togglePlayPause}
        aria-label={player.paused ? "Play video" : "Pause video"}
      >
        {player.paused ? (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        )}
      </button>
      <button
        type="button"
        className="video-control-btn"
        onClick={player.stop}
        aria-label="Stop video"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="6" y="6" width="12" height="12" rx="1.5" />
        </svg>
      </button>
      <span className="video-time">{formatVideoTime(player.currentTime)}</span>
      <input
        type="range"
        className="video-seek"
        min={0}
        max={player.duration || 0}
        step={0.1}
        value={player.currentTime}
        onChange={player.seek}
        aria-label="Seek video"
      />
      <span className="video-time">{formatVideoTime(player.duration)}</span>
      <button
        type="button"
        className="video-control-btn"
        onClick={player.toggleMute}
        aria-label={player.muted ? "Unmute video" : "Mute video"}
      >
        {player.muted ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" stroke="none" />
            <path d="M16 9l6 6M22 9l-6 6" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" stroke="none" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12" />
          </svg>
        )}
      </button>
      <input
        type="range"
        className="video-volume"
        min={0}
        max={100}
        value={player.muted ? 0 : player.volume}
        onChange={player.handleVolume}
        aria-label="Volume"
      />
      {player.availableQualities.length > 0 && (
        <select
          className="video-quality-select"
          value={player.quality}
          onChange={player.changeQuality}
          aria-label="Video quality"
        >
          <option value="default">Auto</option>
          {player.availableQualities.map((level) => (
            <option key={level} value={level}>
              {qualityLabel(level)}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
