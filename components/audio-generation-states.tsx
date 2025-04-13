// components/AudioGeneration.tsx
"use client"

import { Loader2 } from "lucide-react"

interface AudioGenerationProps {
  state: "idle" | "generating" | "ready"
  setAudioUrl: (url: string) => void
  setState: (state: "idle" | "generating" | "ready") => void
}

export default function AudioGeneration({
  state,
  setAudioUrl,
  setState,
}: AudioGenerationProps) {
  const handleGenerate = async () => {
    setState("generating");
    try {
      // Send the sample text – in a dynamic scenario, this will be based on your input.
      const res = await fetch("/api/generateDynamicPodcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Digital marketing trends for 2025 with prospect [ClientName]" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioUrl) {
          setAudioUrl(data.audioUrl);
          setState("ready");
        } else {
          console.error("Audio generation incomplete:", data.message);
          setState("idle");
        }
      } else {
        console.error("Audio generation failed");
        setState("idle");
      }
    } catch (error) {
      console.error("Error generating audio:", error);
      setState("idle");
    }
  };

  if (state === "generating") {
    return (
      <div className="bg-purple-50 rounded-lg p-4 mb-4">
        <div className="flex items-center mb-2">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
            <Loader2 className="h-5 w-5 text-[#6a5acd] animate-spin" />
          </div>
          <div>
            <p className="font-medium text-gray-800">Generating conversation...</p>
            <p className="text-sm text-gray-500">Please wait while the audio is being created.</p>
          </div>
        </div>
      </div>
    );
  }

  if (state === "idle") {
    return (
      <div className="mb-4">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
            {/* Optional icon */}
          </div>
          <div>
            <p className="font-medium text-gray-800">Deep Dive Conversation</p>
            <p className="text-sm text-gray-500">Two hosts (English only)</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="py-2 px-4 border border-purple-300 rounded-md text-[#6a5acd] hover:bg-purple-50 transition-colors"
            onClick={() => console.log("Customize options (Phase 2)")}
          >
            Customize
          </button>
          <button
            className="py-2 px-4 bg-[#6a5acd] hover:bg-[#5849c0] text-white rounded-md transition-colors"
            onClick={handleGenerate}
          >
            Generate
          </button>
        </div>
      </div>
    );
  }

  return null;
}
