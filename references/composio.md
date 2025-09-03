---
title: Executing Tools
image:
  type: url
  value: "https://og.composio.dev/api/og?title=Executing%20Tools"
keywords: ""
subtitle: Learn how to execute Composio's tools with different providers and frameworks
hide-nav-links: false
---

LLMs on their own can only do generation. Tool calling changes that by letting them interact with external services. Instead of just drafting an email, the model can call `GMAIL_SEND_EMAIL` to actually send it. The tool's results feed back to the LLM, closing the loop so it can decide, _act,_ observe, and adapt.

In Composio, every **tool** is a single API action—fully described with schema, parameters, and return type. Tools live inside **toolkits** like _Gmail, Slack, or GitHub_, and Composio handles authentication and user scoping.

<Tip icon="info">
**User Scoping**: All tools are scoped to a specific user - that's why every example includes a `user_id`. Each user must authenticate with their respective services (Gmail, Calendar, etc.) before executing tools. [Learn more about authentication →](./authenticating-tools)
</Tip>

## Using Chat Completions

With providers like _OpenAI_, _Anthropic_, and _Google AI_, use the Composio SDK to execute tool calls easily. To learn how to setup these providers, see [Providers](/providers/openai).

<CodeGroup>
```python Python {32-33} title="Python (OpenAI)" maxLines=40 
from composio import Composio
from composio_openai import OpenAIProvider
from openai import OpenAI
from datetime import datetime

# Use a unique identifier for each user in your application

user_id = "user-k7334"

# Create composio client

composio = Composio(provider=OpenAIProvider(), api_key="your_composio_api_key")

# Create openai client

openai = OpenAI()

# Get calendar tools for this user

tools = composio.tools.get(
user_id=user_id,
tools=["GOOGLECALENDAR_EVENTS_LIST"]
)

# Ask the LLM to check calendar

result = openai.chat.completions.create(
model="gpt-4o-mini",
tools=tools,
messages=[
{"role": "system", "content": "You are a helpful assistant."},
{"role": "user", "content": f"What's on my calendar for the next 7 days. Its {datetime.now().strftime("%Y-%m-%d")} today.",}
]
)

# Handle tool calls

result = composio.provider.handle_tool_calls(user_id=user_id, response=result)
print(result)

````
```typescript TypeScript {37-38} title="TypeScript (Anthropic)" maxLines=40
import { Composio } from '@composio/core';
import { AnthropicProvider } from '@composio/anthropic';
import { Anthropic } from '@anthropic-ai/sdk';

// Use a unique identifier for each user in your application
const userId = 'user-k7334';

// Create anthropic client
const anthropic = new Anthropic();

// Create Composio client
const composio = new Composio({
  apiKey: "your-composio-api-key",
  provider: new AnthropicProvider(),
});

// Get calendar tools for this user
const tools = await composio.tools.get(userId, {
  tools: ['GOOGLECALENDAR_EVENTS_LIST'],
});

const today = new Date();

// Ask the LLM to check calendar
const msg = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  tools: tools,
  messages: [
    {
      role: 'user',
      content: `What's on my calendar for the next 7 days starting today:${today.toLocaleDateString()}?`,
    },
  ],
  max_tokens: 1024,
});

// Handle tool calls
const result = await composio.provider.handleToolCalls(userId, msg);
console.log('Results:', JSON.stringify(result, null, 2));

````

</CodeGroup>

## Using Agentic Frameworks

Agentic frameworks automatically handle the tool execution loop.
Composio provides support for frameworks like this by making sure the tools are formatted into the correct objects for the agentic framework to execute.

<CodeGroup>
```python Python {19-23} title="Python (OpenAI Agents SDK)" maxLines=40 
import asyncio
from agents import Agent, Runner
from composio import Composio
from composio_openai_agents import OpenAIAgentsProvider

# Use a unique identifier for each user in your application

user_id = "user-k7334"

# Initialize Composio toolset

composio = Composio(provider=OpenAIAgentsProvider(), api_key="your_composio_api_key")

# Get all tools for the user

tools = composio.tools.get(
user_id=user_id,
toolkits=["COMPOSIO_SEARCH"],
)

# Create an agent with the tools

agent = Agent(
name="Deep Researcher",
instructions="You are an investigative journalist.",
tools=tools,
)

async def main():
result = await Runner.run(
starting_agent=agent,
input=("Do a thorough DEEP research on Golden Gate Bridge"),
)
print(result.final_output)

# Run the agent

asyncio.run(main())

````
```typescript TypeScript {22-31} title="TypeScript (Anthropic)" maxLines=40
import { Composio } from '@composio/core';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { VercelProvider } from '@composio/vercel';

// Use a unique identifier for each user in your application
const userId = 'user-k7334';

// Initialize Composio toolset
const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new VercelProvider(),
});

// Get all tools for the user
const tools = await composio.tools.get(userId, {
  toolkits: ['HACKERNEWS_GET_LATEST_POSTS'],
  limit: 10,
});

// Generate a deep research on hackernews
const { text } = await generateText({
  model: anthropic('claude-sonnet-4-20250514'),
  messages: [
    {
      role: 'user',
      content: 'Do a thorough DEEP research on the top articles on Hacker News about Composio',
    },
  ],
  tools,
});

console.log(text);

````

</CodeGroup>

