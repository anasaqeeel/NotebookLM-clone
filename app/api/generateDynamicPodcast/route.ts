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
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const json = await res.json();
      return { playNoteId: json.playNoteId }; // assuming playNoteId is returned
    } else {
      return { message: "Failed to create play note" };
    }
  } catch (error) {
    return { message: "Error creating play note: " + error };
  }
}

async function getPlayNoteAudioUrl(
  playNoteId: string,
  apiKey: string,
  userId: string
): Promise<{
  audioUrl?: string;
  transcript?: string;
  status?: string;
  message?: string;
}> {
  // Double encode the playNoteId for URL safety.
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
          message: "Generation in progress. Please try again later.",
        };
      }
    } else {
      return { message: "Failed to retrieve play note", status: "error" };
    }
  } catch (error) {
    return { message: "Error retrieving play note: " + error, status: "error" };
  }
}

export async function POST(request: Request) {
  // Parse the incoming JSON body
  const body = await request.json();
  const { text } = body;
  if (!text) {
    return NextResponse.json({ message: "Text is required" }, { status: 400 });
  }

  // Retrieve API credentials from environment variables.
  const apiKey = process.env.PLAYDIALOG_API_KEY;
  const userId = process.env.PLAYDIALOG_USER_ID;
  if (!apiKey || !userId) {
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 }
    );
  }

  // Step 1: Create a play note.
  const createResult = await createPlayNote(text, apiKey, userId);
  if (!createResult.playNoteId) {
    return NextResponse.json(
      {
        message:
          createResult.message || "Unknown error during play note creation",
      },
      { status: 500 }
    );
  }
  const playNoteId = createResult.playNoteId;

  // Step 2: Simulate a delay for generation (e.g., 5 seconds).
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Step 3: Retrieve the audio URL and transcript.
  const result = await getPlayNoteAudioUrl(playNoteId, apiKey, userId);
  if (result.status === "completed" && result.audioUrl) {
    return NextResponse.json({
      audioUrl: result.audioUrl,
      transcript: result.transcript,
    });
  } else {
    return NextResponse.json({
      status: result.status,
      message: result.message,
    });
  }
}
