// app/api/generateAudio/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { script } = await request.json();
    if (!script?.trim()) {
      return NextResponse.json(
        { error: "Script is required" },
        { status: 400 }
      );
    }

    // Clean and sanitize the script
    const cleanedScript = script
      .replace(/Host A:/gi, "")
      .replace(/Host B:/gi, "")
      .replace(/intro music fades/gi, "") // Remove this line
      .trim();

    const lines = cleanedScript
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // 🪵 Log cleaned lines to terminal for debug
    console.log("🎧 Final script being sent to ElevenLabs:");
    lines.forEach((line, idx) => {
      console.log(`${idx + 1}. ${line}`);
    });

    const audioBuffers: Buffer[] = [];
    let useBrent = true;

    for (const line of lines) {
      const voiceId = useBrent ? "VOICE_ID_BRENT" : "VOICE_ID_ERWEN";

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
          },
          body: JSON.stringify({
            text: line,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to generate audio: ${response.statusText}`);
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      audioBuffers.push(audioBuffer);
      useBrent = !useBrent;
    }

    const mergedAudio = Buffer.concat(audioBuffers);

    return new NextResponse(mergedAudio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "inline; filename=podcast.mp3",
      },
    });
  } catch (error) {
    console.error("❌ ElevenLabs audio generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate audio",
      },
      { status: 500 }
    );
  }
}
