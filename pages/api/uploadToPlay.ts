// pages/api/uploadToPlay.ts

import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import FormData from "form-data";

export const config = {
  api: {
    bodyParser: false, // important! We'll parse the body ourselves with formidable
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse the incoming file with formidable
    const { fields, files } = await new Promise<{
      fields: formidable.Fields;
      files: formidable.Files;
    }>((resolve, reject) => {
      const form = formidable({ multiples: false });
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    // 'file' must match your front-end. If you used "pdfFile" in the client, then do that:
    // e.g. const uploaded = files.pdfFile
    // but here we assume you used "file" on the front-end as well for clarity.
    const uploadedFile = files.file;
    if (!uploadedFile) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    // If multiples are off, this is a single file. If it's an array, just take the first.
    const singleFile = Array.isArray(uploadedFile)
      ? uploadedFile[0]
      : uploadedFile;
    const filePath = singleFile.filepath;
    const originalName = singleFile.originalFilename || "uploaded.pdf";

    // Read the PDF into a buffer from the server's temp directory
    const pdfBuffer = fs.readFileSync(filePath);

    // Build form data for Play.ai.
    // The field name 'file' might need to be replaced if their docs say something else.
    const playForm = new FormData();
    playForm.append("file", pdfBuffer, originalName);

    // Check your .env for these
    const apiKey = process.env.PLAYDIALOG_API_KEY;
    const userId = process.env.PLAYDIALOG_USER_ID;
    if (!apiKey || !userId) {
      return res
        .status(500)
        .json({ error: "PLAYDIALOG_API_KEY or PLAYDIALOG_USER_ID not set." });
    }

    // Post to Play.ai with multipart
    const createNoteResponse = await fetch(
      "https://api.play.ai/api/v1/playnotes",
      {
        method: "POST",
        headers: {
          AUTHORIZATION: apiKey,
          "X-USER-ID": userId,
          accept: "application/json",
          // DO NOT set "Content-Type" – FormData will handle it
        },
        body: playForm as unknown as BodyInit,
      }
    );

    if (!createNoteResponse.ok) {
      const errMsg = await createNoteResponse.text();
      return res.status(createNoteResponse.status).json({ error: errMsg });
    }

    const createData = await createNoteResponse.json();
    const playNoteId = createData.playNoteId;
    if (!playNoteId) {
      return res
        .status(500)
        .json({ error: "No playNoteId returned from Play.ai." });
    }

    // Check the note status
    const checkUrl = `https://api.play.ai/api/v1/playnotes/${encodeURIComponent(
      playNoteId
    )}`;
    const checkRes = await fetch(checkUrl, {
      method: "GET",
      headers: {
        AUTHORIZATION: apiKey,
        "X-USER-ID": userId,
        accept: "application/json",
      },
    });

    if (!checkRes.ok) {
      return res.status(checkRes.status).json({ error: await checkRes.text() });
    }

    const checkData = await checkRes.json();
    if (checkData.status === "completed") {
      return res.json({
        status: "completed",
        audioUrl: checkData.audioUrl,
        transcript: checkData.transcript ?? "",
      });
    } else if (checkData.status === "generating") {
      return res.json({ status: "generating" });
    } else {
      return res
        .status(500)
        .json({
          error: "Unknown status from Play.ai",
          status: checkData.status,
        });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
