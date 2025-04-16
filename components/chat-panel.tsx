// components/ChatPanel.tsx
"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { useResearchContext } from "@/contexts/research-context"

interface Message {
  role: "user" | "assistant"
  text: string
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hello! Enter your research question below and I'll respond!",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { generateResearch } = useResearchContext()

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = { role: "user", text: inputValue.trim() }
    setMessages((prev) => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue("")
    setIsLoading(true)

    try {
      const generatedContent = await generateResearch(currentInput.trim())
      const assistantMessage: Message = {
        role: "assistant",
        text: generatedContent || "No response from GPT",
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      const assistantMessage: Message = {
        role: "assistant",
        text: "Error calling GPT: " + error.message,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-purple-100">
        <h2 className="text-lg font-medium text-gray-800">AI Research Assistant</h2>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-md ${
              msg.role === "assistant"
                ? "bg-purple-50 text-gray-800"
                : "bg-[#6a5acd] text-white self-end"
            }`}
          >
            {msg.text}
          </div>
        ))}

        {isLoading && (
          <div className="p-3 rounded-lg bg-purple-50 text-gray-800 max-w-md">
            <em>Generating response...</em>
          </div>
        )}
      </div>

      {/* Input & Send Button */}
      <div className="p-4 border-t border-purple-100 flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend() }}
          placeholder="Enter your research question..."
          className="flex-1 p-4 pr-16 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6a5acd] focus:border-transparent"
        />
        <button
          onClick={handleSend}
          className="ml-2 rounded-full h-10 w-10 flex items-center justify-center bg-[#6a5acd] text-white hover:bg-[#5849c0] transition-colors"
          disabled={isLoading}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
      <div className="text-xs text-center text-gray-500 mb-2">
        Powered by Lav1
      </div>
    </div>
  )
}
