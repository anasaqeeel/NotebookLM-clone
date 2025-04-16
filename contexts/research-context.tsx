"use client"

import { createContext, useContext, useState } from "react"

interface ResearchContextType {
  researchContent: string
  generateResearch: (query: string) => Promise<string>
  setResearchContent: (content: string) => void
  sources: string[]
  setSources: (sources: string[]) => void
}

const ResearchContext = createContext<ResearchContextType | undefined>(undefined)

export const ResearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [researchContent, setResearchContent] = useState("")
  const [sources, setSources] = useState<string[]>([])

  const generateResearch = async (query: string): Promise<string> => {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) return "Please enter a valid question."

    const combinedContext = sources.length > 0 ? sources.join("\n") : ""
    const prompt = combinedContext
      ? `Based on the following sources:\n${combinedContext}\nAnswer the following: ${trimmedQuery}`
      : trimmedQuery

    try {
      const res = await fetch("/api/generateResearch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: prompt }),
      })

      const data = await res.json()
      const content = data.content || data.error || "No response from GPT"

      setResearchContent(content)
      return content
    } catch (err) {
      console.error("Failed to generate research", err)
      return "An unexpected error occurred."
    }
  }

  return (
    <ResearchContext.Provider value={{ researchContent, generateResearch, setResearchContent, sources, setSources }}>
      {children}
    </ResearchContext.Provider>
  )
}

export const useResearchContext = () => {
  const context = useContext(ResearchContext)
  if (!context) throw new Error("useResearchContext must be used within a ResearchProvider")
  return context
}
