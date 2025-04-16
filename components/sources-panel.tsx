// components/SourcesPanel.tsx
"use client"

import { useState, useEffect } from "react"
import { Plus, FileText } from "lucide-react"
import PasteTextModal from "@/components/paste-text-modal"
import { useResearchContext } from "@/contexts/research-context"

interface Source {
  id: string
  name: string
  checked: boolean
}

export default function SourcesPanel() {
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false)
  const [localSources, setLocalSources] = useState<Source[]>([])
  const { setSources } = useResearchContext()

  useEffect(() => {
    // Update the global sources with the names from the local sources array
    setSources(localSources.map(source => source.name))
  }, [localSources, setSources])

  const handleAddSource = (text: string) => {
    const newSource: Source = {
      id: Date.now().toString(),
      name: text,
      checked: true,
    }
    setLocalSources(prev => [...prev, newSource])
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
        {localSources.length === 0 ? (
          <p className="text-gray-700">No sources added yet.</p>
        ) : (
          localSources.map((source) => (
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
          ))
        )}
      </div>
      <PasteTextModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        onSubmit={handleAddSource}
      />
    </div>
  )
}
