import type { GeminiPayload, GeminiResponse } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${API_KEY}`;

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 1000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status !== 429) {
        // Not a rate-limiting error
        return response;
      }
    } catch (error) {
      if (i === retries - 1) throw error; // Last retry failed
    }
    await new Promise((res) => setTimeout(res, delay * Math.pow(2, i))); // Exponential backoff
  }
  throw new Error("Max retries reached");
}

export async function generateImageWithGemini(
  imageBase64: string,
  selectedDish: string,
  percentX: number,
  percentY: number
): Promise<string> {
  const prompt = `Please place ${selectedDish} on the table in the image. The desired location is approximately at ${percentX.toFixed(
    1
  )}% from the left and ${percentY.toFixed(
    1
  )}% from the top. The new item should blend in naturally with the existing lighting, shadows, and perspective. Maintain the original image's style and quality.`;

  const base64Data = imageBase64.split(",")[1];

  const payload: GeminiPayload = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: base64Data } },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
    },
  };

  const response = await fetchWithRetry(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorText = "";
    try {
      errorText = await response.text();
      const errorJson = JSON.parse(errorText);
      throw new Error(
        `API error (${response.status}): ${
          errorJson.error?.message || "Unknown error"
        }`
      );
    } catch {
      throw new Error(
        `API error (${response.status}): ${errorText || response.statusText}`
      );
    }
  }

  const result: GeminiResponse = await response.json();
  const generatedImageData = result?.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData
  )?.inlineData?.data;

  if (!generatedImageData) {
    console.error("API Response:", JSON.stringify(result, null, 2));
    throw new Error(
      "生成された画像データがAPIレスポンスに含まれていませんでした。"
    );
  }

  const mimeType =
    result.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)
      ?.inlineData?.mimeType || "image/jpeg";

  return `data:${mimeType};base64,${generatedImageData}`;
}
