import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const ELEVEN_API_KEY = "sk_a7660cacd6af68d0c9bb17c544fc105a25a4a8ce44257af6";
const VOICE_MALE = "JBFqnCBsd6RMkjVDRZzb"; // e.g., "21m00Tcm4TlvDq8ikWAM"
const VOICE_FEMALE = "JBFqnCBsd6RMkjVDRZzb"; // e.g., "EXAVITQu4vr4xnSDxMaL"

export async function POST(request: NextRequest) {
  try {
    const { script } = await request.json();
    const lines = script.split("\n").filter(Boolean);

    const audioChunks = [];

    for (const line of lines) {
      const [speaker, ...textParts] = line.split(":");
      const text = textParts.join(":").trim();
      if (!text) continue;

      const voiceId = speaker.includes("Host A") ? VOICE_MALE : VOICE_FEMALE;
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        },
        {
          headers: {
            "xi-api-key": ELEVEN_API_KEY,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          responseType: "arraybuffer",
        }
      );

      audioChunks.push(Buffer.from(response.data));
    }

    const mergedAudio = Buffer.concat(audioChunks);
    return new NextResponse(mergedAudio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "inline; filename=podcast.mp3",
      },
    });
  } catch (error) {
    console.error("Audio generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate audio" },
      { status: 500 }
    );
  }
}
