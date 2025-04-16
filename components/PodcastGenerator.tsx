// components/PodcastGenerator.tsx
"use client"

import { useState } from "react"
import { useResearchContext } from "@/contexts/research-context"

export default function PodcastGenerator() {
  const { setResearchContent } = useResearchContext()
  const [industry, setIndustry] = useState("")
  const [prospectName, setProspectName] = useState("")
  const [question, setQuestion] = useState("")
  const [status, setStatus] = useState("idle")
  const [error, setError] = useState("")

  const handleGenerateScript = async () => {
    if (!industry.trim()) {
      setError("Industry is required.")
      return
    }
    setError("")
    setStatus("generating")

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
      // Store generated script in context (but do not show on screen)
      setResearchContent(data.script)
      setStatus("done")
    } catch (err: any) {
      setError(err.message || "Error generating script.")
      setStatus("idle")
    }
  }

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Podcast Generator</h2>
        <p className="text-gray-600 mb-4">Enter your custom text to create a professional podcast script. The generated script will be used for audio synthesis but will not be displayed.</p>
      </div>

      <div className="space-y-4 bg-purple-50 p-6 rounded-lg">
        <div>
          <label className="block font-medium text-gray-700 mb-1">Industry *</label>
          <input
            className="w-full p-3 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6a5acd]"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g. Digital Marketing"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Prospect Name</label>
          <input
            className="w-full p-3 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6a5acd]"
            value={prospectName}
            onChange={(e) => setProspectName(e.target.value)}
            placeholder="e.g. John Doe"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Additional Question</label>
          <input
            className="w-full p-3 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6a5acd]"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Optional question to incorporate"
          />
        </div>

        <button
          onClick={handleGenerateScript}
          disabled={status === "generating"}
          className={`w-full py-3 px-4 rounded-md transition-colors ${
            status === "generating"
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-[#6a5acd] hover:bg-[#5849c0] text-white"
          }`}
        >
          {status === "generating" ? "Generating Script..." : "Generate Script"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      {/* Note: The generated script is stored in context and not displayed on screen */}
    </div>
  )
}
