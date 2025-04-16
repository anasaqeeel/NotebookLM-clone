// app/api/generateAudio/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

// Initialize Polly client using your environment variables
const pollyClient = new PollyClient({
  region: process.env.AWS_POLLY_REGION, // for example, "us-west-1"
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Helper to convert a Readable stream into a Buffer
function streamToBuffer(stream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

export async function POST(request: NextRequest) {
  try {
    const { script } = await request.json();
    if (!script || script.trim() === "") {
      return NextResponse.json(
        { error: "Script is required" },
        { status: 400 }
      );
    }

    console.log("Generating podcast audio for script:", script);

    // Split the script into lines and remove host labels
    const lines = script
      .split("\n")
      .map((line) => line.replace(/^(Host A:|Host B:)\s*/i, "").trim())
      .filter((line) => line.length > 0);

    const audioBuffers: Buffer[] = [];

    // Alternate voices for each line (or define your own logic)
    const voices = ["Matthew", "Joanna"]; // male then female
    lines.forEach((_, i) => {}); // placeholder if you want to customize further

    for (let i = 0; i < lines.length; i++) {
      const text = lines[i];
      // Use male for even index, female for odd index
      const voiceId = i % 2 === 0 ? voices[0] : voices[1];

      const command = new SynthesizeSpeechCommand({
        OutputFormat: "mp3",
        Text: text,
        VoiceId: voiceId,
        TextType: "text",
      });

      const response = await pollyClient.send(command);
      const buffer = await streamToBuffer(response.AudioStream);
      audioBuffers.push(buffer);
    }

    // Merge all the audio buffers; note: simple concatenation for demo purposes
    const mergedBuffer = Buffer.concat(audioBuffers);

    return new NextResponse(mergedBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "inline; filename=podcast.mp3",
      },
    });
  } catch (error: any) {
    console.error("Error generating audio:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate audio" },
      { status: 500 }
    );
  }
}
