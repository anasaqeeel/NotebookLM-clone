import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

let conversationHistory: { role: string; content: string }[] = []; // Store the conversation history

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const cleanedTopic = topic.trim();

    // Update the conversation history with the user message
    conversationHistory.push({ role: "user", content: cleanedTopic });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Or use "gpt-4" based on your need
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Provide a concise, relevant answer.",
        },
        ...conversationHistory, // Proper format for user and assistant roles
      ] as OpenAI.CreateChatCompletionRequestMessage[], // Use the correct type here
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

    // Append the assistant's response to the conversation history
    conversationHistory.push({ role: "assistant", content });

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("Error generating GPT response:", error);
    return NextResponse.json(
      { error: "Failed to generate GPT response" },
      { status: 500 }
    );
  }
}
