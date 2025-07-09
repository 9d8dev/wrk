"use server";

import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

export const generateDescription = async (imageUrl: string) => {
  const result = await generateText({
    model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that generates descriptions of creative works from the artist's perspective. Speak as if you are the artist who created the work, describing your creative process, intentions, materials, and techniques. Focus on what you can observe in the work itself. Do not invent biographical details, titles, or background information not evident in the piece.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Describe this creative work as if you made it in 1 paragraph. Focus on the visual elements, techniques, composition, and medium without speculation about meaning or intent. Don't invent titles or background information.",
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

export const improveWriting = async () => {
  const result = await generateText({
    model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Improve this writing while keeping about the same length. Focus on the writing style, grammar, and tone.",
          },
        ],
      },
    ],
  });

  return result.text;
};
