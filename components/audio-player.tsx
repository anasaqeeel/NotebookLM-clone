"use client"

import { useEffect, useRef, useState, forwardRef } from "react"
import { Play, Pause, SkipForward, SkipBack } from "lucide-react"

interface AudioPlayerProps {
  audioUrl: string
  onPause?: () => void
}

const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(({ audioUrl, onPause }, ref) => {
  const internalAudioRef = useRef<HTMLAudioElement | null>(null)

  // Check if ref is a function or a RefObject and assign accordingly
  const combinedRef = ref && 'current' in ref ? ref : internalAudioRef

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = combinedRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }
    const handlePauseInternal = () => {
      setIsPlaying(false)
      if (onPause) onPause()
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("pause", handlePauseInternal)

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("pause", handlePauseInternal)
    }
  }, [audioUrl, onPause, combinedRef])

  const handlePlayPause = () => {
    const audio = combinedRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().then(() => setIsPlaying(true)).catch((err: any) => { // Added 'any' to err
        console.error("Playback error:", err)
        setIsPlaying(false)
      })
    }
  }

  const skipTime = (offset: number) => {
    const audio = combinedRef.current
    if (!audio) return
    let newTime = audio.currentTime + offset
    newTime = Math.max(0, Math.min(newTime, duration))
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = combinedRef.current
    if (!audio) return
    const time = parseFloat(e.target.value)
    audio.currentTime = time
    setCurrentTime(time)
  }

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60)
    const sec = Math.floor(time % 60)
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
  }

  return (
    <div className="bg-purple-50 rounded-lg p-4 shadow-md">
      <audio ref={combinedRef} src={audioUrl} preload="auto" />
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => skipTime(-10)} className="text-purple-700 hover:text-purple-900">
          <SkipBack size={24} />
        </button>
        <button
          onClick={handlePlayPause}
          className="h-12 w-12 rounded-full bg-[#6a5acd] hover:bg-[#5849c0] text-white flex items-center justify-center"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button onClick={() => skipTime(10)} className="text-purple-700 hover:text-purple-900">
          <SkipForward size={24} />
        </button>
        <div className="ml-auto text-xs text-gray-600">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={duration}
        step="0.1"
        value={currentTime}
        onChange={handleSeek}
        className="w-full accent-[#6a5acd] cursor-pointer"
      />
    </div>
  )
})

AudioPlayer.displayName = "AudioPlayer"
export default AudioPlayer
