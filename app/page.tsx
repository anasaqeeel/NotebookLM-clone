// pages/recording.tsx
import NotebookInterface from "@/components/notebook-interface"

export default function RecordingPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="w-full max-w-[1280px] mx-auto px-2 py-2">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800">
          AI-Powered Marketing Research
        </h1>
        <NotebookInterface />
      </div>
    </main>
  )
}
