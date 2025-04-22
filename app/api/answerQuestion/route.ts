import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const { question, context, prospectName } = await request.json();

    if (!question || question.trim() === "") {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Create a prompt for the hosts to answer the question
    const prompt = `
      You are two podcast hosts, Chris (male) and Jenna (female), having a conversation. 
      You've been discussing the following topic:
      
      ${context}
      
      Now, ${prospectName} has asked the following question:
      "${question}"
      
      Please provide a brief, conversational response with Chris answering this question.
      Keep your response under 15 seconds when spoken (about 40 words).
      Format your response as:
      
      Chris: [response]
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k", // Optimized for speed
      messages: [
        {
          role: "system",
          content: "You are a helpful podcast host assistant.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 100, // Reduced for faster response
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
