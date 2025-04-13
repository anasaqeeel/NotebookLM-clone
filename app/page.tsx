// pages/recording.tsx
import NotebookInterface from "@/components/notebook-interface"
import Lav1Header from "@/components/lav1-header"

export default function RecordingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-200 to-purple-100">
      <Lav1Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8 text-gray-800">
          AI-Powered Marketing Research
        </h1>
        <NotebookInterface />
      </div>
    </main>
  )
}
