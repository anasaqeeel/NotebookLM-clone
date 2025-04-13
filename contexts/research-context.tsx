// contexts/research-context.tsx
"use client"

import { createContext, useContext, useState } from "react";

interface ResearchContextType {
  researchContent: string;
  setResearchContent: (content: string) => void;
  generateResearch: (topic: string) => Promise<void>;
  isLoading: boolean;
}

const ResearchContext = createContext<ResearchContextType>({
  researchContent: "",
  setResearchContent: () => {},
  generateResearch: async () => {},
  isLoading: false,
});

export function ResearchProvider({ children }: { children: React.ReactNode }) {
  const [researchContent, setResearchContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateResearch = async (topic: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/generateResearch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic }),
      });
      const data = await response.json();
      if (data.content) {
        setResearchContent(data.content);
      }
    } catch (error) {
      console.error("Error generating research:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResearchContext.Provider
      value={{
        researchContent,
        setResearchContent,
        generateResearch,
        isLoading,
      }}
    >
      {children}
    </ResearchContext.Provider>
  );
}

export const useResearchContext = () => useContext(ResearchContext);