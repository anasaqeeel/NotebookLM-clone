// app/api/uploadToPlay/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import FormData from "form-data";
import { parseForm } from "@/lib/parseForm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { fields, files } = await parseForm(req);
    const uploadedFile = files.pdfFile;
    if (!uploadedFile) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const fileObj = Array.isArray(uploadedFile)
      ? uploadedFile[0]
      : uploadedFile;
    const pdfBuffer = fs.readFileSync(fileObj.filepath);
    const pdfName = fileObj.originalFilename ?? "uploaded.pdf";

    const apiKey = process.env.PLAYDIALOG_API_KEY;
    const userId = process.env.PLAYDIALOG_USER_ID;
    if (!apiKey || !userId) {
      return NextResponse.json({ error: "API keys not set." }, { status: 500 });
    }

    const form = new FormData();
    form.append("file", pdfBuffer, pdfName);

    const createNoteResponse = await fetch(
      "https://api.play.ai/api/v1/playnotes",
      {
        method: "POST",
        headers: {
          AUTHORIZATION: apiKey,
          "X-USER-ID": userId,
          accept: "application/json",
        },
        body: form as unknown as BodyInit,
      }
    );
    if (!createNoteResponse.ok) {
      const err = await createNoteResponse.text();
      return NextResponse.json(
        { error: err },
        { status: createNoteResponse.status }
      );
    }

    const createNoteData = await createNoteResponse.json();
    const playNoteId = createNoteData?.playNoteId;
    if (!playNoteId) {
      return NextResponse.json(
        { error: "No playNoteId returned." },
        { status: 500 }
      );
    }

    const checkRes = await fetch(
      `https://api.play.ai/api/v1/playnotes/${encodeURIComponent(playNoteId)}`,
      {
        method: "GET",
        headers: {
          AUTHORIZATION: apiKey,
          "X-USER-ID": userId,
          accept: "application/json",
        },
      }
    );
    if (!checkRes.ok) {
      const err = await checkRes.text();
      return NextResponse.json({ error: err }, { status: checkRes.status });
    }

    const checkData = await checkRes.json();
    if (checkData.status === "completed") {
      return NextResponse.json({
        status: "completed",
        audioUrl: checkData.audioUrl,
        transcript: checkData.transcript ?? "",
      });
    } else if (checkData.status === "generating") {
      return NextResponse.json({ status: "generating" });
    } else {
      return NextResponse.json({
        error: "PlayNote creation failed",
        status: checkData.status,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
