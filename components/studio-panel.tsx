// components/StudioPanel.tsx
"use client";

import { useState, useRef } from "react";
import { Info, Send, Mic, MicOff, Pause } from "lucide-react";
import AudioPlayer from "./audio-player";
import { useResearchContext } from "@/contexts/research-context";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}


// Fix TS missing types
type SpeechRecognitionEvent = Event & {
  readonly results: SpeechRecognitionResultList;
};


export default function StudioPanel() {
  const { researchContent } = useResearchContext();
  const finalScript = researchContent.trim();

  // Main podcast
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [showPlayer, setShowPlayer] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [pauseTime, setPauseTime] = useState(0);

  // Follow‑up Q&A
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [questionError, setQuestionError] = useState("");

  // snippet audio
  const snippetRef = useRef<HTMLAudioElement | null>(null);
  const [snippetPlaying, setSnippetPlaying] = useState(false);

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

  const pauseMain = () => {
    const a = audioRef.current;
    if (a) {
      setPauseTime(a.currentTime);
      a.pause();
    }
  };

  // Generate & play main podcast
  const handleGenerate = async () => {
    if (!finalScript) return setErrorMsg("Generate a script first.");
    setIsGenerating(true);
    setShowPlayer(false);
    setErrorMsg("");
    try {
      const res = await fetch("/api/generateAudio", {
        method: "POST",
        body: JSON.stringify({ script: finalScript }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setShowPlayer(true);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Record by mic
  const startRec = () => {
    if (!recognition) return;
    pauseMain();
    setRecording(true);
    setQuestion("");
    recognition.start();
    recognition.onresult = (ev: SpeechRecognitionEvent) => {
      const results = Array.from(ev.results as SpeechRecognitionResultList);
      const txt = results.map(result => result[0].transcript).join("");
      setQuestion(txt);
    };
    
    
    recognition.onerror = (ev:any) => {
      setRecording(false);
      setQuestionError("Recognition error: " + ev.error);
    };
    recognition.onend = () => setRecording(false);
  };

  const stopRec = () => {
    recognition?.stop();
    setRecording(false);
  };

  // Ask question
  const handleAsk = async () => {
    if (!question.trim()) return setQuestionError("Type or record a question.");
    setQuestionError("");
    setIsAsking(true);
    pauseMain();

    try {
      // 1) GPT answer
      const ansRes = await fetch("/api/answerQuestion", {
        method: "POST",
        body: JSON.stringify({ question, context: finalScript }),
        headers: { "Content-Type": "application/json" },
      });
      const { response: hostAnswer } = await ansRes.json();
      if (!hostAnswer) throw new Error("No answer");

      // 2) get merged snippet
      const ttsRes = await fetch("/api/insertQuestionAudio", {
        method: "POST",
        body: JSON.stringify({ hostAnswer }),
        headers: { "Content-Type": "application/json" },
      });
      if (!ttsRes.ok) throw new Error(await ttsRes.text());
      const blob = await ttsRes.blob();
      const url = URL.createObjectURL(blob);

      // 3) play snippet
      const sn = new Audio(url);
      snippetRef.current = sn;
      sn.onplay = () => setSnippetPlaying(true);
      sn.onended = () => {
        setSnippetPlaying(false);
        // resume main
        if (audioRef.current) {
          audioRef.current.currentTime = pauseTime;
          audioRef.current.play().catch(() => {});
        }
        setIsAsking(false);
      };
      sn.play().catch(e => { throw e; });
    } catch (e: any) {
      setQuestionError(e.message);
      setIsAsking(false);
    } finally {
      setQuestion("");
    }
  };

  // Pause snippet & resume main
  const handlePauseSnippet = () => {
    snippetRef.current?.pause();
    setSnippetPlaying(false);
    // resume main
    if (audioRef.current) {
      audioRef.current.currentTime = pauseTime;
      audioRef.current.play().catch(() => {});
    }
    setIsAsking(false);
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="border-b pb-4 flex justify-between">
        <h2 className="text-lg font-medium">Audio Studio</h2>
        <Info className="text-gray-600 hover:text-purple-700 cursor-pointer" />
      </div>

      <div className="flex-1 overflow-auto space-y-6">
        {/* Generate / Play */}
        <div>
          <h3 className="font-medium mb-2">Audio Overview</h3>
          <p className="text-sm mb-4">
            {finalScript
              ? "Podcast script is ready."
              : "No script yet; generate in the Podcast tab."}
          </p>

          {finalScript && !showPlayer && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-2 rounded ${
                isGenerating
                  ? "bg-gray-300 text-gray-500"
                  : "bg-purple-600 text-white hover:bg-purple-700"
              }`}
            >
              {isGenerating ? "Generating…" : "Generate & Play Podcast"}
            </button>
          )}
          {errorMsg && <p className="text-red-500 mt-2">{errorMsg}</p>}

          {showPlayer && (
  <>
    <AudioPlayer ref={audioRef} audioUrl={audioUrl} />
    <button
      onClick={() => {
        const a = audioRef.current;
        if (a) {
          const link = document.createElement("a");
          link.href = a.src;
          link.download = "podcast.mp3";
          link.click();
        }
      }}
      className="w-full mt-2 py-2 bg-green-600 text-white rounded hover:bg-green-700"
    >
      Download Podcast
    </button>

    {/* Test note message */}
    <p className="text-xs text-gray-500 mt-1 text-center">
      This is for <span className="italic">testing purposes</span> only and is limited to <strong>under 1 minute</strong>. Longer podcasts can be created for actual clients.
    </p>
  </>
)}

        </div>

        {/* Follow‑up Q&A */}
        <div className="bg-purple-50 p-4 rounded">
          <h4 className="font-medium mb-2">Ask a Follow‑Up Question</h4>
          <p className="text-sm mb-3">
            Tap the mic to speak, or type your question, then Send.
          </p>

          {/* Record / Type / Send */}
          <div className="flex items-center space-x-2 mb-3">
            <button
              onClick={recording ? stopRec : startRec}
              className={`p-2 rounded-full ${
                recording ? "bg-red-500" : "bg-purple-600"
              } text-white`}
            >
              {recording ? <MicOff /> : <Mic />}
            </button>
            <input
              className="flex-1 p-2 border rounded focus:ring-2 focus:ring-purple-600"
              placeholder="Your question…"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              disabled={isAsking}
            />
            <button
              onClick={handleAsk}
              disabled={!question.trim() || isAsking}
              className={`px-4 py-2 rounded text-white ${
                !question.trim() || isAsking
                  ? "bg-gray-300 text-gray-500"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <Send />
            </button>
          </div>
          {questionError && <p className="text-red-500">{questionError}</p>}

          {/* Pause‑Snippet Button */}
          {snippetPlaying && (
            <button
              onClick={handlePauseSnippet}
              className="mt-2 flex items-center space-x-1 text-purple-700 hover:text-purple-900"
            >
              <Pause /> <span>Pause Snippet</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
