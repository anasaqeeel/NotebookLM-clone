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
          "xi-api-key": "sk_00b4648b86c05e8ca8ed4397c5764ce1b3e6a0c669c72f0e",
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
