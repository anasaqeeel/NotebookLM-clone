"use client"

import { useState } from "react"
import ChatPanel from "@/components/chat-panel"
import StudioPanel from "@/components/studio-panel"
import SourcesPanel from "@/components/sources-panel"
import PodcastGenerator from "@/components/PodcastGenerator"

export default function NotebookInterface() {
  const [activeTab, setActiveTab] = useState<"research" | "sources" | "podcast">("podcast")

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-lg overflow-hidden border border-purple-200">
      <div className="flex border-b border-purple-200">
        <button
          className={`px-4 py-3 font-medium ${activeTab === "podcast" ? "text-[#6a5acd] border-b-2 border-[#6a5acd]" : "text-gray-600"}`}
          onClick={() => setActiveTab("podcast")}
        >
          Podcast
        </button>
        <button
          className={`px-4 py-3 font-medium ${activeTab === "research" ? "text-[#6a5acd] border-b-2 border-[#6a5acd]" : "text-gray-600"}`}
          onClick={() => setActiveTab("research")}
        >
          Research Assistant
        </button>
        <button
          className={`px-4 py-3 font-medium ${activeTab === "sources" ? "text-[#6a5acd] border-b-2 border-[#6a5acd]" : "text-gray-600"}`}
          onClick={() => setActiveTab("sources")}
        >
          Sources
        </button>
      </div>
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-2/3 border-r border-purple-200">
          <div className={activeTab === "research" ? "block" : "hidden"}>
            <ChatPanel />
          </div>
          <div className={activeTab === "sources" ? "block" : "hidden"}>
            <SourcesPanel />
          </div>
          <div className={activeTab === "podcast" ? "block" : "hidden"}>
            <PodcastGenerator />
          </div>
        </div>
        <div className="w-full md:w-1/3">
          {activeTab === "podcast" && <StudioPanel />}
        </div>
      </div>
    </div>
  )
}
