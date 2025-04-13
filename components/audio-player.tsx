// components/AudioPlayer.tsx
"use client"

import { useState, useRef } from "react"
import { Play, Pause } from "lucide-react"

interface AudioPlayerProps {
  audioUrl: string
}

export default function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="bg-purple-50 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        <button
          onClick={togglePlay}
          className="h-12 w-12 rounded-full bg-[#6a5acd] hover:bg-[#5849c0] text-white flex items-center justify-center transition-colors"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </button>
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          hidden
        />
      </div>
    </div>
  );
}
