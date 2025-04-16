// app/api/insertQuestionAudio/route.ts
import { NextRequest, NextResponse } from "next/server";
import AWS from "aws-sdk";

// Configure Polly
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  region: process.env.AWS_REGION || "us-west-1",
});
const polly = new AWS.Polly();

export async function POST(request: NextRequest) {
  try {
    const { hostAnswer } = await request.json();
    if (!hostAnswer || hostAnswer.trim() === "") {
      return NextResponse.json({ error: "Host answer is required" }, { status: 400 });
    }

    // Remove any host labels
    const cleanedAnswer = hostAnswer.replace(/Host A:/gi, "").replace(/Host B:/gi, "").trim();

    // For follow-up, alternate voices as needed; for example, use female voice only:
    const params = {
      OutputFormat: "mp3",
      Text: cleanedAnswer,
      VoiceId: "Joanna", // Use the desired female voice for follow-up
      TextType: "text",
    };

    const data = await polly.synthesizeSpeech(params).promise();
    if (!(data.AudioStream instanceof Buffer)) {
      throw new Error("Failed to generate follow-up audio.");
    }

    return new NextResponse(data.AudioStream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "inline; filename=followup_podcast.mp3",
      },
    });
  } catch (error: any) {
    console.error("Follow-up audio generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate follow-up audio" }, { status: 500 });
  }
}
