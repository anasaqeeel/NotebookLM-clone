"use client"

import { useState } from "react"
import { Plus, FileText } from "lucide-react"
import PasteTextModal from "@/components/paste-text-modal"

export default function SourcesPanel() {
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false)
  const [sources, setSources] = useState([{ id: "pasted-text", name: "Digital Marketing Strategy", checked: true }])

  const handleAddSource = (text: string) => {
    // In a real implementation, this would process the text and add it as a source
    console.log("Added source:", text)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-purple-100">
        <h2 className="text-lg font-medium text-gray-800">Research Sources</h2>
      </div>
      <div className="p-4">
        <button
          className="w-full flex items-center justify-center py-2 px-4 border border-purple-300 rounded-md text-[#6a5acd] hover:bg-purple-50 transition-colors"
          onClick={() => setIsPasteModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Source
        </button>
      </div>
      <div className="p-4 text-sm">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="select-all"
            className="h-4 w-4 rounded border-gray-300 text-[#6a5acd] focus:ring-[#6a5acd]"
            checked={true}
            onChange={() => {}}
          />
          <label htmlFor="select-all" className="ml-2 text-gray-700">
            Select all sources
          </label>
        </div>
        {sources.map((source) => (
          <div key={source.id} className="flex items-center mb-2">
            <input
              type="checkbox"
              id={source.id}
              className="h-4 w-4 rounded border-gray-300 text-[#6a5acd] focus:ring-[#6a5acd]"
              checked={source.checked}
              onChange={() => {}}
            />
            <label htmlFor={source.id} className="ml-2 flex items-center text-gray-700">
              <FileText className="h-4 w-4 mr-2 text-[#6a5acd]" />
              {source.name}
            </label>
          </div>
        ))}
      </div>

      <PasteTextModal isOpen={isPasteModalOpen} onClose={() => setIsPasteModalOpen(false)} onSubmit={handleAddSource} />
    </div>
  )
}
