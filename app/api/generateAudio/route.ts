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

    const rawLines: string[] = script
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    const audioBuffers: Buffer[] = [];

    console.log("🎧 Final script being sent to ElevenLabs:");

    for (let idx = 0; idx < rawLines.length; idx++) {
      const rawLine = rawLines[idx];

      // Detect speaker
      const speakerMatch = rawLine.match(/^(Chris|Jenna):/i);
      const speaker = speakerMatch ? speakerMatch[1].toLowerCase() : "chris";

      // ✅ Assign correct voice (voice IDs swapped here!)
      const voiceId =
        speaker === "jenna"
          ? "esy0r39YPLQjOczyOib8" // ✅ Female voice
          : "ntZTccPdJ1RjBKzcima9"; // ✅ Male voice

      // Clean up line
      const cleanedLine = rawLine
        .replace(/^(Chris|Jenna):/i, "")
        .replace(/\[.*?\]/g, "")
        .trim();

      console.log(`${idx + 1}. ${speaker.toUpperCase()}: ${cleanedLine}`);
      console.log(`🎤 Voice ID used: ${voiceId}`);

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
          },
          body: JSON.stringify({
            text: cleanedLine,
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
