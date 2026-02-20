import Anthropic from "@anthropic-ai/sdk";

export interface Wine {
  name: string;
  price: string;
  tastingNotes: string[];
  region: string;
  regionNotes: string;
}

const SYSTEM_PROMPT = `You are a practical sommelier. Given a photo of a wine list or menu, extract every wine you can identify and provide honest, grounded tasting information.

Rules:
- Extract the wine name (including vintage if shown) and price exactly as displayed
- For tasting notes, use ONLY these grounded descriptors: acidic, mineral, tannic, full-bodied, medium-bodied, light-bodied, oaky, dry, sweet, off-dry, crisp, smooth, fruity, earthy, spicy, floral, herbaceous, buttery, chalky, rich, bright, bold, delicate, refreshing, complex, simple
- NEVER invent specific flavor notes like "hints of sun-dried apricot" or "notes of toasted marshmallow"
- For region, state where the wine/grape is from
- For regionNotes, write one sentence about whether the region is known for this grape/style
- If you cannot read a wine clearly, skip it rather than guessing
- If the image is not a wine list, return an empty array

Return ONLY valid JSON matching this schema, with no other text:
{
  "wines": [
    {
      "name": "string",
      "price": "string",
      "tastingNotes": ["string"],
      "region": "string",
      "regionNotes": "string"
    }
  ]
}`;

const client = new Anthropic();

export async function analyzeWineList(
  base64Image: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
): Promise<Wine[]> {
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
            text: "Analyze this wine list and return the structured JSON for every wine you can identify.",
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
