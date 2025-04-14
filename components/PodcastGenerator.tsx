"use client"

import { useState } from "react"

export default function PodcastGenerator() {
  const [industry, setIndustry] = useState("")
  const [prospectName, setProspectName] = useState("")
  const [question, setQuestion] = useState("")
  const [script, setScript] = useState("")
  const [status, setStatus] = useState("idle")
  const [error, setError] = useState("")

  const handleGenerateScript = async () => {
    if (!industry.trim()) {
      setError("Industry is required.")
      return
    }
    setError("")
    setStatus("generating")
    setScript("")

    try {
      const res = await fetch("/api/generatePodcastScript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, prospectName, question }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to generate script.")
        setStatus("idle")
        return
      }
      setScript(data.script)
      setStatus("done")
    } catch (err: any) {
      setError(err.message || "Error generating script.")
      setStatus("idle")
    }
  }

  // For this phase, audio generation is optional; we provide a Play button if you have a backend route
  const handleGenerateAudio = async () => {
    if (!script.trim()) return
    try {
      const res = await fetch("/api/generateAudio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      })
      if (!res.ok) {
        const errText = await res.text()
        setError("Audio generation failed: " + errText)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.play()
    } catch (error) {
      console.error("Error playing audio:", error)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Podcast Generator (NotebookLM Style)</h2>
      <div>
        <label className="block font-medium">Industry</label>
        <input
          className="border p-2 w-full rounded"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g. Digital Marketing"
        />
      </div>
      <div>
        <label className="block font-medium">Prospect Name</label>
        <input
          className="border p-2 w-full rounded"
          value={prospectName}
          onChange={(e) => setProspectName(e.target.value)}
          placeholder="e.g. John Doe"
        />
      </div>
      <div>
        <label className="block font-medium">Any Extra Question?</label>
        <input
          className="border p-2 w-full rounded"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Optional question to incorporate"
        />
      </div>
      <button
        onClick={handleGenerateScript}
        className="bg-purple-600 text-white px-4 py-2 rounded"
      >
        Generate Script
      </button>
      {status === "generating" && <p>Generating script...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {script && (
        <div className="mt-4 bg-gray-100 p-3 rounded">
          <h3 className="font-bold mb-2">Generated Podcast Script</h3>
          <pre className="whitespace-pre-wrap">{script}</pre>
          <button
            onClick={handleGenerateAudio}
            className="bg-blue-600 text-white mt-2 px-4 py-2 rounded"
          >
            Play Podcast Audio
          </button>
        </div>
      )}
    </div>
  )
}
