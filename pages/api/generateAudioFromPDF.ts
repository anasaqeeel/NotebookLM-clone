// pages/api/generateAudioFromPDF.ts
import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import axios from "axios";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ELEVENLABS_API_URL =
  "https://api.elevenlabs.io/v1/text-to-speech/TxGEqnHWrfWFTfGW9XjX/stream"; // Use your valid voice ID

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const form = new IncomingForm();
  form.uploadDir = path.join(process.cwd(), "/uploads");
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parsing error:", err);
      return res.status(500).json({ message: "Form parsing failed" });
    }

    const text = fields.text?.toString() || "Hello from ElevenLabs!";

    try {
      const audioBuffer = await generateAudioFromText(text);
      res.setHeader("Content-Type", "audio/mpeg");
      res.send(audioBuffer);
    } catch (error) {
      console.error("Audio generation error:", error);
      res.status(500).json({ message: "Audio generation failed" });
    }
  });
}

async function generateAudioFromText(text: string): Promise<Buffer> {
  try {
    const response = await axios.post(
      ELEVENLABS_API_URL,
      {
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          "xi-api-key": "sk_6944bbcef1d3624a2a509579f163389c62b046f68a3946fe", // use .env later
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    return Buffer.from(response.data);
  } catch (error) {
    console.error("Audio API error:", error.response?.data || error);
    throw new Error("Audio generation failed");
  }
}
