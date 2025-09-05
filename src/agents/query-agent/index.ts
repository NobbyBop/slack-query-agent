import type { AgentContext, AgentRequest, AgentResponse } from "@agentuity/sdk";
import OpenAI from "openai";
import { Composio } from "@composio/core";
import { OpenAIProvider } from "@composio/openai";
import { getMemoryContext, getThreadHistory, storeMemory } from "./memory";
import { handleCommand } from "./threads";
import {
  extractDateStrings,
  convertToUnixTimestamps,
  getTodayDateString,
} from "./helpers";
import type { AgentInput } from "./helpers";

const openai = new OpenAI();

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new OpenAIProvider(),
});

export const welcome = () => {
  return {
    welcome:
      "Welcome to the Slack Query Agent! I can search through your Slack conversation history to find relevant information.",
    prompts: [
      {
        data: JSON.stringify({
          userId: "dog",
          userQuery: "Find discussions about the quarterly planning meeting",
        }),
        contentType: "application/json",
      },
      {
        data: JSON.stringify({
          userId: "dog",
          userQuery:
            "Search for messages about API integration issues in the #engineering channel",
        }),
        contentType: "application/json",
      },
    ],
  };
};

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  const requestData = (await req.data.json()) as AgentInput;
  const userId = requestData.userId || "dog";
  const userQuery = requestData.userQuery || "";

  if (userQuery.startsWith("~")) {
    let textResult = await handleCommand(userId, userQuery, ctx);
    return resp.text(textResult);
  }
  ctx.logger.info("Processing Slack query:", userQuery);

  // Get memory context for this user
  const memoryContext = await getMemoryContext(userId, userQuery, ctx);
  const threadHistory = await getThreadHistory(userId, ctx);

  // Convert user's query and Zep context into search instructions.
  const searchInstructions = await generateSearchInstructions(
    userQuery,
    memoryContext || "",
    threadHistory,
    ctx
  );

  // Use search instructions to select relevant channels.
  const relevantChannels = await selectRelevantChannels(
    "dog",
    searchInstructions,
    ctx
  );

  if (relevantChannels.length === 0) {
    return resp.text("No relevant channels found for your query.");
  }

  // Search each channel for relevant messages.
  const searchResults = [];
  for (const channel of relevantChannels) {
    ctx.logger.info(`Searching in channel: ${channel.name}`);
    const messages = await searchChannelHistory(
      "dog",
      channel,
      searchInstructions,
      ctx
    );
    searchResults.push({
      channel_name: channel.name,
      channel_id: channel.id,
      messages: messages,
    });
  }

  // Finally, generate the summary message for the user.
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert at summarizing Slack messages to answer a user's query. 
          
          You will be given:
          1. A user query
          2. Context about the user.
          3. YOUR CONVERSATION HISTORY WITH THE USER.
          4. Search results from multiple Slack channels containing relevant messages
          
          The search results have this structure:
          - Array of channels, each containing:
            - channel_name: The Slack channel name
            - channel_id: The channel ID
            - messages: Array of relevant messages from that channel
          
          Each message contains:
          - text: The message content
          - ts: Timestamp of the message
          - user: User ID who sent the message (may be undefined for bot messages)
          - attachments: Array of attachments with title and original_url
          
          Your task: Generate a clear, helpful response to answer the user's question based on these messages.
          Do your best to provide a useful answer, but you can ask the user to be more specific if the messages don't contain relevant information.

          **BONUS 1**: If you reference specific messages, you can include message URLs using this format:
          https://agentuity.slack.com/archives/<channel_id>/<message_ts>

          **BONUS 2**: If you reference specific messages, you can tag someone by using arrow brackets in your response 
          Ex: <@message.user>

          Respond ONLY with the text response to the user's query.`,
      },
      {
        role: "user",
        content: `1. User query: "${userQuery}"
        
        2. Previous context about User from memory: ${memoryContext}

        3. Conversation History with User: ${JSON.stringify(threadHistory)}
        
        4. Relevant Slack Messages: ${JSON.stringify(searchResults)}`,
      },
    ],
  });

  const finalResponse =
    response.choices[0]?.message.content || "Failed to generate a response.";

  // Store the interaction in memory
  await storeMemory(userId, userQuery, finalResponse, ctx);

  return resp.text(finalResponse);
}

