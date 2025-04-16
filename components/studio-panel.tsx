// components/StudioPanel.tsx
"use client"

import { useState, useRef } from "react"
import { Info, Send } from "lucide-react"
import AudioPlayer from "./audio-player"
import { useResearchContext } from "@/contexts/research-context"

export default function StudioPanel() {
  const { researchContent } = useResearchContext()
  const finalScript = researchContent.trim()

  const [audioUrl, setAudioUrl] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [showPlayer, setShowPlayer] = useState(false)

  // Follow-up Q&A state
  const [question, setQuestion] = useState("")
  const [isAskingQuestion, setIsAskingQuestion] = useState(false)
  const [questionAudioUrl, setQuestionAudioUrl] = useState("")
  const [questionError, setQuestionError] = useState("")
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [pauseTime, setPauseTime] = useState(0)

  const handleGenerateAndPlay = async () => {
    if (!finalScript) {
      setErrorMsg("No podcast script available. Generate it first in the Podcast tab.")
      return
    }
    setIsGenerating(true)
    setAudioUrl("")
    setShowPlayer(false)
    setErrorMsg("")

    try {
      const res = await fetch("/api/generateAudio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: finalScript }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error("Audio generation failed: " + errorText)
      }

      const blob = await res.blob()
      if (blob.size === 0) {
        throw new Error("Received empty audio from TTS service.")
      }
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      setShowPlayer(true)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  // Download audio function
  const handleDownloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement("a")
      link.href = audioUrl
      link.download = "podcast.mp3"
      link.click()
    }
  }

  // Follow-up question handling
  const handleAskQuestion = async () => {
    if (!finalScript || !question.trim()) {
      setQuestionError("Please enter a question and ensure a podcast is loaded.")
      return
    }
    setQuestionError("")
    setIsAskingQuestion(true)

    // Pause main audio and record current time
    if (audioRef.current) {
      setPauseTime(audioRef.current.currentTime)
      audioRef.current.pause()
    }

    try {
      const answerRes = await fetch("/api/answerQuestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          context: finalScript,
        }),
      })
      const { response: hostAnswer } = await answerRes.json()
      if (!hostAnswer) throw new Error("Failed to generate answer")

      const audioRes = await fetch("/api/insertQuestionAudio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: finalScript,
          hostAnswer,
        }),
      })

      if (!audioRes.ok) {
        const errText = await audioRes.text()
        throw new Error("Follow-up audio generation failed: " + errText)
      }

      const blob = await audioRes.blob()
      if (blob.size === 0) {
        throw new Error("Received empty follow-up audio.")
      }
      const snippetUrl = URL.createObjectURL(blob)

      // Play the follow-up snippet; then resume main audio
      const snippetAudio = new Audio(snippetUrl)
      snippetAudio.play().then(() => {
        snippetAudio.onended = () => {
          if (audioRef.current) {
            audioRef.current.currentTime = pauseTime
            audioRef.current.play()
          }
          setIsAskingQuestion(false)
        }
      })
    } catch (err: any) {
      setQuestionError(err.message)
      setIsAskingQuestion(false)
    } finally {
      setQuestion("")
    }
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="border-b border-purple-100 flex items-center justify-between pb-4">
        <h2 className="text-lg font-medium text-gray-800">Audio Studio</h2>
        <button className="text-gray-600 hover:text-[#6a5acd]">
          <Info className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mt-4 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Audio Overview</h3>
          <p className="text-sm text-gray-700 mb-4">
            {finalScript
              ? "Podcast script ready for audio generation."
              : "No podcast script generated yet. Please create one in the Podcast tab."}
          </p>

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
              {isGenerating ? "Generating Audio..." : "Generate & Play Podcast"}
            </button>
          )}
          {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}
          {showPlayer && audioUrl && (
            <div className="mt-4 space-y-4">
              <AudioPlayer ref={audioRef} audioUrl={audioUrl} />
              <button
                onClick={handleDownloadAudio}
                className="w-full py-2 px-4 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Download Podcast Audio
              </button>
            </div>
          )}
        </div>

        {/* Follow-Up Interactive Section */}
        <div className="mt-6 bg-purple-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Ask a Follow-Up Question</h4>
          <p className="text-sm text-gray-600 mb-3">
            To interrupt the podcast and ask a question, please pause the audio first.
          </p>
          <div className="relative">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question here..."
              className="w-full p-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6a5acd]"
              disabled={isAskingQuestion}
            />
            <button
              onClick={handleAskQuestion}
              disabled={!question.trim() || isAskingQuestion}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 rounded-r-md px-4 py-2 text-white ${
                !question.trim() || isAskingQuestion
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          {questionError && (
            <p className="text-red-500 text-sm mt-2">{questionError}</p>
          )}
          {questionAudioUrl && (
            <div className="mt-4">
              <p className="text-sm text-gray-700 mb-1">Follow-Up Answer Audio:</p>
              <AudioPlayer audioUrl={questionAudioUrl} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
