import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs-extra";
import axios from "axios";
import { OpenAI } from "openai";
import FormData from "form-data";
import path from "path";

export const config = {
  api: { bodyParser: false },
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
const VOICE_1_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel
const VOICE_2_ID = "TxGEqnHWrfWFTfGW9XjX"; // Domi

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    // 1. Parse uploaded file
    const { files } = await new Promise<{ files: formidable.Files }>(
      (resolve, reject) => {
        const form = formidable({ multiples: false });
        form.parse(req, (err, _fields, files) => {
          if (err) reject(err);
          else resolve({ files });
        });
      }
    );

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const fileContent = await fs.readFile(file.filepath, "utf-8");

    // 2. Ask OpenAI to create a 2-host podcast conversation
    const openaiResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Create a podcast script with two hosts discussing the following content in a casual tone:\n\n${fileContent}`,
        },
      ],
    });

    const podcastScript = openaiResponse.choices[0].message.content || "";

    // 3. Split script into lines by speakers
    const lines = podcastScript.split("\n").filter(Boolean);

    // 4. Convert lines to audio (alternating speakers)
    const audioBuffers: Buffer[] = [];
    let currentVoice = VOICE_1_ID;

    for (const line of lines) {
      const text = line.replace(/^[A-Z]+:/, "").trim();
      const voiceId = currentVoice;
      currentVoice = currentVoice === VOICE_1_ID ? VOICE_2_ID : VOICE_1_ID;

      const audioBuffer = await textToSpeechElevenLabs(text, voiceId);
      audioBuffers.push(audioBuffer);
    }

    // 5. Merge all buffers
    const combinedBuffer = Buffer.concat(audioBuffers);

    // 6. Save combined audio file temporarily
    const audioPath = path.join("/tmp", `podcast-${Date.now()}.mp3`);
    await fs.writeFile(audioPath, combinedBuffer);

    // 7. Respond with audio file as base64 string
    const base64Audio = combinedBuffer.toString("base64");

    res.status(200).json({
      success: true,
      audioBase64: base64Audio,
      podcastScript,
    });
  } catch (error: any) {
    console.error("Podcast generation error:", error.message || error);
    res
      .status(500)
      .json({ error: "Something went wrong", detail: error.message });
  }
}

async function textToSpeechElevenLabs(
  text: string,
  voiceId: string
): Promise<Buffer> {
  const form = new FormData();
  form.append("text", text);
  form.append("model_id", "eleven_monolingual_v1");
  form.append(
    "voice_settings",
    JSON.stringify({ stability: 0.5, similarity_boost: 0.5 })
  );

  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      responseType: "arraybuffer",
    }
  );

  return Buffer.from(response.data);
}
