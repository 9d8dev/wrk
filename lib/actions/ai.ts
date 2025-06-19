"use server";

import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

export const generateDescription = async (imageUrl: string) => {
  const result = await generateText({
    model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that generates descriptions of creative works. You are speaking in behalf of the artist who created the work.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Describe this creative work as if you were the artist who created it. Keep it objective and return only a paragraph or two.",
          },
          {
            type: "image",
            image: imageUrl,
          },
        ],
      },
    ],
  });

  return result.text;
};
