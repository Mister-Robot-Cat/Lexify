'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bookmark,
  Circle,
  Gauge,
  Loader2,
  Mic,
  Pause,
  Play,
  Repeat,
  Rewind,
  Settings,
  SkipBack,
  SkipForward,
  Square,
  Subtitles,
  X,
} from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { extract_video_id_client, formatTime } from '@/lib/shadowing-utils'
import { loadYouTubeApi, playBeep } from '@/lib/youtube'
import type { ShadowingSegment, ShadowingTranscript, ShadowingVideoSummary } from '@/lib/types'

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

interface LoopSettings {
  repeat: number
  section: number
  subtitleOnly: boolean
  waitAfterBeep: number
  stopAfterLoop: boolean
}

const DEFAULT_SETTINGS: LoopSettings = {
  repeat: 3,
  section: 1,
  subtitleOnly: false,
  waitAfterBeep: 1,
  stopAfterLoop: false,
}

function SettingsPanel({
  settings,
  onChange,
  onClose,
}: {
  settings: LoopSettings
  onChange: (s: LoopSettings) => void
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-white/10 bg-[#12121a] p-4 shadow-2xl"
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">Shadowing settings</h4>
        <button onClick={onClose} aria-label="Close settings" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/10 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <label className="flex items-center justify-between gap-3">
          <span className="text-muted-light">Repeat count</span>
          <input
            type="number"
            min={1}
            max={20}
            value={settings.repeat}
            onChange={(e) => onChange({ ...settings, repeat: Number(e.target.value) || 1 })}
            className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center text-white outline-none focus:border-primary"
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-muted-light">Section repeat (lines)</span>
          <input
            type="number"
            min={1}
            max={10}
            value={settings.section}
            onChange={(e) => onChange({ ...settings, section: Number(e.target.value) || 1 })}
            className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center text-white outline-none focus:border-primary"
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-muted-light">Wait after beep (sec)</span>
          <input
            type="number"
            min={0}
            max={10}
            value={settings.waitAfterBeep}
            onChange={(e) => onChange({ ...settings, waitAfterBeep: Number(e.target.value) || 0 })}
            className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center text-white outline-none focus:border-primary"
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-muted-light">Subtitle only (hide video)</span>
          <input
            type="checkbox"
            checked={settings.subtitleOnly}
            onChange={(e) => onChange({ ...settings, subtitleOnly: e.target.checked })}
            className="h-5 w-5 rounded border-white/20 bg-white/5 accent-primary"
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-muted-light">Stop after loop finishes</span>
          <input
            type="checkbox"
            checked={settings.stopAfterLoop}
            onChange={(e) => onChange({ ...settings, stopAfterLoop: e.target.checked })}
            className="h-5 w-5 rounded border-white/20 bg-white/5 accent-primary"
          />
        </label>
      </div>
    </motion.div>
  )
}

function TranscriptPasteForm({
  videoId,
  onSaved,
  onRetry,
}: {
  videoId: string
  onSaved: (t: ShadowingTranscript) => void
  onRetry: () => void
}) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await api.shadowing.submitTranscript(videoId, text)
      onSaved(result)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to parse transcript')
    } finally {
      setBusy(false)
    }
  }

  const retry = async () => {
    setRetrying(true)
    await onRetry()
    setRetrying(false)
  }

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="mb-1 font-semibold text-white">No transcript available yet</h3>
          <p className="text-sm text-muted-light">
            Auto-fetching captions from YouTube didn&apos;t work for this video — YouTube often
            blocks caption requests from server/cloud IPs. You can retry (useful if this is
            temporary), or paste an SRT/WebVTT transcript below — most TED talks have one
            downloadable from ted.com — and it&apos;s cached for everyone after that.
          </p>
        </div>
        <button
          onClick={retry}
          disabled={retrying}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 disabled:opacity-60"
        >
          {retrying && <Loader2 size={12} className="animate-spin" />}
          Retry
        </button>
      </div>
      <form onSubmit={submit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'1\n00:00:00,000 --> 00:00:03,000\nHello and welcome...'}
          rows={10}
          className="w-full resize-none rounded-lg border border-white/10 bg-white/5 p-3 font-mono text-xs text-white outline-none focus:border-primary"
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="glow-button mt-3 flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {busy && <Loader2 size={14} className="animate-spin" />}
          Save transcript
        </button>
      </form>
    </div>
  )
}

