"use client"

import { ChangeEvent, useState } from "react"
import { Loader2 } from "lucide-react"

interface AudioGenerationProps {
  state: "idle" | "generating" | "ready"
  setAudioUrl: (url: string) => void
  setState: (state: "idle" | "generating" | "ready") => void
  onComplete?: (url: string, transcript: string) => void
}

export default function AudioGeneration({
  state,
  setAudioUrl,
  setState,
  onComplete,
}: AudioGenerationProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setSelectedFile(e.target.files[0])
  }
  

  const handleGenerate = async () => {
    if (!selectedFile) {
      setErrorMsg("Please select a PDF first.")
      return
    }
    setErrorMsg("")
    setState("generating")
  
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/generateAudioFromPDF", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text()
        setErrorMsg(`Upload failed: ${errText}`)
        setState("idle")
        return
      }
  
      // Handle audio response (blob)
      const audioBlob = await res.blob(); // Receive as Blob (binary data)
      const audioUrl = URL.createObjectURL(audioBlob); // Create a URL for the audio file

      // Update the audio URL and state
      setAudioUrl(audioUrl);
      setState("ready");

      onComplete?.(audioUrl, ""); // You can pass transcript if available

    } catch (err: any) {
      setErrorMsg(err.message || "Error generating audio.");
      setState("idle");
    }
  }
  

  if (state === "generating") {
    return (
      <div className="bg-purple-50 rounded-lg p-4 mb-4">
        <div className="flex items-center mb-2">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
            <Loader2 className="h-5 w-5 text-[#6a5acd] animate-spin" />
          </div>
          <div>
            <p className="font-medium text-gray-800">Generating conversation...</p>
            <p className="text-sm text-gray-500">Please wait while the audio is created.</p>
          </div>
        </div>
      </div>
    )
  }

  if (state === "idle") {
    return (
      <div className="mb-4">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3"></div>
          <div>
            <p className="font-medium text-gray-800">Deep Dive Conversation</p>
            <p className="text-sm text-gray-500">Upload a PDF to create a two-host podcast</p>
          </div>
        </div>
        <div className="mb-2">
          <input type="file" accept="application/pdf" onChange={handleFileChange} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="py-2 px-4 border border-purple-300 rounded-md text-[#6a5acd] hover:bg-purple-50 transition-colors"
            onClick={() => console.log("Customize (future)")}>
            Customize
          </button>
          <button
            className="py-2 px-4 bg-[#6a5acd] hover:bg-[#5849c0] text-white rounded-md transition-colors"
            onClick={handleGenerate}>
            Generate
          </button>
        </div>
        {errorMsg && <div className="mt-2 text-red-500 text-sm">{errorMsg}</div>}
      </div>
    )
  }

  return null
}
