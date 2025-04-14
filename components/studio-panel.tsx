"use client"

import { useState, useEffect } from "react"
import { Info, FileText, Plus } from 'lucide-react'
import AudioPlayer from "./audio-player"
import { useResearchContext } from "@/contexts/research-context"

export default function StudioPanel() {
  const { researchContent } = useResearchContext()
  const finalScript = researchContent?.trim() || ""  // Our generated podcast script from GPT

  const [audioUrl, setAudioUrl] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [showPlayer, setShowPlayer] = useState(false)

  // This function calls your /api/generateAudio endpoint to get an MP3 blob.
  const handleGenerateAndPlay = async () => {
    if (!finalScript) {
      setErrorMsg("No podcast script available. Generate a script first in the Podcast tab.")
      return
    }
    
    setErrorMsg("")
    setIsGenerating(true)
    setAudioUrl("") // Clear old audio
    setShowPlayer(false)

    try {
      console.log("Generating audio for script:", finalScript)
      
      const res = await fetch("/api/generateAudio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: finalScript }),
      })
      
      if (!res.ok) {
        const errText = await res.text()
        setErrorMsg("Audio generation failed: " + errText)
        setIsGenerating(false)
        return
      }
      
      const blob = await res.blob()
      if (blob.size === 0) {
        setErrorMsg("TTS service returned empty audio.")
        setIsGenerating(false)
        return
      }
      
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      setShowPlayer(true)
    } catch (error: any) {
      console.error("Error generating audio:", error)
      setErrorMsg("Error generating audio: " + error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Panel Header */}
      <div className="border-b border-purple-100 flex items-center justify-between pb-4">
        <h2 className="text-lg font-medium text-gray-800">Audio Studio</h2>
        <button className="text-gray-600 hover:text-[#6a5acd]">
          <Info className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Audio Overview */}
        <div className="mt-4 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Audio Overview</h3>

          {/* Script Status */}
          {finalScript ? (
            <p className="text-sm text-gray-700 mb-4">Podcast script ready for audio generation.</p>
          ) : (
            <p className="text-sm text-gray-700 mb-4">
              No podcast script generated yet. Create content in the Podcast tab first.
            </p>
          )}

          {/* Generate Audio Button */}
          {finalScript && !showPlayer && (
            <button
              onClick={handleGenerateAndPlay}
              disabled={isGenerating}
              className={`w-full py-2 px-4 rounded-md transition-colors ${
                isGenerating
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#6a5acd] hover:bg-[#5849c0] text-white"
              }`}
            >
              {isGenerating ? "Generating Audio..." : "Generate Podcast Audio"}
            </button>
          )}

          {/* Error Message */}
          {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}

          {/* Audio Player */}
          {showPlayer && audioUrl && (
            <div className="mt-4">
              <AudioPlayer audioUrl={audioUrl} />
            </div>
          )}
        </div>

        {/* Additional buttons */}
        <div className="mb-4">
          <button className="w-full flex items-center justify-center py-2 px-4 border border-purple-300 rounded-md text-[#6a5acd] hover:bg-purple-50 transition-colors">
            <Plus className="mr-2 h-4 w-4" /> Add note
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button className="flex items-center justify-center py-3 px-4 border border-purple-300 rounded-md text-[#6a5acd] hover:bg-purple-50 transition-colors">
            <FileText className="mr-2 h-4 w-4" /> Study guide
          </button>
          <button className="flex items-center justify-center py-3 px-4 border border-purple-300 rounded-md text-[#6a5acd] hover:bg-purple-50 transition-colors">
            <FileText className="mr-2 h-4 w-4" /> Briefing doc
          </button>
        </div>
      </div>
    </div>
  )
}
