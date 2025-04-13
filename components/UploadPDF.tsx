"use client"

import { useState } from "react"

export default function UploadPDF() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [status, setStatus] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    setSelectedFile(e.target.files[0])
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setStatus("No file selected.")
      return
    }

    setStatus("Uploading...")

    // Build a FormData object for the *front-end* => Next.js route
    const formData = new FormData()
    formData.append("pdfFile", selectedFile)

    // POST to our Next.js route at /api/uploadToPlay
    try {
      const res = await fetch("/api/uploadToPlay", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const err = await res.text()
        setStatus("Error: " + err)
        return
      }

      const data = await res.json()
      if (data.status === "completed") {
        setStatus("Audio generated! URL: " + data.audioUrl)
      } else if (data.status === "generating") {
        setStatus("Note is still generating. Try again later.")
      } else if (data.error) {
        setStatus("Error: " + data.error)
      } else {
        setStatus("Unknown response: " + JSON.stringify(data))
      }
    } catch (error: any) {
      setStatus("Exception: " + error.message)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
      />
      <button onClick={handleUpload}>
        Upload & Generate Audio
      </button>
      {status && <p>{status}</p>}
    </div>
  )
}
