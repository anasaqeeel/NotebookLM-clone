import { NextRequest, NextResponse } from "next/server";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";

// Helper to get duration of audio
const getDuration = (filePath: string): Promise<number> =>
  new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });

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

    for (let idx = 0; idx < rawLines.length; idx++) {
      const rawLine = rawLines[idx];

      const speakerMatch = rawLine.match(/^(Chris|Jenna):/i);
      const speaker = speakerMatch ? speakerMatch[1].toLowerCase() : "chris";

      const voiceId =
        speaker === "jenna" ? "esy0r39YPLQjOczyOib8" : "ntZTccPdJ1RjBKzcima9";

      const cleanedLine = rawLine
        .replace(/^(Chris|Jenna):/i, "")
        .replace(/\[.*?\]/g, "")
        .trim();

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

    const speechAudio = Buffer.concat(audioBuffers);
    const tempDir = path.join(process.cwd(), "tmp");
    await fs.mkdir(tempDir, { recursive: true });

    const speechFile = path.join(tempDir, `speech_${uuidv4()}.mp3`);
    const outputFile = path.join(tempDir, `output_${uuidv4()}.mp3`);
    const musicFile = path.join(
      process.cwd(),
      "public/audio/background_music.mp3"
    );

    await fs.writeFile(speechFile, speechAudio);

    // Get duration of speech
    const speechDuration = await getDuration(speechFile);
    const fadeOutStart = Math.max(0, speechDuration - 3);

    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(speechFile)
        .input(musicFile)
        .inputOptions("-stream_loop", "-1") // Loop music if needed
        .complexFilter([
          `[1:a]volume=0.25,afade=t=in:st=0:d=3,afade=t=out:st=${fadeOutStart}:d=3[a1]`,

          `[0:a][a1]amix=inputs=2:duration=first:dropout_transition=3[a]`,
        ])
        .outputOptions(["-map [a]", "-c:a", "libmp3lame"])
        .save(outputFile)
        .on("end", resolve)
        .on("error", (err) =>
          reject(new Error(`FFmpeg error: ${err.message}`))
        );
    });

    const mergedAudio = await fs.readFile(outputFile);

    await fs.unlink(speechFile).catch(() => {});
    await fs.unlink(outputFile).catch(() => {});

    return new NextResponse(mergedAudio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "inline; filename=podcast.mp3",
      },
    });
  } catch (error) {
    console.error("Audio generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate audio",
      },
      { status: 500 }
    );
  }
}
