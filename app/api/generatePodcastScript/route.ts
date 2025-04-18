// app/api/generatePodcastScript/route.ts
export const runtime = "nodejs";

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

    const userPrompt = `
    Write a podcast script with **exactly** two hosts:
    
    - Male host: Chris
    - Female host: Jenna
    
    Do **not** mention any other names like Alex, Sarah, or any narrator.
    Do **not** include sound directions like "[music fades in]" or "[theme fades]".
    
    Make it sound like a natural, energetic, real podcast conversation between Chris and Jenna. They should discuss the benefits of ${
      prospectName || "Unknown Prospect"
    }'s business in the ${industry} field.
    
    If a user question is provided, include it **inside** the dialogue naturally.
    
    The format must be:
    
    Chris: ...
    Jenna: ...
    Chris: ...
    Jenna: ...
    
    User Question: "${question || "No question provided"}"
    
    DO NOT ADD ANYTHING OUTSIDE THE DIALOGUE.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful creative podcast script writer.",
        },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
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
