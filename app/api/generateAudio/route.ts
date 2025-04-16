// app/api/generateAudio/route.ts
import { NextRequest, NextResponse } from "next/server";
import AWS from "aws-sdk";
import { Readable } from "stream";

// Configure AWS Polly with your credentials and region
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  region: process.env.AWS_REGION || "us-west-1", // Use us-west-1 (Northern California) if needed
});

const polly = new AWS.Polly();

export async function POST(request: NextRequest) {
  try {
    const { script } = await request.json();
    if (!script || script.trim() === "") {
      return NextResponse.json(
        { error: "Script is required" },
        { status: 400 }
      );
    }

    // Remove labels and split into lines
    const cleanedScript = script
      .replace(/Host A:/gi, "")
      .replace(/Host B:/gi, "")
      .trim();
    const lines = cleanedScript
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const audioBuffers: Buffer[] = [];
    let useMale = true; // Alternate voices

    for (const line of lines) {
      const params = {
        OutputFormat: "mp3",
        Text: line,
        VoiceId: useMale ? "Matthew" : "Joanna", // Change as desired
        TextType: "text",
      };

      // Synthesize speech for the line
      const data = await polly.synthesizeSpeech(params).promise();
      if (data.AudioStream instanceof Buffer) {
        audioBuffers.push(data.AudioStream);
      } else {
        throw new Error("Failed to generate audio for a line");
      }
      useMale = !useMale;
    }

    // Merge audio buffers
    const mergedAudio = Buffer.concat(audioBuffers);

    return new NextResponse(mergedAudio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "inline; filename=podcast.mp3",
      },
    });
  } catch (error: any) {
    console.error("AWS Polly audio generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate audio" },
      { status: 500 }
    );
  }
}
