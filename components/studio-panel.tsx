"use client"

import { useState, useEffect } from "react"
import { Info } from "lucide-react"
import { useResearchContext } from "@/contexts/research-context"

export default function StudioPanel() {
  const [audioState, setAudioState] = useState<"idle" | "speaking" | "paused">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [followUp, setFollowUp] = useState("")
  const { researchContent, generateResearch } = useResearchContext()
  const finalContent = researchContent.trim()

  useEffect(() => {
    window.speechSynthesis.getVoices()
    console.log("Current researchContent:", researchContent)
  }, [researchContent])

  const handleSpeak = () => {
    if (!finalContent) {
      setErrorMsg("No GPT research text to speak.")
      return
    }
    setErrorMsg("")
    setAudioState("speaking")
    const synth = window.speechSynthesis
    synth.cancel()
    const utter = new SpeechSynthesisUtterance(finalContent)
    utter.onend = () => setAudioState("idle")
    synth.speak(utter)
  }

  const handlePause = () => {
    window.speechSynthesis.pause()
    setAudioState("paused")
  }

  const handleResume = () => {
    window.speechSynthesis.resume()
    setAudioState("speaking")
  }

  const handleSubmitFollowUp = async () => {
    if (!followUp.trim()) return
    try {
      await generateResearch(followUp.trim())
      setFollowUp("")
      handleSpeak()
    } catch (error: any) {
      console.error("Error generating follow-up:", error)
      setErrorMsg("Failed to update with follow-up question.")
    }
  }

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
          {finalContent ? (
            <div className="bg-purple-50 p-3 rounded-md mb-4">
              <h4 className="font-medium text-gray-800 mb-1">GPT Research Summary</h4>
              <p className="text-sm text-gray-700 line-clamp-3">{finalContent}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-700">No research content generated yet.</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {audioState === "speaking" && (
            <button onClick={handlePause} className="bg-yellow-500 text-white px-4 py-2 rounded">
              Pause
            </button>
          )}
          {audioState === "paused" && (
            <button onClick={handleResume} className="bg-green-500 text-white px-4 py-2 rounded">
              Resume
            </button>
          )}
          {audioState === "idle" && (
            <button onClick={handleSpeak} className="bg-[#6a5acd] text-white px-4 py-2 rounded">
              Speak
            </button>
          )}
        </div>
        {audioState === "paused" && (
          <div className="mt-4">
            <input
              type="text"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder="Ask a follow-up question..."
              className="border p-2 rounded w-full mb-2"
            />
            <button onClick={handleSubmitFollowUp} className="bg-blue-600 text-white px-4 py-2 rounded">
              Submit Question
            </button>
          </div>
        )}
        {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}
      </div>
    </div>
  )
}
