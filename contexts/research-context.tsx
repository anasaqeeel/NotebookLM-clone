"use client"

import { createContext, useContext, useState } from "react"

interface ResearchContextType {
  researchContent: string
  generateResearch: (query: string) => Promise<string>
  setResearchContent: (content: string) => void
}

const ResearchContext = createContext<ResearchContextType | undefined>(undefined)

export const ResearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [researchContent, setResearchContent] = useState("")

  const generateResearch = async (query: string): Promise<string> => {
    try {
      const res = await fetch("/api/generateResearch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: query }),
      })
      const data = await res.json()
      const content = data.content || ""
      setResearchContent(content)
      return content
    } catch (err) {
      console.error("Failed to generate research", err)
      return ""
    }
  }

  return (
    <ResearchContext.Provider value={{ researchContent, generateResearch, setResearchContent }}>
      {children}
    </ResearchContext.Provider>
  )
}

export const useResearchContext = () => {
  const context = useContext(ResearchContext)
  if (!context) throw new Error("useResearchContext must be used within a ResearchProvider")
  return context
}
