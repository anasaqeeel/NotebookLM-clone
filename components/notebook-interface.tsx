// components/NotebookInterface.tsx
"use client"

import ChatPanel from "@/components/chat-panel"
import StudioPanel from "@/components/studio-panel"

export default function NotebookInterface() {
  return (
    <div className="flex flex-col bg-white rounded-xl shadow-lg overflow-hidden border border-purple-200">
      <div className="flex flex-col md:flex-row">
        {/* Left Column (Research Panel) */}
        <div className="w-full md:w-2/3 border-r border-purple-200">
          <ChatPanel />
        </div>
        {/* Right Column (Audio Studio) */}
        <div className="w-full md:w-1/3">
          <StudioPanel />
        </div>
      </div>
    </div>
  )
}
