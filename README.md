# Slack Query Agent

An intelligent Agentuity agent that searches through your Slack conversation history to find and summarize relevant information based on natural language queries.

## What it does

The Slack Query Agent helps you quickly find information from your Slack workspace by:

- **Smart Channel Selection**: Automatically identifies the most relevant channels for your query
- **Intelligent Date Parsing**: Understands natural language date references like "last week", "yesterday", "past 2 months"
- **Message Filtering**: Uses AI to find the most relevant messages from conversation history
- **Context-Aware Search**: Remembers your previous interactions using Zep memory to provide personalized results
- **Comprehensive Summaries**: Generates clear, helpful responses with message links and user mentions

## How to use

Simply ask natural language questions about your Slack conversations:

**Examples:**

- "Find discussions about the quarterly planning meeting"
- "Search for messages about API integration issues in the #engineering channel"
- "What did we decide about the new feature last week?"
- "Show me recent conversations about deployment problems"

## Features

### Memory Integration

The agent remembers your previous queries and responses using Zep, allowing it to:

- Provide more personalized search results
- Understand context from past conversations
- Avoid repeating information you've already received

### Advanced Search Processing

1. **Query Analysis**: Converts your natural language query into specific search instructions
2. **Channel Selection**: Identifies 1-3 most relevant channels to search
3. **Date Extraction**: Accurately calculates date ranges from natural language
4. **Message Relevance**: Filters messages to show only the most pertinent information
5. **Smart Summarization**: Generates comprehensive answers with links and mentions

## Setup

Requires the following environment variables:

- `COMPOSIO_API_KEY` - For Slack integration
- `OPENAI_API_KEY` - For AI processing
- `ZEP_API_KEY` - For memory storage

## Technology Stack

- **Agentuity SDK** - Agent framework
- **Composio** - Slack API integration
- **OpenAI GPT-4** - Natural language processing
- **Zep Cloud** - Memory and context management
