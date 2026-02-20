import Anthropic from "@anthropic-ai/sdk";

export type WineType = "all" | "red" | "white" | "rose" | "sparkling";

export interface TastingNote {
  descriptor: string;
  rating: number;
}

export interface Wine {
  name: string;
  price: string;
  regionNotes: string;
  tastingNotes: TastingNote[];
  story: string;
}

const SYSTEM_PROMPT = `You are a practical sommelier. Given a photo of a wine list or menu, extract wines and provide honest, grounded tasting information.

Rules:
- Extract the wine name (including vintage if shown) and price exactly as displayed
- For regionNotes, state where the wine is from and one sentence on whether the region is known for this grape/style
- For tastingNotes, rate ONLY the relevant descriptors on a 1-10 scale. Only include descriptors that score 4 or above — omit anything the wine is not notably characterized by. Available descriptors: acidic, mineral, tannic, full-bodied, light-bodied, oaky, dry, sweet, crisp, smooth, fruity, earthy, spicy, floral, herbaceous, buttery, chalky, rich, bright, bold, delicate
- For story, write 1-2 sentences with an interesting fact about this specific wine, vineyard, or winemaker. Something someone at a dinner table would find genuinely interesting — history, a quirky production method, the founder's background, an award, etc. If you don't know anything specific, write about something notable about the grape variety in this region.
- If you cannot read a wine clearly, skip it rather than guessing
- If the image is not a wine list, return an empty array

Return ONLY valid JSON matching this schema, with no other text:
{
  "wines": [
    {
      "name": "string",
      "price": "string",
      "regionNotes": "string",
      "tastingNotes": [{"descriptor": "string", "rating": number}],
      "story": "string"
    }
  ]
}`;

const client = new Anthropic();

export async function analyzeWineList(
  base64Image: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif",
  wineTypes: WineType[] = ["all"]
): Promise<Wine[]> {
  let userText = "Analyze this wine list and return the structured JSON for every wine you can identify.";

  if (!wineTypes.includes("all")) {
    const labels = wineTypes.map((t) => (t === "rose" ? "rosé" : t));
    userText = `Analyze this wine list and return the structured JSON for ONLY the ${labels.join(" and ")} wines. Skip all other wine types.`;
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64Image,
            },
          },
          {
            type: "text",
            text: userText,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Extract JSON from the response (handle markdown code blocks)
  let jsonStr = textBlock.text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);
  return parsed.wines as Wine[];
}
