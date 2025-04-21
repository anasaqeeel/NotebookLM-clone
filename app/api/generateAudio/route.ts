// app/api/generateAudio/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const requireFF = eval("require") as NodeRequire;
    const installer = requireFF("@ffmpeg-installer/ffmpeg");
    const ffmpegPath = installer.path;

    const { script } = await request.json();
    if (!script || !script.trim()) {
      return NextResponse.json(
        { error: "Script is required" },
        { status: 400 }
      );
    }

    const lines = script
      .split("\n")
      .map((l: any) => l.trim())
      .filter(Boolean);
    const ttsBuffers: Buffer[] = [];

    for (const line of lines) {
      const m = line.match(/^(Chris|Jenna):/i);
      const speaker = m ? m[1].toLowerCase() : "chris";
      const voiceId =
        speaker === "jenna" ? "esy0r39YPLQjOczyOib8" : "ntZTccPdJ1RjBKzcima9";
      const text = line.replace(/^(Chris|Jenna):/i, "").trim();

      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_monolingual_v1",
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        }
      );

      if (!res.ok) throw new Error(`TTS failed: ${res.statusText}`);

      const audioBuffer = Buffer.from(await res.arrayBuffer());
      ttsBuffers.push(audioBuffer);
    }

    const ttsBuffer = Buffer.concat(ttsBuffers);
    console.log("✔️ TTS buffer length:", ttsBuffer.length);

    // 🧠 Estimate duration of the TTS buffer in seconds (based on 128 kbps MP3)
    const estimatedSeconds = Math.ceil((ttsBuffer.length * 8) / 128000);
    const fadeOutStart = Math.max(estimatedSeconds - 5, 0); // no negatives

    const backgroundPath = path.join(
      process.cwd(),
      "public",
      "audio",
      "background_music.mp3"
    );

    const filter = [
      `[1]volume=0.1,afade=t=in:ss=0:d=5,afade=t=out:st=${fadeOutStart}:d=5[bg]`, // lowered music to ~10%
      `[0][bg]amix=inputs=2:duration=first:dropout_transition=2[out]`,
    ].join(";");

    const args = [
      "-f",
      "mp3",
      "-i",
      "pipe:0",
      "-i",
      backgroundPath,
      "-filter_complex",
      filter,
      "-map",
      "[out]",
      "-f",
      "mp3",
      "pipe:1",
    ];

    const mixedBuffer: Buffer = await new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const proc = spawn(ffmpegPath, args);

      proc.stdout.on("data", (d: Buffer) => chunks.push(d));
      proc.stdout.on("end", () => resolve(Buffer.concat(chunks)));
      proc.stderr.on("data", (d: Buffer) =>
        console.error("⚠️ FFmpeg stderr:", d.toString())
      );
      proc.on("error", reject);

      proc.stdin.write(ttsBuffer);
      proc.stdin.end();
    });

    return new NextResponse(mixedBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `inline; filename="podcast_with_music.mp3"`,
      },
    });
  } catch (err: any) {
    console.error("❌ Audio generation error:", err);
    return NextResponse.json(
      { error: err.message || "Audio generation failed" },
      { status: 500 }
    );
  }
}
