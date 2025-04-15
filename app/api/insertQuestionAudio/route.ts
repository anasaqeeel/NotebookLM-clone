// app/api/insertQuestionAudio/route.ts

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Reuse previously defined constants for ElevenLabs API key and voice IDs

const VOICE_FEMALE = "EXAVITQu4vr4xnSDxMaL"; // Use a real female voice ID

export async function POST(request: NextRequest) {
  try {
    const { script, pauseTime, hostAnswer } = await request.json();
    const audioChunks: Buffer[] = [];

    // Create response audio for the question
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_FEMALE}`,
      {
        text: hostAnswer,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      },
      {
        headers: {
          "xi-api-key": "sk_2b6fd548e6fa82d1bb5a421c4403723b6f25a900c5ed5aea",
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        responseType: "arraybuffer",
      }
    );

    audioChunks.push(Buffer.from(response.data));

    // TODO: Merge existing podcast audio and question response, inserting it at the pauseTime

    const mergedAudio = Buffer.concat(audioChunks);

    return new NextResponse(mergedAudio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "inline; filename=updated_podcast.mp3",
      },
    });
  } catch (error) {
    console.error("Error inserting question audio:", error);
    return NextResponse.json(
      { error: "Failed to insert question audio" },
      { status: 500 }
    );
  }
}
