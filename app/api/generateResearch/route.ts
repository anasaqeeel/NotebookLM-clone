import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const cleanedTopic = topic.trim();

    const completion = await openai.chat.completions.create({
      // model: "gpt-4", // Or use "gpt-3.5-turbo"
      model: "gpt-3.5-turbo",

      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Provide a concise, relevant answer.",
        },
        {
          role: "user",
          content: `User wants info on: ${cleanedTopic}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = completion.choices?.[0]?.message?.content?.trim();

    if (!content) {
      console.error("GPT responded but with no content");
      return NextResponse.json(
        { error: "No content generated from GPT" },
        { status: 500 }
      );
    }

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("Error generating GPT response:", error);
    return NextResponse.json(
      { error: "Failed to generate GPT response" },
      { status: 500 }
    );
  }
}
