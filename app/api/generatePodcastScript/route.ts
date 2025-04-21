export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { industry, prospectName, question } = await request.json();
    if (!industry || !prospectName || !question) {
      return NextResponse.json(
        { error: "Industry, prospect name, and discussion topic are required" },
        { status: 400 }
      );
    }

    // Build the user prompt to generate a short podcast script
    const userPrompt = `
      Write a short podcast script with exactly two hosts:
      - Male host: Chris
      - Female host: Jenna

      Do not mention any other names like Alex, Sarah, or any narrator.
      Do not include sound directions like "[music fades in]" or "[theme fades]".

      The podcast should:
      - Introduce ${prospectName} and their role in the ${industry} industry.
      - Briefly explore the topic "${question}" in a natural, conversational tone.
      - Keep the dialogue energetic, engaging, and professional.

      IMPORTANT:
      - The script must be no more than 700 characters.
      - Limit the dialogue to around 3–4 short exchanges total.
      - The format must be:
        Chris: ...
        Jenna: ...
        Chris: ...
        Jenna: ...

      DO NOT add anything outside the dialogue. Keep it concise and within the character limit.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a creative podcast script writer specializing in short, professional, and engaging dialogue.",
        },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 400, // Lowered to reflect short script
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