function VideoBrowser({ onSelect }: { onSelect: (videoId: string, title: string) => void }) {
  const [videos, setVideos] = useState<ShadowingVideoSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [customUrl, setCustomUrl] = useState('')
  const [customError, setCustomError] = useState('')

  useEffect(() => {
    api.shadowing.videos().then(setVideos).finally(() => setLoading(false))
  }, [])

  const openCustom = (e: React.FormEvent) => {
    e.preventDefault()
    const id = extract_video_id_client(customUrl)
    if (!id) {
      setCustomError('Could not find a YouTube video id in that link.')
      return
    }
    setCustomError('')
    onSelect(id, '')
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold text-white">Shadowing</h1>
      <p className="mt-1 text-muted-light">
        Watch a talk, follow the transcript, and repeat each line out loud until it&apos;s
        automatic.
      </p>

      <form onSubmit={openCustom} className="glass-card mt-6 flex gap-2 p-4">
        <input
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
          placeholder="Paste any YouTube link (TED talks work great)..."
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="glow-button rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Open
        </button>
      </form>
      {customError && <p className="mt-2 text-sm text-red-400">{customError}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v, i) => (
            <motion.button
              key={v.video_id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(v.video_id, v.title)}
              className="feature-card text-left"
            >
              <div className="relative mb-3 aspect-video overflow-hidden rounded-lg bg-black/40">
                <img
                  src={`https://img.youtube.com/vi/${v.video_id}/mqdefault.jpg`}
                  alt=""
                  className="h-full w-full object-cover"
                />
                {v.bookmarked && (
                  <span className="absolute right-2 top-2 rounded-full bg-primary/90 p-1.5">
                    <Bookmark size={12} className="fill-white text-white" />
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-white">{v.title}</h4>
              {v.speaker && <p className="mt-1 text-sm text-muted-light">{v.speaker}</p>}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}

function ShadowingSession({
  videoId,
  fallbackTitle,
  onBack,
}: {
  videoId: string
  fallbackTitle: string
  onBack: () => void
}) {
  const playerRef = useRef<HTMLDivElement>(null)
  const playerInstance = useRef<any>(null)
  const pollRef = useRef<number | null>(null)
  const loopTimeoutRef = useRef<number | null>(null)
  const transcriptListRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  const [playerReady, setPlayerReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [settings, setSettings] = useState<LoopSettings>(DEFAULT_SETTINGS)
  const [showSettings, setShowSettings] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)

  const [transcript, setTranscript] = useState<ShadowingTranscript | null>(null)
  const [transcriptLoading, setTranscriptLoading] = useState(true)

  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [loopGroup, setLoopGroup] = useState<{ start: number; end: number } | null>(null)
  const [repeatsDone, setRepeatsDone] = useState(0)
  const [waiting, setWaiting] = useState(false)

  const [recording, setRecording] = useState(false)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)

  const segments = transcript?.segments ?? []

  const loadTranscript = useCallback(async () => {
    setTranscriptLoading(true)
    try {
      const result = await api.shadowing.transcript(videoId)
      setTranscript(result)
    } catch {
      setTranscript(null)
    } finally {
      setTranscriptLoading(false)
    }
  }, [videoId])

  useEffect(() => {
    loadTranscript()
  }, [loadTranscript])

  // Load YouTube player
  useEffect(() => {
    let cancelled = false
    loadYouTubeApi().then((YT) => {
      if (cancelled || !playerRef.current) return
      playerInstance.current = new YT.Player(playerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: (e: any) => {
            setPlayerReady(true)
            setDuration(e.target.getDuration())
          },
          onStateChange: (e: any) => {
            setIsPlaying(e.data === 1)
          },
        },
      })
    })
    return () => {
      cancelled = true
      playerInstance.current?.destroy?.()
      playerInstance.current = null
      setPlayerReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId])

  // Poll current time
  useEffect(() => {
    if (!playerReady) return
    pollRef.current = window.setInterval(() => {
      const player = playerInstance.current
      if (!player?.getCurrentTime) return
      setCurrentTime(player.getCurrentTime())
    }, 200)
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current)
    }
  }, [playerReady])

  // Determine active segment from current time (only when not manually looping)
  useEffect(() => {
    if (segments.length === 0 || loopGroup) return
    const idx = segments.findIndex(
      (s, i) =>
        currentTime >= s.start &&
        (i === segments.length - 1 || currentTime < segments[i + 1].start)
    )
    if (idx !== -1) setActiveIndex(idx)
  }, [currentTime, segments, loopGroup])

  // Auto-scroll active line into view
  useEffect(() => {
    if (activeIndex === null) return
    const el = transcriptListRef.current?.querySelector(`[data-idx="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [activeIndex])

  // Loop enforcement: watch for reaching the end of the active loop group
  useEffect(() => {
    if (!loopGroup || waiting) return
    const groupEnd = segments[loopGroup.end]
    if (!groupEnd) return
    const groupEndTime = groupEnd.start + groupEnd.duration

    if (currentTime >= groupEndTime - 0.05) {
      const player = playerInstance.current
      if (!player) return

      if (repeatsDone + 1 >= settings.repeat) {
        // Loop finished
        if (settings.stopAfterLoop) {
          player.pauseVideo?.()
          setLoopGroup(null)
          setRepeatsDone(0)
          return
        }
        const nextStart = loopGroup.end + 1
        if (nextStart < segments.length) {
          setLoopGroup(null)
          setRepeatsDone(0)
          setActiveIndex(nextStart)
        } else {
          player.pauseVideo?.()
          setLoopGroup(null)
          setRepeatsDone(0)
        }
        return
      }

      // Repeat again: beep, wait, then seek back
      playBeep()
      setWaiting(true)
      player.pauseVideo?.()
      loopTimeoutRef.current = window.setTimeout(() => {
        player.seekTo?.(segments[loopGroup.start].start, true)
        player.playVideo?.()
        setRepeatsDone((n) => n + 1)
        setWaiting(false)
      }, settings.waitAfterBeep * 1000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, loopGroup, repeatsDone, settings, waiting])

  useEffect(() => {
    return () => {
      if (loopTimeoutRef.current) window.clearTimeout(loopTimeoutRef.current)
    }
  }, [])

  const startLoopAt = useCallback(
    (index: number) => {
      const end = Math.min(index + settings.section - 1, segments.length - 1)
      setLoopGroup({ start: index, end })
      setRepeatsDone(0)
      setActiveIndex(index)
      const player = playerInstance.current
      player?.seekTo?.(segments[index].start, true)
      player?.playVideo?.()
    },
    [segments, settings.section]
  )

  const togglePlay = () => {
    const player = playerInstance.current
    if (!player) return
    if (isPlaying) player.pauseVideo?.()
    else player.playVideo?.()
  }

  const skip = (direction: 1 | -1) => {
    if (activeIndex === null || segments.length === 0) return
    const next = Math.min(Math.max(activeIndex + direction, 0), segments.length - 1)
    setLoopGroup(null)
    setActiveIndex(next)
    playerInstance.current?.seekTo?.(segments[next].start, true)
  }

  const changeSpeed = () => {
    const idx = SPEEDS.indexOf(speed)
    const next = SPEEDS[(idx + 1) % SPEEDS.length]
    setSpeed(next)
    playerInstance.current?.setPlaybackRate?.(next)
  }

  const toggleBookmark = async () => {
    try {
      if (bookmarked) {
        await api.shadowing.removeBookmark(videoId)
        setBookmarked(false)
      } else {
        await api.shadowing.bookmark(videoId, transcript?.title || fallbackTitle, currentTime)
        setBookmarked(true)
      }
    } catch {
      // Non-critical — bookmarking failures shouldn't interrupt the session.
    }
  }

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop()
      setRecording(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      recordedChunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
        setRecordingUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
    } catch {
      setRecording(false)
    }
  }

  const progressPct = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-light hover:text-white"
        >
          <SkipBack size={14} />
          Back to videos
        </button>
        <div className="relative">
          <button
            onClick={() => setShowSettings((s) => !s)}
            aria-label="Shadowing settings"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            <Settings size={16} />
          </button>
          <AnimatePresence>
            {showSettings && (
              <SettingsPanel
                settings={settings}
                onChange={setSettings}
                onClose={() => setShowSettings(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className={settings.subtitleOnly ? 'sr-only' : 'mb-4'}>
        <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
          <div ref={playerRef} className="h-full w-full" />
        </div>
      </div>

      {settings.subtitleOnly && (
        <div className="glass-card mb-4 flex items-center justify-center gap-2 p-6 text-muted-light">
          <Subtitles size={18} />
          Subtitle-only mode — audio is still playing
        </div>
      )}

      {/* Control bar */}
      <div className="glass-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => activeIndex !== null && startLoopAt(activeIndex)}
            aria-label="Repeat current line"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-white/10"
          >
            <Rewind size={18} />
          </button>
          <button
            onClick={() => skip(-1)}
            aria-label="Previous line"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-white/10"
          >
            <SkipBack size={18} />
          </button>
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>
          <button
            onClick={() => skip(1)}
            aria-label="Next line"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-white/10"
          >
            <SkipForward size={18} />
          </button>
          <button
            onClick={changeSpeed}
            aria-label="Playback speed"
            className="flex h-11 min-w-[44px] items-center justify-center gap-1 rounded-lg px-2 text-sm font-medium text-white hover:bg-white/10"
          >
            <Gauge size={16} />
            {speed}x
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleRecording}
            aria-label={recording ? 'Stop recording' : 'Record your voice'}
            className={`flex h-11 w-11 items-center justify-center rounded-lg ${
              recording ? 'bg-red-500/20 text-red-400' : 'text-white hover:bg-white/10'
            }`}
          >
            {recording ? <Square size={16} /> : <Mic size={18} />}
          </button>
          <button
            onClick={toggleBookmark}
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this video'}
            className={`flex h-11 w-11 items-center justify-center rounded-lg ${
              bookmarked ? 'text-primary' : 'text-white hover:bg-white/10'
            }`}
          >
            <Bookmark size={18} className={bookmarked ? 'fill-primary' : ''} />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
        <span>{formatTime(currentTime)}</span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-primary" style={{ width: `${progressPct}%` }} />
        </div>
        <span>{formatTime(duration)}</span>
      </div>

      {recordingUrl && (
        <div className="glass-card mt-3 flex items-center gap-3 p-3">
          <span className="text-xs text-muted-light">Your recording:</span>
          <audio controls src={recordingUrl} className="h-8 flex-1" />
        </div>
      )}

      {loopGroup && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm text-primary">
          <Repeat size={14} />
          Looping {waiting ? '· waiting...' : `· repeat ${repeatsDone + 1} / ${settings.repeat}`}
          <button
            onClick={() => {
              setLoopGroup(null)
              setRepeatsDone(0)
            }}
            className="ml-auto text-xs underline"
          >
            Stop loop
          </button>
        </div>
      )}

      {/* Transcript */}
      <div className="glass-card mt-4 max-h-[420px] overflow-y-auto p-4" ref={transcriptListRef}>
        {transcriptLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !transcript || segments.length === 0 ? (
          <TranscriptPasteForm videoId={videoId} onSaved={setTranscript} onRetry={loadTranscript} />
        ) : (
          <div className="space-y-1">
            {segments.map((seg, i) => (
              <button
                key={i}
                data-idx={i}
                onClick={() => startLoopAt(i)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  activeIndex === i
                    ? 'bg-primary/15 text-white'
                    : 'text-muted-light hover:bg-white/5 hover:text-white'
                } ${loopGroup && i >= loopGroup.start && i <= loopGroup.end ? 'ring-1 ring-primary/40' : ''}`}
              >
                <span className="mr-2 font-mono text-xs text-muted">{formatTime(seg.start)}</span>
                {seg.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ShadowingPage() {
  const [session, setSession] = useState<{ videoId: string; title: string } | null>(null)

  return (
    <AnimatePresence mode="wait">
      {session ? (
        <motion.div
          key="session"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ShadowingSession
            videoId={session.videoId}
            fallbackTitle={session.title}
            onBack={() => setSession(null)}
          />
        </motion.div>
      ) : (
        <motion.div key="browser" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <VideoBrowser onSelect={(videoId, title) => setSession({ videoId, title })} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
