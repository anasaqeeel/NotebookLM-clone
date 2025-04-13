// app/api/generateDynamicPodcast/route.ts
import { NextResponse } from "next/server";

type Data = {
  audioUrl?: string;
  transcript?: string;
  status?: string;
  message?: string;
};

async function createPlayNote(
  text: string,
  apiKey: string,
  userId: string
): Promise<{ playNoteId?: string; message?: string }> {
  const url = "https://api.play.ai/api/v1/playnotes";
  const headers = {
    Authorization: apiKey,
    "X-USER-ID": userId,
    accept: "application/json",
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        text,
        // Add additional parameters for better podcast-style output
        voice_type: "conversational",
        style: "podcast",
        speakers: [
          { voice_id: "male_01", role: "host" },
          { voice_id: "female_01", role: "co-host" },
        ],
      }),
    });
    if (res.ok) {
      const json = await res.json();
      return { playNoteId: json.playNoteId };
    } else {
      const error = await res.json();
      return { message: error.message || "Failed to create play note" };
    }
  } catch (error) {
    return { message: "Error creating play note: " + error };
  }
}

async function getPlayNoteAudioUrl(
  playNoteId: string,
  apiKey: string,
  userId: string
): Promise<Data> {
  const encodedId = encodeURIComponent(playNoteId);
  const url = `https://api.play.ai/api/v1/playnotes/${encodedId}`;
  const headers = {
    Authorization: apiKey,
    "X-USER-ID": userId,
    accept: "application/json",
  };

  try {
    const res = await fetch(url, { method: "GET", headers });
    if (res.ok) {
      const json = await res.json();
      if (json.status === "completed") {
        return {
          audioUrl: json.audioUrl,
          transcript: json.transcript,
          status: "completed",
        };
      } else {
        return {
          status: json.status,
          message:
            json.message || "Generation in progress. Please try again later.",
        };
      }
    } else {
      const error = await res.json();
      return {
        message: error.message || "Failed to retrieve play note",
        status: "error",
      };
    }
  } catch (error) {
    return { message: "Error retrieving play note: " + error, status: "error" };
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { text, researchContent } = body;

  if (!text) {
    return NextResponse.json({ message: "Text is required" }, { status: 400 });
  }

  const apiKey = process.env.PLAYDIALOG_API_KEY;
  const userId = process.env.PLAYDIALOG_USER_ID;
  if (!apiKey || !userId) {
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 }
    );
  }

  // Generate prompt for PlayNote based on research content
  const prompt = researchContent
    ? `Create a podcast discussion about: ${text}\n\nResearch highlights:\n${researchContent}\n\nSpeak naturally as two hosts would in a professional podcast.`
    : `Create a podcast discussion about: ${text}\n\nSpeak naturally as two hosts would in a professional podcast.`;

  const createResult = await createPlayNote(prompt, apiKey, userId);
  if (!createResult.playNoteId) {
    return NextResponse.json(
      {
        message:
          createResult.message || "Unknown error during play note creation",
      },
      { status: 500 }
    );
  }

  // Poll for completion (simplified version - in production you might want to use webhooks)
  let result: Data = { status: "processing" };
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts && result.status !== "completed") {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    result = await getPlayNoteAudioUrl(createResult.playNoteId, apiKey, userId);
    attempts++;
  }

  if (result.status === "completed" && result.audioUrl) {
    return NextResponse.json({
      audioUrl: result.audioUrl,
      transcript: result.transcript,
    });
  } else {
    return NextResponse.json(
      {
        status: result.status || "timeout",
        message: result.message || "Audio generation timed out",
      },
      { status: 500 }
    );
  }
}
