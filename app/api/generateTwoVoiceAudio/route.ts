// app/api/generateTwoVoiceAudio/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createWriteStream } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const MALE_VOICE_ID = "someElevenLabsMaleVoiceId";
const FEMALE_VOICE_ID = "someElevenLabsFemaleVoiceId";

export async function POST(req: NextRequest) {
  try {
    const { script } = await req.json();
    if (!script) {
      return NextResponse.json(
        { error: "script is required" },
        { status: 400 }
      );
    }

    // 1) Split lines. Each line starts with "Host A:" or "Host B:"
    const lines = script.split("\n").filter((l) => l.trim().length > 0);

    // 2) For each line, call ElevenLabs TTS
    // We'll store the audio buffers in an array
    let audioBuffers: Buffer[] = [];

    for (const line of lines) {
      let voiceId = MALE_VOICE_ID;
      if (line.startsWith("Host B:")) {
        voiceId = FEMALE_VOICE_ID;
      }
      // remove "Host A:" from the text
      const text = line.replace(/Host [AB]:/i, "").trim();

      const ttsBuffer = await textToSpeechElevenLabs(text, voiceId);
      audioBuffers.push(ttsBuffer);
    }

    // 3) Concatenate all buffers into a single mp3 or wave
    // (Requires a library like "audioconcat" or manual ffmpeg approach.)
    // For a minimal approach, we might just return them as separate segments
    // or do an advanced approach with FFmpeg on the server.

    // For demonstration, let's say we just return them as a "combined" array.
    // Real solution: combine them properly with ffmpeg or a similar approach.

    const combined = Buffer.concat(audioBuffers);
    return new Response(combined, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (err) {
    console.error("Error generating two-voice audio:", err);
    return NextResponse.json(
      { error: "TTS generation failed" },
      { status: 500 }
    );
  }
}

async function textToSpeechElevenLabs(
  text: string,
  voiceId: string
): Promise<Buffer> {
  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;
    const response = await axios.post(
      url,
      {
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.4, similarity_boost: 0.9 },
      },
      {
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );
    return Buffer.from(response.data);
  } catch (error) {
    console.error("ElevenLabs TTS error:", error);
    throw new Error("ElevenLabs TTS error");
  }
}
