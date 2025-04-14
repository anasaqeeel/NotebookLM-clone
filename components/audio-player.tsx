"use client"

import { useEffect, useRef, useState } from "react"
import { Play, Pause, SkipForward, SkipBack } from "lucide-react"

interface AudioPlayerProps {
  audioUrl: string
}

export default function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const handlePlayPause = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Playback error:", err)
          setIsPlaying(false)
        })
    }
  }

  const skipTime = (offset: number) => {
    if (!audioRef.current) return
    let newTime = audioRef.current.currentTime + offset
    newTime = Math.max(0, Math.min(newTime, duration))
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return
    const time = parseFloat(e.target.value)
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60)
    const sec = Math.floor(time % 60)
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    if (!audioRef.current) return

    const audio = audioRef.current
    const onLoadedMetadata = () => {
      setDuration(audio.duration)
    }
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }
    const onEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener("loadedmetadata", onLoadedMetadata)
    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("ended", onEnded)

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("ended", onEnded)
    }
  }, [audioUrl])

  return (
    <div className="bg-purple-50 rounded-lg p-4 shadow-md">
      <audio ref={audioRef} src={audioUrl} preload="auto" />
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
}
