"use client";

import { useState, useRef } from "react";
import { Info, Send, Mic, MicOff } from "lucide-react";
import AudioPlayer from "./audio-player";
import { useResearchContext } from "@/contexts/research-context";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function StudioPanel() {
  const { researchContent } = useResearchContext();
  const finalScript = researchContent.trim();

  const [audioUrl, setAudioUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPlayer, setShowPlayer] = useState(false);

  // Main audio ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [pauseTime, setPauseTime] = useState(0);

  // For follow-up Q&A
  const [question, setQuestion] = useState("");
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState("");

  // Speech recognition
  const [recording, setRecording] = useState(false);
  const recognition =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
      ? new (window.SpeechRecognition || window.webkitSpeechRecognition)()
      : null;

  if (recognition) {
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;
  }

  // ---- Microphone Handling ----
  const startRecording = () => {
    if (!recognition) return;
    setRecording(true);
    setQuestion("");
    // 1) Immediately pause the main audio
    pauseMainAudioIfPlaying();

    // 2) Start recognition
    recognition.start();
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");
      setQuestion(transcript);
    };
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setRecording(false);
      setQuestionError("Speech recognition error: " + event.error);
    };
    recognition.onend = () => {
      setRecording(false);
    };
  };

  const stopRecording = () => {
    if (!recognition) return;
    recognition.stop();
    setRecording(false);
  };

  // ---- Pause the main audio if it's currently playing ----
  const pauseMainAudioIfPlaying = () => {
    if (audioRef.current) {
      // Store the currentTime, in case we need to resume later
      setPauseTime(audioRef.current.currentTime);
      audioRef.current.pause();
    }
  };

  // ---- Generate & Play Main Podcast Audio ----
  const handleGenerateAndPlay = async () => {
    if (!finalScript) {
      setErrorMsg("No podcast script available. Generate it first in the Podcast tab.");
      return;
    }
    setIsGenerating(true);
    setAudioUrl("");
    setShowPlayer(false);
    setErrorMsg("");

    try {
      const res = await fetch("/api/generateAudio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: finalScript }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error("Audio generation failed: " + errText);
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        throw new Error("Received empty audio from TTS service.");
      }
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setShowPlayer(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // ---- Download main podcast audio ----
  const handleDownloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement("a");
      link.href = audioUrl;
      link.download = "podcast.mp3";
      link.click();
    }
  };

  // ---- Send typed or recognized question to the TTS snippet route ----
  const handleAskQuestion = async () => {
    if (!finalScript || !question.trim()) {
      setQuestionError("Please enter a question and ensure a podcast is playing.");
      return;
    }
    setQuestionError("");
    setIsAskingQuestion(true);

    // Always pause main audio
    pauseMainAudioIfPlaying();

    try {
      // 1) Get GPT short answer
      const answerRes = await fetch("/api/answerQuestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context: finalScript }),
      });
      const { response: hostAnswer } = await answerRes.json();
      if (!hostAnswer) throw new Error("Failed to generate host answer.");

      // 2) TTS for snippet
      const audioRes = await fetch("/api/insertQuestionAudio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostAnswer }),
      });
      if (!audioRes.ok) {
        const errText = await audioRes.text();
        throw new Error("Follow-up audio generation failed: " + errText);
      }
      const snippetBlob = await audioRes.blob();
      if (snippetBlob.size === 0) throw new Error("Received empty follow-up snippet.");

      // 3) Play snippet in background, no second player in UI
      const snippetUrl = URL.createObjectURL(snippetBlob);
      const snippetAudio = new Audio(snippetUrl);
      snippetAudio.onended = () => {
        // Once snippet ends, resume main audio
        if (audioRef.current) {
          audioRef.current.currentTime = pauseTime;
          audioRef.current.play().catch(e => console.error("Resume error:", e));
        }
        setIsAskingQuestion(false);
      };
      snippetAudio.play().catch(e => {
        console.error("Snippet playback error:", e);
        setIsAskingQuestion(false);
      });
    } catch (err: any) {
      console.error("Follow-up error:", err);
      setQuestionError(err.message);
      setIsAskingQuestion(false);
    } finally {
      setQuestion("");
    }
  };

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
        {/* Audio Overview */}
        <div className="mt-4 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Audio Overview</h3>
          {finalScript ? (
            <p className="text-sm text-gray-700 mb-4">
              Podcast script is ready for audio generation.
            </p>
          ) : (
            <p className="text-sm text-gray-700 mb-4">
              No podcast script generated yet. Please create one in the Podcast tab.
            </p>
          )}

          {/* Generate & Play Button */}
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

          {/* Single Audio Player for the main audio */}
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

        {/* Follow-Up Interaction */}
        <div className="mt-6 bg-purple-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Ask a Follow-Up Question</h4>
          <p className="text-sm text-gray-600 mb-3">
            To interrupt the podcast, you can record your question or type it below.
          </p>

          {/* Microphone Record + Text Input Row */}
          <div className="flex items-center space-x-2 mb-3">
            {/* Microphone toggle */}
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`rounded-full p-2 ${
                recording ? "bg-red-500" : "bg-[#6a5acd]"
              } text-white`}
            >
              {recording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* Text input */}
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Your follow-up question..."
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6a5acd]"
              disabled={isAskingQuestion}
            />

            {/* Send button */}
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

          {questionError && <p className="text-red-500 text-sm">{questionError}</p>}
        </div>
      </div>
    </div>
  );
}
