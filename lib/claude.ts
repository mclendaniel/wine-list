import Anthropic from "@anthropic-ai/sdk";

export type WineType = "all" | "red" | "white" | "rose" | "sparkling";

export interface TastingNote {
  descriptor: string;
  rating: number;
}

export interface Wine {
  name: string;
  price: string;
  vibe: string;
  regionNotes: string;
  tastingNotes: TastingNote[];
  story: string;
}

const SYSTEM_PROMPT = `You are a practical sommelier. Given a photo of a wine list or menu, extract wines and provide honest, grounded tasting information.

You have access to web search. For EACH wine, search for the specific winery or producer to find a concrete, interesting fact for the story field. Search for things like "[winery name] history", "[winery name] winemaker", or "[wine name] wine".

Rules:
- Extract the wine name (including vintage if shown) and price exactly as displayed
- For vibe, write a punchy 2-4 word evocative tagline that captures the mood or feeling of the wine. Be wildly creative — vary the structure and style. Some examples: "sexy barnyard", "Tuesday in Tuscany", "the good linen", "your cool aunt", "hot gravel", "first date confidence", "old library leather", "midnight fig". Mix metaphors, moods, textures, moments, people, places — don't fall into a pattern. This should give an instant atmospheric impression, not describe the taste.
- For regionNotes, state where the wine is from and one sentence on whether the region is known for this grape/style
- For tastingNotes, rate ONLY the relevant descriptors on a 1-10 scale. Only include descriptors that score 4 or above — omit anything the wine is not notably characterized by. Available descriptors: acidic, mineral, saline, tannic, full-bodied, light-bodied, oaky, dry, sweet, crisp, smooth, fruity, earthy, spicy, floral, herbaceous, buttery, chalky, rich, bright, bold, delicate
- For story, write 1-2 sentences with a SPECIFIC fact about this winery, vineyard, or winemaker that you found via web search. Include concrete details — founder names, year established, a specific technique, an award with a year, etc. Do NOT repeat region information from regionNotes. If the search doesn't turn up anything specific, say something genuinely interesting about the grape or production method instead.
- If you cannot read a wine clearly, skip it rather than guessing
- If the image is not a wine list, return an empty array

After searching, return ONLY valid JSON matching this schema, with no other text:
{
  "wines": [
    {
      "name": "string",
      "price": "string",
      "vibe": "string",
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
  let userText = "Analyze this wine list and return the structured JSON for every wine you can identify. Use web search to look up each winery.";

  if (!wineTypes.includes("all")) {
    const labels = wineTypes.map((t) => (t === "rose" ? "rosé" : t));
    userText = `Analyze this wine list and return the structured JSON for ONLY the ${labels.join(" and ")} wines. Skip all other wine types. Use web search to look up each winery.`;
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
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

  // With web search, there are many content blocks — find the last text block
  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );
  const lastText = textBlocks[textBlocks.length - 1];
  if (!lastText) {
    throw new Error("No text response from Claude");
  }

  // Extract JSON from the response (handle markdown code blocks)
  let jsonStr = lastText.text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);
  return parsed.wines as Wine[];
}
