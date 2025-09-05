import type { AgentContext } from "@agentuity/sdk";
import { ZepClient } from "@getzep/zep-cloud";
import { v4 as uuid } from "uuid";

const zep = new ZepClient({
  apiKey: process.env.ZEP_API_KEY || "",
});

export async function handleCommand(
  userId: string,
  userQuery: string,
  ctx: AgentContext
): Promise<string> {
  if (userQuery.startsWith("~thread")) {
    const commandString = userQuery.slice("~thread".length).trim();
    let flags: string[] = [];
    let idArg: string = "";

    if (commandString) {
      const parts = commandString.split(/\s+/);
      let i = 0;

      while (i < parts.length) {
        const part = parts[i];

        if (part?.startsWith("-")) {
          // Check if we already have a flag
          if (flags.length > 0) {
            return "Only one flag per run is allowed.";
          }

          // Handle single character flags
          if (part.length === 2) {
            const flag = part[1];

            if (!["c", "l", "s"].includes(flag || "x")) {
              return `Invalid flag: -${flag}. Accepted flags are: -c, -l, -s`;
            }

            if (flag === "s") {
              // -s requires an ID argument
              if (i + 1 >= parts.length) {
                return "Flag -s requires an ID argument.";
              }
              i++; // Move to the ID
              idArg = parts[i] || "";
              if (idArg.startsWith("-")) {
                return "Only one flag per run is allowed.";
              }
              flags.push("s");
            } else {
              flags.push(`-${flag}`);
            }
          } else if (part.length > 2) {
            // Multiple flags in one dash (not allowed)
            return "Multiple flags in one dash not allowed. Use one flag per dash.";
          } else {
            return "Invalid flag format.";
          }
        } else {
          return `Unexpected argument: ${part}`;
        }

        i++;
      }
      if (flags.length === 0) {
        return `~thread <flag>
        -c: start a new thread
        -l: list threads
        -s <id>: switch to thread with id`;
      }

      ctx.logger.info(
        `Flag: ${flags[0]}${idArg !== "" ? `, Arg: ${idArg}` : ""}`
      );

      if (flags[0] === "-c") {
        return await createThread(userId, ctx);
      } else if (flags[0] === "-l") {
        return await listThreads(userId, ctx);
      } else {
        return await switchThreads(userId, idArg, ctx);
      }
    }
  } else if (userQuery.startsWith("~help")) {
    return `~thread <flag>
    -c: start a new thread
    -l: list threads
    -s <id>: switch to thread with id`;
  } else {
    return "Invalid command.";
  }
  return "text";
}

export async function createThread(
  userId: string,
  ctx: AgentContext
): Promise<string> {
  try {
    const threadId = uuid();
    // Create the user in Zep if they don't already exist.
    try {
      let zepUser = await zep.user.get(userId);
    } catch {
      await zep.user.add({ userId });
    }

    await zep.thread.create({
      threadId: threadId,
      userId: userId,
    });

    let dataRes = await ctx.kv.get("slackq-threads", userId);
    let prevThreads: string[];
    if (dataRes.exists) {
      prevThreads = (await dataRes.data.json()) as string[];
      prevThreads.unshift(threadId);
    } else {
      prevThreads = [threadId];
    }
    await ctx.kv.set("slackq-threads", userId, prevThreads);
    await ctx.kv.set("slackq-current-thread", userId, threadId);

    ctx.logger.info(`Created thread: ${threadId} for user: ${userId}`);
    return `Created thread: ${threadId}`;
  } catch (error) {
    ctx.logger.error("Error creating thread:", error);
    return "Error creating thread";
  }
}

export async function listThreads(
  userId: string,
  ctx: AgentContext
): Promise<string> {
  try {
    let dataRes = await ctx.kv.get("slackq-threads", userId);
    if (!dataRes.exists) {
      return "No threads found.";
    }

    const threads = (await dataRes.data.json()) as string[];
    let result = "Threads:\n";
    threads.forEach((threadId, index) => {
      result += `${index + 1}. ${threadId}\n`;
    });

    return result;
  } catch (error) {
    ctx.logger.error("Error listing threads:", error);
    return "Error listing threads";
  }
}

export async function switchThreads(
  userId: string,
  threadId: string,
  ctx: AgentContext
): Promise<string> {
  try {
    let dataRes = await ctx.kv.get("slackq-threads", userId);
    if (!dataRes.exists) {
      return "No threads found. Create a thread first with /thread -c";
    }

    const threads = (await dataRes.data.json()) as string[];
    if (!threads.includes(threadId)) {
      return `Thread ${threadId} not found in your threads.`;
    }

    await ctx.kv.set("slackq-current-thread", userId, threadId);
    ctx.logger.info(`Switched to thread: ${threadId} for user: ${userId}`);
    return `Switched to thread: ${threadId}`;
  } catch (error) {
    ctx.logger.error("Error switching threads:", error);
    return "Error switching threads";
  }
}
