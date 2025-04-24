export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import pLimit from "p-limit";

// Cache FFmpeg path to avoid re-instantiation on each request
const requireFF = eval("require") as NodeRequire;
const installer = requireFF("@ffmpeg-installer/ffmpeg");
const ffmpegPath = installer.path;

/**
 * Fetch TTS audio with retry and exponential backoff on 429 errors.
 */
async function fetchTtsWithRetry(
  voiceId: string,
  text: string,
  apiKey: string,
  maxAttempts = 3
): Promise<Buffer> {
  let attempt = 0;
  while (attempt < maxAttempts) {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (res.ok) {
      return Buffer.from(await res.arrayBuffer());
    }

    if (res.status === 429) {
      // Rate limited: parse Retry-After or default to 1s
      const retryAfterHeader = res.headers.get("Retry-After");
      const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader) : 1;
      const delayMs = retryAfter * 1000 * Math.pow(2, attempt);
      console.warn(
        `TTS rate limited (429). Retrying in ${delayMs}ms (attempt ${
          attempt + 1
        })`
      );
      await new Promise((r) => setTimeout(r, delayMs));
      attempt++;
      continue;
    }

    // Other error: bail out
    throw new Error(`TTS failed: ${res.statusText}`);
  }

  throw new Error("TTS failed after maximum retry attempts");
}

export async function POST(request: NextRequest) {
  try {
    const { script } = await request.json();
    if (!script || !script.trim()) {
      return NextResponse.json(
        { error: "Script is required" },
        { status: 400 }
      );
    }

    // Split into non-empty lines
    const lines = script
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean);

    // Limit concurrency to avoid hitting rate limits
    const limiter = pLimit(3);

    // Parallel TTS with retry
    const ttsBuffers: Buffer[] = await Promise.all(
      lines.map((line: any) =>
        limiter(async () => {
          const m = line.match(/^(Chris|Jenna):/i);
          const speaker = m ? m[1].toLowerCase() : "chris";
          const voiceId =
            speaker === "jenna"
              ? "4J6vnGRtSwQwvsNMctFD"
              : "J2ZyEiucCjyqhQvUa1Zg";
          const text = line.replace(/^(Chris|Jenna):/i, "").trim();

          return await fetchTtsWithRetry(
            voiceId,
            text,
            process.env.ELEVENLABS_API_KEY || ""
          );
        })
      )
    );

    // Combine all TTS chunks
    const ttsBuffer = Buffer.concat(ttsBuffers);
    console.log("✔️ TTS buffer length:", ttsBuffer.length);

    // Estimate fade-out start
    const estimatedSeconds = Math.ceil((ttsBuffer.length * 8) / 128000);
    const fadeOutStart = Math.max(estimatedSeconds - 5, 0);

    const backgroundPath = path.join(
      process.cwd(),
      "public",
      "audio",
      "background_music.mp3"
    );

    const filter = [
      `[1]volume=0.1,afade=t=in:ss=0:d=5,afade=t=out:st=${fadeOutStart}:d=5[bg]`,
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
