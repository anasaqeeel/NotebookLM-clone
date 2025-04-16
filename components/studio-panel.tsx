// components/StudioPanel.tsx
"use client"

import { useState, useRef } from "react"
import { Info, Send, Mic, MicOff } from "lucide-react"

import AudioPlayer from "./audio-player"
import { useResearchContext } from "@/contexts/research-context"

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

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
  const [questionError, setQuestionError] = useState("")
  const [recording, setRecording] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [pauseTime, setPauseTime] = useState(0)

  // --- Microphone Speech Recognition Setup ---
  const recognition =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
      ? new (window.SpeechRecognition || window.webkitSpeechRecognition)()
      : null

  if (recognition) {
    recognition.continuous = false
    recognition.lang = "en-US"
    recognition.interimResults = false
  }

  const startRecording = () => {
    if (!recognition) return
    setRecording(true)
    setQuestion("")
    recognition.start()
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("")
      setQuestion(transcript)
    }
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error)
      setRecording(false)
      setQuestionError("Speech recognition error: " + event.error)
    }
    recognition.onend = () => {
      setRecording(false)
    }
  }

  // --- Generate and Play Main Podcast Audio ---
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

  // --- Download Audio ---
  const handleDownloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement("a")
      link.href = audioUrl
      link.download = "podcast.mp3"
      link.click()
    }
  }

  // --- Handle Follow-Up Question via Microphone or Text ---
  const handleAskQuestion = async () => {
    if (!finalScript || !question.trim()) {
      setQuestionError("Please enter a question and ensure a podcast is playing.")
      return
    }
    setQuestionError("")
    setIsAskingQuestion(true)

    // Pause the main audio and save its current time
    if (audioRef.current) {
      setPauseTime(audioRef.current.currentTime)
      audioRef.current.pause()
    }

    try {
      // Get GPT-generated answer using the question and context
      const answerRes = await fetch("/api/answerQuestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          context: finalScript,
        }),
      })

      const { response: hostAnswer } = await answerRes.json()
      if (!hostAnswer) throw new Error("Failed to generate host answer.")

      // Generate follow-up audio snippet using the provided answer
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
      if (blob.size === 0) throw new Error("Received empty follow-up audio.")
      const snippetUrl = URL.createObjectURL(blob)

      // Play the follow-up audio snippet and then resume main audio
      const snippetAudio = new Audio(snippetUrl)
      snippetAudio.onended = () => {
        if (audioRef.current) {
          audioRef.current.currentTime = pauseTime
          audioRef.current.play().catch((err) => console.error("Resume error:", err))
        }
        setIsAskingQuestion(false)
      }
      snippetAudio.play().catch((err) => {
        console.error("Error playing follow-up snippet:", err)
        setIsAskingQuestion(false)
      })
    } catch (err: any) {
      console.error("Follow-up audio error:", err)
      setQuestionError(err.message)
      setIsAskingQuestion(false)
    } finally {
      setQuestion("")
    }
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="border-b border-purple-100 flex items-center justify-between pb-4">
        <h2 className="text-lg font-medium text-gray-800">Audio Studio</h2>
        <button className="text-gray-600 hover:text-[#6a5acd]">
          <Info className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Audio Overview Section */}
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
            To interrupt the podcast, simply tap the record button below and speak your question.
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={recording ? () => recognition?.stop() : startRecording}
              className={`rounded-full p-2 ${
                recording ? "bg-red-500" : "bg-[#6a5acd]"
              } text-white`}
            >
              {recording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Your follow-up question..."
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6a5acd]"
              disabled={isAskingQuestion}
            />
            <button
              onClick={handleAskQuestion}
              disabled={!question.trim() || isAskingQuestion}
              className={`rounded-md px-4 py-2 text-white ${
                !question.trim() || isAskingQuestion
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <Send size={20} />
            </button>
          </div>
          {questionError && <p className="text-red-500 text-sm mt-2">{questionError}</p>}
        </div>
      </div>
    </div>
  )
}
