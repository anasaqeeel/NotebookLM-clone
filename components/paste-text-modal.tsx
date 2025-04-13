"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"

interface PasteTextModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (text: string) => void
}

export default function PasteTextModal({ isOpen, onClose, onSubmit }: PasteTextModalProps) {
  const [text, setText] = useState("")

  const handleSubmit = () => {
    onSubmit(text)
    setText("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <button onClick={onClose} className="mr-2 p-1 rounded-full hover:bg-gray-100 text-gray-600">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-medium">Paste copied text</h2>
          </div>
        </div>

        <div className="p-4">
          <p className="text-sm mb-4 text-gray-700">Paste your copied text below to upload as a source</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text here*"
            className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6a5acd] focus:border-transparent"
          />
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className={`px-4 py-2 rounded-md ${
              text.trim()
                ? "bg-[#6a5acd] hover:bg-[#5849c0] text-white"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  )
}
