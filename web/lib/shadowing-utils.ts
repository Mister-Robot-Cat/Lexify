const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/

/** Extract an 11-character YouTube video id from a raw id or a full URL. */
export function extract_video_id_client(value: string): string | null {
  const trimmed = value.trim()
  if (YOUTUBE_ID_RE.test(trimmed)) return trimmed

  const match = trimmed.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([A-Za-z0-9_-]{11})/)
  return match ? match[1] : null
}

export function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