## Direct Tool execution

In case you just want to call a tool without using any framework or LLM provider, you can use the `execute` method directly.
<Tip icon="lightbulb">
**Finding tool arguments**: Visit [Composio Toolkits](https://platform.composio.dev?next_page=/marketplace) → Select your toolkit -> Select tool to see its required and optional parameters, types, and descriptions.
</Tip>
<CodeGroup>

```python Python title="Python" maxLines=40
from composio import Composio

user_id = "user-k7334"
composio = Composio(api_key="your_composio_key")

# Find available arguments for any tool in the Composio dashboard
result = composio.tools.execute(
    "GITHUB_LIST_STARGAZERS",
    user_id=user_id,
    arguments={"owner": "ComposioHQ", "repo": "composio", "page": 1, "per_page": 5}
)
print(result)
```

```typescript TypeScript title="TypeScript" maxLines=40
import { Composio } from "@composio/core";

const userId = "user-k7334";
const composio = new Composio({ apiKey: "your_composio_key" });

// Find available arguments for any tool in the Composio dashboard
const result = await composio.tools.execute("GITHUB_LIST_STARGAZERS", {
  userId,
  arguments: {
    owner: "ComposioHQ",
    repo: "composio",
    page: 1,
    per_page: 5,
  },
});
console.log("✅ GitHub stargazers:", JSON.stringify(result, null, 2));
```

</CodeGroup>

### Proxy Execute -- Manually calling toolkit APIs

You can also proxy requests to an API of any supported toolkit. This is useful when you want to manually call an API of a toolkit and inject the authentication state from Composio.

<CodeGroup>
```python Python maxLines=60 wordWrap
response = composio.tools.proxy(
    endpoint="/repos/composiohq/composio/issues/1",
    method="GET",
    connected_account_id="ac_1234",  # use connected account for github
    parameters=[
        {
            "name": "Accept",
            "value": "application/vnd.github.v3+json",
            "type": "header",
        },
    ],
)
```
```typescript TypeScript maxLines=60 wordWrap
// Send a custom request to a toolkit
const { data } = await composio.tools.proxyExecute({
  toolkitSlug: 'github',
  userId: 'user@example.com',
  data: {
    endpoint: '/repos/owner/repo/issues',
    method: 'GET'
  }
});
console.log(data);
```
</CodeGroup>

If you're interested in extending toolkits and creating custom tools, see [Custom tools](/docs/custom-tools).

## Automatic File Handling

Composio SDK includes automatic file handling for tools that work with files. When enabled (default), the SDK automatically handles file uploads and downloads during tool execution.

### File Upload

When a tool accepts file inputs (marked with `file_uploadable: true`), you can pass local file paths or URLs or a `File` object. Here's an example using Google Drive upload:

<CodeGroup>
```python Python maxLines=60 wordWrap
import os

from composio import Composio

composio = Composio()

# Upload a local file to Google Drive

result = composio.tools.execute(
"GOOGLEDRIVE_UPLOAD_FILE",
user_id="default",
arguments={
"file_to_upload": os.path.join(os.getcwd(), "document.pdf") # Local file path
}
)

print(result.data) # Contains Google Drive file details

````

```typescript TypeScript maxLines=60 wordWrap
import { Composio } from '@composio/core';
import path from 'path';

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY
});

// Upload a local file to Google Drive
const result = await composio.tools.execute('GOOGLEDRIVE_UPLOAD_FILE', {
  userId: 'default',
  arguments: {
    file_to_upload: path.join(__dirname, 'document.pdf')  // Local file path or URL or File object
  }
});

console.log(result.data);  // Contains Google Drive file details
````

</CodeGroup>

The SDK automatically:

1. Reads the file content
2. Uploads it to secure storage
3. Passes the file metadata to the tool

### File Download

When a tool returns file outputs, the SDK automatically:

1. Downloads the file to a local temporary directory
2. Provides the local file path in the response

<CodeGroup>
```python Python maxLines=60 wordWrap
# Download a file from Google Drive
result = composio.tools.execute(
    "GOOGLEDRIVE_DOWNLOAD_FILE",
    user_id="default",
    arguments={
        "file_id": "your_file_id"
    }
)

# Result includes local file path

print(result.data["file"]) # "/path/to/downloaded/file.pdf"

````

```typescript TypeScript maxLines=60 wordWrap
// Download a file from Google Drive
const result = await composio.tools.execute('GOOGLEDRIVE_DOWNLOAD_FILE', {
  userId: 'default',
  arguments: {
    file_id: 'your_file_id'
  }
});

// Result includes local file path
console.log(result.data.file.uri);  // "/path/to/downloaded/file.pdf"
````

</CodeGroup>

### Disabling Auto File Handling

You can disable automatic file handling when initializing the Typescript SDK:

<CodeGroup>
```typescript TypeScript maxLines=60 wordWrap
const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  autoUploadDownloadFiles: false
});

// Now you need to handle files manually using composio.files API
const fileData = await composio.files.upload({
filePath: path.join(\_\_dirname, 'document.pdf'),
toolSlug: 'GOOGLEDRIVE_UPLOAD_FILE',
toolkitSlug: 'googledrive'
});

```
</CodeGroup>

For more details on file handling, see [Auto Upload and Download Files](/docs/advanced/auto-upload-download).
```
