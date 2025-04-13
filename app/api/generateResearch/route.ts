// app/api/generateResearch/route.ts
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

// Initialize OpenAI with proper error handling
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(request: Request) {
  const { topic } = await request.json();

  if (!topic) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using gpt-3.5-turbo instead of gpt-4 to reduce costs
      messages: [
        {
          role: "system",
          content:
            "You are a research assistant. Generate concise, bullet-point research summaries focused on key benefits and insights. Keep it under 300 words.",
        },
        {
          role: "user",
          content: `Generate research about: ${topic}. Focus on key benefits for customers in this industry. Include the prospect's name if mentioned.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No content generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error generating research:", error);
    return NextResponse.json(
      { error: "Failed to generate research" },
      { status: 500 }
    );
  }
}
