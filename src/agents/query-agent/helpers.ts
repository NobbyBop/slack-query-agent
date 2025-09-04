import OpenAI from "openai";

const openai = new OpenAI();

export type AgentInput = {
  userId: string;
  userQuery: string;
};

export async function extractDateStrings(
  searchInstructions: string,
  todayDateString: string
): Promise<{ startDate: string; endDate: string }> {
  const result = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert at extracting date ranges from search instructions. Given today's date and search instructions, determine the appropriate date range and return it in MM/DD/YYYY format.

          Rules:
          - If user mentions "last week", "yesterday", "5 days ago", etc., calculate from today
          - If user mentions specific dates like "January 2024", "last February", use those
          - If user mentions "recent" or "latest", use past 7 days
          - If NO date range specified, default to 30 days ago
          - Always return both startDate and endDate in MM/DD/YYYY format
          
          Return ONLY a JSON object: {"startDate": "MM/DD/YYYY", "endDate": "MM/DD/YYYY"}
          
          **CRITICAL: Your response must parse with JSON.parse(). Do not add any text or wrap your response.**`,
      },
      {
        role: "user",
        content: `Today's date: ${todayDateString}
          Search instructions: "${searchInstructions}"
          
          Extract the date range:`,
      },
    ],
  });

  const responseText =
    result.choices[0]?.message.content ||
    '{"startDate": "12/03/2024", "endDate": "01/02/2025"}';

  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    // Fallback to 30 days ago if parsing fails
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      startDate: `${String(thirtyDaysAgo.getMonth() + 1).padStart(
        2,
        "0"
      )}/${String(thirtyDaysAgo.getDate()).padStart(
        2,
        "0"
      )}/${thirtyDaysAgo.getFullYear()}`,
      endDate: `${String(today.getMonth() + 1).padStart(2, "0")}/${String(
        today.getDate()
      ).padStart(2, "0")}/${today.getFullYear()}`,
    };
  }
}

export function convertToUnixTimestamps(dateStrings: {
  startDate: string;
  endDate: string;
}): { oldest: number; latest: number; limit: number } {
  const startDate = new Date(dateStrings.startDate);
  const endDate = new Date(dateStrings.endDate);

  // Convert to Unix timestamps (seconds, not milliseconds)
  const oldest = Math.floor(startDate.getTime() / 1000);
  const latest = Math.floor(endDate.getTime() / 1000);

  // Calculate appropriate message limit based on date range
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
  );
  const limit = Math.min(Math.max(daysDiff * 5, 50), 200); // 5 messages per day, min 50, max 200

  return { oldest, latest, limit };
}

export function getTodayDateString(): string {
  const today = new Date();
  return `${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}/${String(today.getDate()).padStart(2, "0")}/${today.getFullYear()}`;
}