import { NextRequest } from "next/server";
import { Buffer } from "buffer";
import formidable, { type Fields, type Files } from "formidable";
import { IncomingMessage } from "http";


export async function parseForm(
  req: NextRequest
): Promise<{ fields: Fields; files: Files }> {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });
    const chunks: Buffer[] = [];

    const reader = req.body?.getReader();
    if (!reader) {
      reject(new Error("No request body found."));
      return;
    }

    // Recursively read the entire stream into an array of chunks
    function processChunk({ done, value }: any): Promise<void> {
      if (done) {
        const fullBuffer = Buffer.concat(chunks);
        const mockReq = createMockIncomingMessage(
          fullBuffer,
          req.headers.get("content-type") || "",
          Number(fullBuffer.length)
        );

        form.parse(
          mockReq as unknown as IncomingMessage,
          (err, fields, files) => {
            if (err) return reject(err);
            resolve({ fields, files });
          }
        );
        return Promise.resolve();
      }
      chunks.push(Buffer.from(value));
      return reader.read().then(processChunk);
    }

    reader
      .read()
      .then(processChunk)
      .catch((err) => reject(err));
  });
}

function createMockIncomingMessage(
  buffer: Buffer,
  contentType: string,
  contentLength: number
) {
  return {
    url: "/api/uploadToPlay",
    method: "POST",
    headers: {
      "content-type": contentType,
      "content-length": String(contentLength),
    },
    // The crucial part: formidable calls these
    // We'll stub them out with no-op functions
    on(_event: string, _fn: (...args: any[]) => any) {},
    once(_event: string, _fn: (...args: any[]) => any) {},
    emit(_event: string, ..._args: any[]) {},
    removeListener(_event: string, _fn: (...args: any[]) => any) {},
    removeAllListeners(_event?: string) {},
    resume() {},
    isPaused() {
      return false;
    },
    pipe(destination: any) {
      destination.end(buffer);
      return destination;
    },
  };
}
