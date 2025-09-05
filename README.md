# Slack Query Agent

An intelligent Agentuity agent that searches through your Slack conversation history to find and summarize relevant information based on natural language queries. Features advanced thread management and persistent memory for contextual conversations.

## What it Does

The Slack Query Agent helps you quickly find information from your Slack workspace!

## Core Features

### Thread-Based Conversations

- **Persistent Sessions**: Each thread maintains its own conversation history and context
- **Thread Switching**: Easily switch between different conversation topics
- **Memory Isolation**: Each thread has independent memory for focused discussions

### Memory Layer

The agent uses Zep Cloud for sophisticated memory management:

- **User Context**: Maintains long-term context about your preferences and past interactions
- **Thread History**: Preserves full conversation history within each thread
- **Contextual Responses**: Uses memory to provide more relevant and personalized search results

### Search Method

1. **Query Enhancement**: Combines your query with relevant context from previous conversations
2. **Channel Selection**: Analyzes channel names, purposes, and topics to select 1-3 most relevant channels
3. **Date Processing**: Converts natural language dates to precise Unix timestamps with smart defaults (30 days if unspecified)
4. **Message Scoring**: Evaluates up to 50 messages per channel and returns top 5 most relevant ones
5. **Response Generation**: Creates comprehensive summaries with Slack URLs and user mentions

## How to Use

### Basic Queries

Simply ask natural language questions about your Slack conversations:

- "Find discussions about the quarterly planning meeting"
- "Search for messages about API integration issues in the #engineering channel"
- "What did we decide about the new feature last week?"
- "Show me recent conversations about deployment problems"

### Thread Management Commands

Use special commands to manage conversation threads:

- `~thread -c`: Create a new conversation thread
- `~thread -l`: List all your threads
- `~thread -s <thread-id>`: Switch to a specific thread
- `~help`: Show available commands

## Setup

## Prequisites

- Install Agentuity: `curl -fsS https://agentuity.sh | sh`
- Register for a Composio account and set up Slack connection.
- Register for a Zep account and create a project.
- Create a Slack App and connect it to the `slackbot` agent, listening for `app_mention` event.

### Required Environment Variables

- `COMPOSIO_API_KEY` - For Slack API integration via Composio. This is used for READING the channels.
- `ZEP_API_KEY` - For memory and context storage.
- `SLACKBOT_USER_OAUTH_TOKEN` - This is for sending a message on behalf of the bot.
- `AGENTUITY_SDK_KEY` - For the Agentuity agent framework (auto generated when creating/importing a project).

### Testing

```bash
agentuity dev
```

## Architecture

The `query-agent` follows a modular architecture:

- `index.ts` - Main agent entry point and request handler
- `threads.ts` - Thread management and command processing
- `memory.ts` - Zep Cloud integration for context and history
- `helpers.ts` - Date parsing and utility functions

The `slackbot` "agent" handles incoming messages and calls the `query-agent` to handle them.

- Also handles Slack challenge for verification.
