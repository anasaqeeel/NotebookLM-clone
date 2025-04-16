// app/api/generatePodcastScript/route.ts
export const runtime = "nodejs"; // 👈 this forces serverless instead of edge

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { industry, prospectName, question } = await request.json();
    if (!industry) {
      return NextResponse.json(
        { error: "industry is required" },
        { status: 400 }
      );
    }
    // Build user prompt
    const userPrompt = `
      Please create a short “podcast style” script with two hosts: 
      Host A (male) and Host B (female). 
      They discuss the benefits of ${
        prospectName || "Unknown Prospect"
      }’s business in the ${industry} field. 
      Keep it under 5 minutes . 
      You can optionally address this extra question: ${
        question || "No question provided"
      }.

      Format lines like:

      Host A: ...
      Host B: ...
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // or "gpt-3.5-turbo" if you don't have GPT-4 access
      messages: [
        { role: "system", content: "You are a helpful creative writer." },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 700,
    });

    const script = completion.choices?.[0]?.message?.content;
    if (!script) {
      return NextResponse.json(
        { error: "No script generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({ script });
  } catch (error) {
    console.error("Error generating podcast script:", error);
    return NextResponse.json(
      { error: "Failed to generate script" },
      { status: 500 }
    );
  }
}
