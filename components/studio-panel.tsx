"use client"

import { useState, useEffect } from "react"
import { Info } from "lucide-react"
import AudioPlayer from "./audio-player"
import { useResearchContext } from "@/contexts/research-context"

export default function StudioPanel() {
  const { researchContent } = useResearchContext()
  const finalScript = researchContent.trim()  // Our generated podcast script from GPT

  const [audioUrl, setAudioUrl] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    console.log("Current podcast script:", finalScript)
  }, [finalScript])

  // This function calls your /api/generateAudio endpoint to get an MP3 blob.
  const handleGenerateAndPlay = async () => {
    if (!finalScript) {
      setErrorMsg("No podcast script available.")
      return
    }
    setErrorMsg("")
    setIsGenerating(true)
    setAudioUrl("") // Clear old audio

    try {
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

      {/* Script Status */}
      <div className="mt-4">
        {finalScript ? (
          <p className="text-sm text-gray-700 mb-4">Podcast script ready.</p>
        ) : (
          <p className="text-sm text-gray-700 mb-4">No podcast script generated yet.</p>
        )}
      </div>

      {/* Single Button: Generate & Play Podcast Audio */}
      {!audioUrl && (
        <button
          onClick={handleGenerateAndPlay}
          disabled={!finalScript || isGenerating}
          className="w-full bg-[#6a5acd] hover:bg-[#5849c0] text-white px-4 py-2 rounded"
        >
          {isGenerating ? "Generating Audio..." : "Generate & Play Podcast"}
        </button>
      )}

      {/* Render the full MP3 player UI when audioUrl is available */}
      {audioUrl && (
        <div className="mt-4">
          <AudioPlayer audioUrl={audioUrl} />
        </div>
      )}

      {errorMsg && (
        <p className="text-red-500 text-sm mt-2">{errorMsg}</p>
      )}
    </div>
  )
}