// Generate specific search instructions based on user query and memory context
async function generateSearchInstructions(
  userQuery: string,
  memoryContext: string,
  threadHistory: any,
  ctx: AgentContext
): Promise<string> {
  const result = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert at converting user queries into specific, actionable search instructions for finding information in Slack conversations.

          Given a user's natural language query and their previous context/memory, create clear, specific search instructions that will help find the most relevant information.
          You should not fabricate information. Your only goal is to add any relevant context to a query so the user does not have to repeat their preferences or desires.
          If the context is empty, just convert the question to a statement like "Find all..." or something similar.

          Return ONLY the search instructions as plain text, no additional formatting or explanation.`,
      },
      {
        role: "user",
        content: `User query: "${userQuery}"
        
        User's previous context: ${memoryContext}
        
        Conversation History with User: ${JSON.stringify(threadHistory)}`,
      },
    ],
  });

  const searchInstructions = result.choices[0]?.message.content || userQuery;

  ctx.logger.info("Generated search instructions:", searchInstructions);

  return searchInstructions;
}

// Gets the relevant channels based on the user's query
// Uses channel name and description.
async function selectRelevantChannels(
  userId: string,
  searchInstructions: string,
  ctx: AgentContext
) {
  // Get all channels directly
  const channelsResponse = await composio.tools.execute(
    "SLACK_LIST_ALL_CHANNELS",
    {
      userId,
      arguments: {
        limit: 100,
      },
    }
  );

  const allChannels = (channelsResponse?.data?.channels as any[]) || [];

  ctx.logger.info(`Found ${allChannels.length} total channels`);

  if (allChannels.length <= 0) {
    throw new Error("Could not find any channels.");
  }

  // Use LLM to select relevant channels based on user query
  const selectionResult = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert at analyzing search instructions and selecting relevant Slack channels. 
          
          Given search instructions and list of channels, select the most relevant channels where the answer is likely to be found.
          
          Consider:
          - Channel names and their relevance to the query topic
          - Channel purposes/topics if available
          - If user mentions specific channels, include those
          - If user mentions dates, consider all relevant channels for that timeframe
          - Select 1-3 channels maximum to avoid overwhelming searches
          - If the user mentions that they are looking in a specific channel, only include that one.
          
          Respond with a JSON array of channel objects: [{"id": "C123", "name": "general", "reason": "why this channel is relevant"}]
          
          **CRITICAL: Your response must parse with JSON.parse(). Do not add any text or wrap your response in \`\`\`json.**`,
      },
      {
        role: "user",
        content: `Search instructions: "${searchInstructions}"
          
          Available channels: ${JSON.stringify(
            allChannels.map((ch: any) => ({
              id: ch.id,
              name: ch.name,
              purpose: ch.purpose?.value,
              topic: ch.topic?.value,
            })),
            null,
            2
          )}
          
          Select the most relevant channels for this query:`,
      },
    ],
  });

  const selectionText = selectionResult.choices[0]?.message.content || "[]";

  try {
    const selectedChannels = JSON.parse(selectionText);
    ctx.logger.info(
      `Selected ${selectedChannels.length} relevant channels:`,
      selectedChannels.map((ch: any) => ch.name)
    );

    return selectedChannels.map((ch: any) => ({
      id: ch.id,
      name: ch.name,
      purpose: ch.purpose,
      topic: ch.topic,
    }));
  } catch (parseError) {
    ctx.logger.error(
      "Error parsing channel selection response, using first 3 channels"
    );
    return allChannels.slice(0, 3).map((ch: any) => ({
      id: ch.id,
      name: ch.name,
      purpose: ch.purpose?.value,
      topic: ch.topic?.value,
    }));
  }
}

// Looks for relevant messages in a channel based on user's query.
async function searchChannelHistory(
  userId: string,
  channel: any,
  searchInstructions: string,
  ctx: AgentContext
) {
  // Extract date range from user query
  const todayString = getTodayDateString();

  const dateStrings = await extractDateStrings(searchInstructions, todayString);
  const { oldest, latest, limit } = convertToUnixTimestamps(dateStrings);

  ctx.logger.info(
    `Searching ${channel.name} from ${dateStrings.startDate} to ${dateStrings.endDate} (${oldest} to ${latest})`
  );

  // Fetch conversation history with calculated timestamps
  const historyResponse = await composio.tools.execute(
    "SLACK_FETCH_CONVERSATION_HISTORY",
    {
      userId,
      arguments: {
        channel: channel.id,
        oldest: oldest.toString(),
        latest: latest.toString(),
        limit: limit,
      },
    }
  );

  const rawMessages = (historyResponse as any)?.data?.messages || [];
  const messages = rawMessages.map((msg: any) => ({
    text: msg.text,
    ts: msg.ts,
    user: msg.user,
    attachments:
      msg.attachments?.map((att: any) => ({
        title: att.title,
        original_url: att.original_url,
      })) || [],
  }));

  ctx.logger.info(`Found ${messages.length} messages in ${channel.name}`);

  if (messages.length === 0) {
    return [];
  }

  // Filter relevant messages using LLM
  const relevanceResult = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert at finding relevant messages in Slack conversations.
          
          Given search instructions and numbered channel messages, identify the most relevant messages that answer or relate to the search criteria.
          
          Return a JSON array of message indices (numbers) for the most relevant messages.
          Only include indices of messages that are directly relevant to the search instructions.
          Limit to top 5 most relevant messages.
          
          Example: [0, 3, 7, 12, 15]
          
          **CRITICAL: Your response must parse with JSON.parse(). Do not add any text or wrap your response in \`\`\`json.**`,
      },
      {
        role: "user",
        content: `Search instructions: "${searchInstructions}"
          
          Channel: ${channel.name}
          
          Recent messages (with indices):
          ${messages
            .slice(0, 50)
            .map((msg: any, idx: number) => `${idx}: ${JSON.stringify(msg)}`)
            .join("\n")}
          
          Return the indices of the most relevant messages:`,
      },
    ],
  });

  const relevanceText = relevanceResult.choices[0]?.message.content || "[]";

  try {
    const relevantIndices = JSON.parse(relevanceText);
    const relevantMessages = relevantIndices
      .filter((idx: number) => idx >= 0 && idx < messages.length)
      .map((idx: number) => messages[idx]);

    ctx.logger.info(
      `Found ${relevantMessages.length} relevant messages in ${channel.name}`
    );

    return relevantMessages;
  } catch (parseError) {
    ctx.logger.error("Error parsing message relevance response");
    return [];
  }
}
``;
