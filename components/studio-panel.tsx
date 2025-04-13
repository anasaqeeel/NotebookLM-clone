// components/StudioPanel.tsx
"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import AudioPlayer from "@/components/audio-player"
import AudioGeneration from "@/components/audio-generation-states"

export default function StudioPanel() {
  const [audioState, setAudioState] = useState<"idle" | "generating" | "ready">("idle")
  const [audioUrl, setAudioUrl] = useState("")

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-purple-100 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-800">Audio Studio</h2>
        <button className="text-gray-600 hover:text-[#6a5acd]">
          <Info className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4 flex-1 overflow-auto">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Audio Overview</h3>
        </div>
        {audioState !== "ready" ? (
          <AudioGeneration
            state={audioState}
            setAudioUrl={setAudioUrl}
            setState={setAudioState}
          />
        ) : (
          <div className="mb-6">
            <AudioPlayer audioUrl={audioUrl} />
            <div className="mt-4 text-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-xs">
                Interactive mode <span className="ml-1 px-1 bg-purple-200 rounded text-[10px]">BETA</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
