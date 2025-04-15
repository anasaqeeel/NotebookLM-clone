"use client"

import { useState, useRef } from "react"
import { Info, FileText, Plus, Send } from "lucide-react"
import AudioPlayer from "./audio-player"
import { useResearchContext } from "@/contexts/research-context"

export default function StudioPanel() {
  const { researchContent } = useResearchContext()
  const finalScript = researchContent?.trim() || "" // Our generated podcast script from GPT

  const [audioUrl, setAudioUrl] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [showPlayer, setShowPlayer] = useState(false)

  // For interactive questions
  const [question, setQuestion] = useState("")
  const [isAskingQuestion, setIsAskingQuestion] = useState(false)
  const [questionResponse, setQuestionResponse] = useState("")
  const [questionError, setQuestionError] = useState("")
  const audioRef = useRef<HTMLAudioElement | null>(null)

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
    setQuestionResponse("") // Clear any previous responses

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

  // Handle asking a question during the podcast
  const handleAskQuestion = async () => {
    if (!question.trim()) return;
  
    // Clear state
    setQuestionError("");
    setQuestionResponse("");
    setIsAskingQuestion(true);
  
    if (audioRef.current) {
      audioRef.current.pause();
    }
  
    try {
      // Step 1: Get response from API
      const res = await fetch("/api/answerQuestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context: finalScript }),
      });
  
      if (!res.ok) throw new Error("Failed to get response");
  
      const data = await res.json();
      const hostResponse = data.response; // this should include "Host A: ..." etc.
  
      setQuestionResponse(hostResponse);
  
      // Step 2: Append host response to original script
      const extendedScript = `${finalScript}\n\n${hostResponse}`;
  
      // Step 3: Re-generate audio for full updated script
      const audioRes = await fetch("/api/generateAudio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: extendedScript }),
      });
  
      if (!audioRes.ok) throw new Error("Failed to generate updated audio");
  
      const blob = await audioRes.blob();
      const url = URL.createObjectURL(blob);
  
      // Step 4: Update audio state
      setAudioUrl(url);
      setShowPlayer(true);
  
      // Step 5: Play new audio
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load(); // refresh audio
          audioRef.current.play().catch((err) => console.error("Playback error:", err));
        }
      }, 100);
    } catch (error) {
      console.error("Error handling question:", error);
      setQuestionError("Something went wrong. Please try again.");
      if (audioRef.current) {
        audioRef.current.play().catch((err) => console.error("Error resuming:", err));
      }
    } finally {
      setIsAskingQuestion(false);
      setQuestion(""); // Clear input
    }
  };
  

  // Fallback function to generate host responses directly in the frontend
  // This is used if the API route isn't working
  const generateHostResponse = async (userQuestion: string, context: string) => {
    try {
      // Try to use the API route first
      const res = await fetch("/api/answerQuestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userQuestion,
          context: context,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        return data.response
      }

      // If API route fails, generate a simple fallback response
      throw new Error("API route failed")
    } catch (error) {
      console.error("API route error:", error)

      // Simple fallback response format
      return `Host A: That's a great question about "${userQuestion}"! Based on our discussion, I think the key point is that digital marketing strategies need to be tailored to each business's unique needs.

Host B: And to address your specific question, I'd recommend focusing on data-driven approaches and staying updated with the latest trends in your industry.`
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
              <AudioPlayer audioUrl={audioUrl} audioRef={audioRef} />

              {/* Interactive Question Input */}
              <div className="mt-6 bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Ask a Question</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Ask any question and the podcast hosts will respond to you.
                </p>

                <div className="relative">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Type your question here..."
                    className="w-full p-3 pr-12 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6a5acd]"
                    disabled={isAskingQuestion}
                  />
                  <button
                    onClick={handleAskQuestion}
                    disabled={!question.trim() || isAskingQuestion}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full h-8 w-8 flex items-center justify-center ${
                      !question.trim() || isAskingQuestion
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-[#6a5acd] text-white hover:bg-[#5849c0]"
                    }`}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>

                {isAskingQuestion && <p className="text-sm text-purple-600 mt-2">Getting response from hosts...</p>}
                {questionError && <p className="text-sm text-red-500 mt-2">{questionError}</p>}

                {questionResponse && (
                  <div className="mt-3 bg-white p-3 rounded-md border border-purple-200">
                    <p className="text-sm font-medium mb-1">Hosts' Response:</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{questionResponse}</p>
                  </div>
                )}
              </div>
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
