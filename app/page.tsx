// pages/recording.tsx
import NotebookInterface from "@/components/notebook-interface"

export default function RecordingPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="w-full max-w-[1280px] mx-auto px-2 pb-0 mb-0">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 text-gray-800">
          Marketing Research
        </h1>
        <NotebookInterface />
      </div>
    </main>
  )
}
