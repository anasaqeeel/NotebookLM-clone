// app/api/generateAudio/route.ts
import { NextRequest, NextResponse } from "next/server";
import AWS from "aws-sdk";

// Configure AWS Polly
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  region: process.env.AWS_REGION || "us-west-1",
});

const polly = new AWS.Polly();

export async function POST(request: NextRequest) {
  try {
    const { script } = (await request.json()) as { script?: string };
    if (!script?.trim()) {
      return NextResponse.json(
        { error: "Script is required" },
        { status: 400 }
      );
    }

    // Strip labels and split into non‑empty lines
    const cleanedScript = script
      .replace(/Host A:/gi, "")
      .replace(/Host B:/gi, "")
      .trim();

    const lines: string[] = cleanedScript
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    const audioBuffers: Buffer[] = [];
    let useMale = true; // alternate voices

    for (const line of lines) {
      const params: AWS.Polly.SynthesizeSpeechInput = {
        OutputFormat: "mp3",
        Text: line,
        VoiceId: useMale ? "Matthew" : "Joanna",
        TextType: "text",
      };

      const data = await polly.synthesizeSpeech(params).promise();
      if (!data.AudioStream || !(data.AudioStream instanceof Buffer)) {
        throw new Error("Failed to generate audio for line");
      }
      audioBuffers.push(data.AudioStream);
      useMale = !useMale;
    }

    const mergedAudio = Buffer.concat(audioBuffers);

    return new NextResponse(mergedAudio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "inline; filename=podcast.mp3",
      },
    });
  } catch (error: unknown) {
    console.error("AWS Polly audio generation error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: message || "Failed to generate audio" },
      { status: 500 }
    );
  }
}
