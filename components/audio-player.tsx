"use client"

import { useEffect, useRef, useState } from "react"
import { Play, Pause, ThumbsUp, ThumbsDown, MoreVertical } from 'lucide-react'

interface AudioPlayerProps {
  audioUrl: string
  title?: string
}

export default function AudioPlayer({
  audioUrl,
  title = "Digital Marketing Strategies for Small Business in 2025",
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60)
    const sec = Math.floor(time % 60)
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
  }

  const handlePlayPause = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch((err) => console.error("Playback error:", err))
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current) return

    const rect = progressRef.current.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    const newTime = pos * duration

    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!audioRef.current) return

    // Arrow keys for seeking
    if (e.key === "ArrowRight") {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration)
    } else if (e.key === "ArrowLeft") {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0)
    } else if (e.key === " ") {
      // Space bar for play/pause
      e.preventDefault()
      handlePlayPause()
    }
  }

  useEffect(() => {
    if (!audioRef.current) return

    const audio = audioRef.current

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }
    const onEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("loadedmetadata", onLoadedMetadata)
    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("ended", onEnded)

    return () => {
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("ended", onEnded)
    }
  }, [audioUrl])

  return (
    <div className="w-full">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Title and controls */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-gray-800">{title}</h3>
        <div className="flex space-x-1">
          <button className="text-gray-600 hover:text-[#6a5acd]">
            <ThumbsUp className="h-5 w-5" />
          </button>
          <button className="text-gray-600 hover:text-[#6a5acd]">
            <ThumbsDown className="h-5 w-5" />
          </button>
          <button className="text-gray-600 hover:text-[#6a5acd]">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Player UI */}
      <div className="bg-purple-50 rounded-lg p-4" tabIndex={0} onKeyDown={handleKeyDown}>
        <div className="flex items-center space-x-4">
          {/* Play/Pause button */}
          <button
            onClick={handlePlayPause}
            className="h-12 w-12 rounded-full bg-[#6a5acd] hover:bg-[#5849c0] text-white flex items-center justify-center"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>

          {/* Progress bar and time */}
          <div className="flex-1">
            {/* Progress bar */}
            <div
              ref={progressRef}
              className="relative h-2 bg-purple-200 rounded-full cursor-pointer"
              onClick={handleProgressClick}
            >
              <div
                className="absolute top-0 left-0 h-full bg-[#6a5acd] rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[#6a5acd] rounded-full"></div>
              </div>
            </div>

            {/* Time display */}
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive mode badge */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-xs">
          Interactive mode <span className="ml-1 px-1 bg-purple-200 rounded text-[10px]">BETA</span>
        </div>
      </div>
    </div>
  )
}
