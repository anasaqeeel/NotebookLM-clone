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

    // Build the user prompt to generate an engaging podcast script
    const userPrompt = `
      Write a podcast script with **exactly** two hosts:
      - Male host: Chris
      - Female host: Jenna

      Do **not** mention any other names like Alex, Sarah, or any narrator.
      Do **not** include sound directions like "[music fades in]" or "[theme fades]".
      
      Start the podcast with an enthusiastic introduction that:
      - Highlights the prospect (${prospectName}) and their impact in the ${industry} industry.
      - Introduces the discussion topic "${question}" as the central theme without framing it as a question.
      - Creates excitement about the discussion to come.
      
      Then, transition into a natural, energetic, and engaging conversation between Chris and Jenna that revolves around the discussion topic in the context of the ${industry} field.
      
      The hosts should:
      - Discuss ${prospectName}'s business and their innovations or contributions in the ${industry} field.
      - Explore the discussion topic "${question}" thoroughly, weaving it into the conversation naturally.
      - Share insights, examples, or anecdotes to make the discussion relatable and compelling.
      - Keep the tone professional yet conversational, like a top-tier podcast.

      **The format must be:**
      Chris: ...
      Jenna: ...
      Chris: ...
      Jenna: ...
      Chris: ...

      Ensure the script is at least 5 exchanges long, with each host contributing meaningfully. 
      DO NOT ADD ANYTHING OUTSIDE THE DIALOGUE.
    `;

    // Request OpenAI to generate the script
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a creative podcast script writer specializing in engaging, professional, and natural dialogue.",
        },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 800,
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