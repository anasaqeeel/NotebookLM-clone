// app/api/insertQuestionAudio/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

const pollyClient = new PollyClient({
  region: process.env.AWS_POLLY_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

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
    const { hostAnswer } = await request.json();
    if (!hostAnswer || hostAnswer.trim() === "") {
      return NextResponse.json(
        { error: "Host answer is required" },
        { status: 400 }
      );
    }

    // Remove any host labels from the answer
    const cleanedAnswer = hostAnswer
      .replace(/^(Host A:|Host B:)\s*/gi, "")
      .trim();

    // For demonstration, if the answer contains a delimiter (e.g., '---'), split it;
    // otherwise duplicate it so both voices are used.
    const parts = cleanedAnswer
      .split("---")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    let answerParts =
      parts.length >= 2 ? parts.slice(0, 2) : [cleanedAnswer, cleanedAnswer];

    const voices = ["Matthew", "Joanna"]; // male then female
    const audioBuffers: Buffer[] = [];

    for (let i = 0; i < answerParts.length; i++) {
      const command = new SynthesizeSpeechCommand({
        OutputFormat: "mp3",
        Text: answerParts[i],
        VoiceId: voices[i],
        TextType: "text",
      });
      const response = await pollyClient.send(command);
      const buffer = await streamToBuffer(response.AudioStream);
      audioBuffers.push(buffer);
    }

    const mergedBuffer = Buffer.concat(audioBuffers);

    return new NextResponse(mergedBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "inline; filename=followup_podcast.mp3",
      },
    });
  } catch (error: any) {
    console.error("Error inserting question audio:", error);
    return NextResponse.json(
      { error: error.message || "Failed to insert question audio" },
      { status: 500 }
    );
  }
}
