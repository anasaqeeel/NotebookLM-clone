import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const { question, context } = await request.json();

    if (!question || question.trim() === "") {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Create a prompt for the hosts to answer the question
    const prompt = `
      You are two podcast hosts (Host A and Host B) having a conversation. 
      You've been discussing the following topic:
      
      ${context}
      
      Now, a listener has asked the following question:
      "${question}"
      
      Please provide a brief, conversational response as both hosts answering this question.
      Keep your response under 5 minutes when spoken.
      Format your response as:
      
      Host A: [response]
      Host B: [response]
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Using gpt-4o for better responses
      messages: [
        {
          role: "system",
          content: "You are a helpful podcast host assistant.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 250,
    });

    const response =
      completion.choices[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("Error answering question:", error);
    return NextResponse.json(
      { error: error.message || "Failed to answer question" },
      { status: 500 }
    );
  }
}
