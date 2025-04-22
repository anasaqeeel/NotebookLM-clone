import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY!;
const VOICE_MALE = "J2ZyEiucCjyqhQvUa1Zg";
const VOICE_FEMALE = "4J6vnGRtSwQwvsNMctFD";

export async function POST(request: NextRequest) {
  try {
    const { hostAnswer } = (await request.json()) as { hostAnswer?: string };
    if (!hostAnswer?.trim()) {
      return NextResponse.json(
        { error: "hostAnswer is required" },
        { status: 400 }
      );
    }

    const lines: string[] = hostAnswer
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0);

    const chunks: Buffer[] = [];

    for (const line of lines) {
      const [speakerLabel, ...rest] = line.split(":");
      const text = rest.join(":").trim();
      if (!text) continue;

      const voiceId = /Chris/i.test(speakerLabel) ? VOICE_MALE : VOICE_FEMALE;

      const resp = await axios.post<ArrayBuffer>(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
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

      chunks.push(Buffer.from(resp.data));
    }

    const merged = Buffer.concat(chunks);

    return new NextResponse(merged, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "inline; filename=followup.mp3",
      },
    });
  } catch (err: unknown) {
    console.error("insertQuestionAudio error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message || "Failed to insert question audio" },
      { status: 500 }
    );
  }
}
