---
title: Quickstart
subtitle: Get up and running with Zep in minutes
slug: quickstart
---

Zep is a context engineering platform that systematically assembles personalized context—user preferences, traits, and business data—for reliable agent applications. Zep combines agent memory, Graph RAG, and context assembly capabilities to deliver comprehensive personalized context that reduces hallucinations and improves accuracy. This quickstart will walk you through Zep's two core capabilities: giving your agent persistent memory of user interactions through Agent Memory, and providing your agent with up-to-date knowledge through Dynamic Graph RAG.

<Tip>
Looking for a more in-depth understanding? Check out our [Key Concepts](/concepts) page.
</Tip>

<Note>
Migrating from Mem0? Check out our [Mem0 Migration](/v3/mem0-to-zep) guide.
</Note>

Make sure to [set up your environment](/install-sdks) before getting started.

## Provide your agent with up-to-date user memory (Agent Memory)

### Create user graph

<Warning>
It is important to provide at least the first name and ideally the last name of the user when calling `user.add`. Otherwise, Zep may not be able to correctly associate the user with references to the user in the data you add. If you don't have this information at the time the user is created, you can add it later with our [update user](/sdk-reference/user/update) method.
</Warning>

<CodeBlocks>

```python Python
# Create a new user
user_id = "user123"
new_user = client.user.add(
    user_id=user_id,
    email="user@example.com",
    first_name="Jane",
    last_name="Smith",
)
```

```typescript TypeScript
// Create a new user
const userId = "user123";
const user = await client.user.add({
  userId: userId,
  email: "user@example.com",
  firstName: "Jane",
  lastName: "Smith",
});
```

```go Go
import (
    "context"
    v3 "github.com/getzep/zep-go/v3"
    zepclient "github.com/getzep/zep-go/v3/client"
)

// Create a new user
userId := "user123"
email := "user@example.com"
firstName := "Jane"
lastName := "Smith"

user, err := client.User.Add(context.TODO(), &v3.CreateUserRequest{
    UserID:    userId,
    Email:     &email,
    FirstName: &firstName,
    LastName:  &lastName,
})
if err != nil {
    log.Fatal("Error creating user:", err)
}

fmt.Println("User created:", user)
```

</CodeBlocks>

### Create thread

<CodeBlocks>

```python Python
import uuid

# Generate a unique thread ID
thread_id = uuid.uuid4().hex

# Create a new thread for the user
client.thread.create(
    thread_id=thread_id,
    user_id=user_id,
)
```

```typescript TypeScript
import { v4 as uuid } from "uuid";

// Generate a unique thread ID
const threadId = uuid();

// Create a new thread for the user
await client.thread.create({
  threadId: threadId,
  userId: userId,
});
```

```go Go
import (
    "context"
    v3 "github.com/getzep/zep-go/v3"
    zepclient "github.com/getzep/zep-go/v3/client"
)

// Generate a unique thread ID
threadId := uuid.New().String()
// Create a new thread for the user
thread, err := client.Thread.Create(context.TODO(), &v3.CreateThreadRequest{
    ThreadID: threadId,
    UserID:   userId,
})
if err != nil {
    log.Fatal("Error creating thread:", err)
}

fmt.Println("Thread created:", thread)
```

</CodeBlocks>

### Add messages

Add chat messages to a thread using the `thread.add_messages` method. These messages will be stored in the thread history and used to build the user's knowledge graph.

<Warning>
It is important to provide the name of the user in the name field if possible, to help with graph construction. It's also helpful to provide a meaningful name for the assistant in its name field.
</Warning>

<CodeBlocks>

```python Python
# Define messages to add
from zep_cloud.types import Message

messages = [
    Message(
        name="Jane",
        content="Hi, my name is Jane Smith and I work at Acme Corp.",
        role="user",
    ),
    Message(
        name="AI Assistant",
        content="Hello Jane! Nice to meet you. How can I help you with Acme Corp today?",
        role="assistant",
    )
]

# Add messages to the thread
client.thread.add_messages(thread_id, messages=messages)
```

```typescript TypeScript
// Define messages to add
import type { Message } from "@getzep/zep-cloud/api";

const messages: Message[] = [
  {
    name: "Jane",
    content: "Hi, my name is Jane Smith and I work at Acme Corp.",
    role: "user",
  },
  {
    name: "AI Assistant",
    content:
      "Hello Jane! Nice to meet you. How can I help you with Acme Corp today?",
    role: "assistant",
  },
];

// Add messages to the thread
await client.thread.addMessages(threadId, { messages });
```

```go Go
import (
    "context"
    v3 "github.com/getzep/zep-go/v3"
)

// Define messages to add
userName := "Jane"
assistantName := "AI Assistant"
messages := []*v3.Message{
{
    Name:    &userName,
    Content: "Hi, my name is Jane Smith and I work at Acme Corp.",
    Role:    "user",
},
{
    Name:    &assistantName,
    Content: "Hello Jane! Nice to meet you. How can I help you with Acme Corp today?",
    Role:    "assistant",
},
}

// Add messages to the thread
_, err = client.Thread.AddMessages(
    context.TODO(),
    threadId,
    &v3.AddThreadMessagesRequest{
        Messages: messages,
    },
)
if err != nil {
    log.Fatal("Error adding messages:", err)
}
```

</CodeBlocks>

### Add business data (Optional)

You can add business data directly to a user's graph using the `graph.add` method. This data can be in the form of messages, text, or JSON.

<CodeBlocks>

```python Python
# Add JSON data to a user's graph
import json
json_data = {
    "employee": {
        "name": "Jane Smith",
        "position": "Senior Software Engineer",
        "department": "Engineering",
        "projects": ["Project Alpha", "Project Beta"]
    }
}
client.graph.add(
    user_id=user_id,
    type="json",
    data=json.dumps(json_data)
)

# Add text data to a user's graph
client.graph.add(
    user_id=user_id,
    type="text",
    data="Jane Smith is working on Project Alpha and Project Beta."
)
```

```typescript TypeScript
// Add JSON data to a user's graph
const jsonData = {
  employee: {
    name: "Jane Smith",
    position: "Senior Software Engineer",
    department: "Engineering",
    projects: ["Project Alpha", "Project Beta"],
  },
};
await client.graph.add({
  userId: userId,
  type: "json",
  data: JSON.stringify(jsonData),
});

// Add text data to a user's graph
await client.graph.add({
  userId: userId,
  type: "text",
  data: "Jane Smith is working on Project Alpha and Project Beta.",
});
```

```go Go
import (
    "context"
    "encoding/json"
    v3 "github.com/getzep/zep-go/v3"
)

// Add JSON data to a user's graph
type Employee struct {
    Name       string   `json:"name"`
    Position   string   `json:"position"`
    Department string   `json:"department"`
    Projects   []string `json:"projects"`
}
jsonData := map[string]Employee{
    "employee": {
        Name:       "Jane Smith",
        Position:   "Senior Software Engineer",
        Department: "Engineering",
        Projects:   []string{"Project Alpha", "Project Beta"},
    },
}
jsonBytes, err := json.Marshal(jsonData)
if err != nil {
    log.Fatal("Error marshaling JSON data:", err)
}
jsonString := string(jsonBytes)
_, err = client.Graph.Add(context.TODO(), &v3.AddDataRequest{
    UserID: &userId,
    Type:   v3.GraphDataTypeJSON,
    Data:   jsonString,
})
if err != nil {
    log.Fatal("Error adding JSON data:", err)
}
// Add text data to a user's graph
userData := "Jane Smith is working on Project Alpha and Project Beta."
_, err = client.Graph.Add(context.TODO(), &v3.AddDataRequest{
    UserID: &userId,
    Type:   v3.GraphDataTypeText,
    Data:   userData,
})
if err != nil {
    log.Fatal("Error adding user data:", err)
}

```

</CodeBlocks>

### Retrieve context

Use the `thread.get_user_context` method to retrieve relevant context for a thread. This includes a context block with facts and entities that can be used in your prompt.

Zep's context block can either be in summarized or basic form (summarized by default). Retrieving basic results reduces latency (P95 < 200 ms). Read more about Zep's context block [here](/retrieving-memory#retrieving-zeps-context-block).

<Tabs>
<Tab title="Summary (default)">
<CodeBlocks>

```python Python
# Get memory for the thread
memory = client.thread.get_user_context(thread_id=thread_id)

# Access the context block (for use in prompts)
context_block = memory.context
print(context_block)
```

```typescript TypeScript
// Get memory for the thread
const memory = await client.thread.getUserContext(threadId);

// Access the context block (for use in prompts)
const contextBlock = memory.context;
console.log(contextBlock);
```

```go Go
import (
    "context"
    v3 "github.com/getzep/zep-go/v3"
)

// Get memory for the thread
memory, err := client.Thread.GetUserContext(context.TODO(), threadId, nil)
if err != nil {
    log.Fatal("Error getting memory:", err)
}
// Access the context block (for use in prompts)
contextBlock := memory.Context
fmt.Println(contextBlock)
```

</CodeBlocks>

```text
- On 2024-07-30, account Emily0e62 made a failed transaction of $99.99.
- The transaction failed due to the card with last four digits 1234.
- The failure reason was 'Card expired' as of 2024-09-15.
- Emily0e62 is a user account belonging to Emily Painter.
- On 2024-11-14, user account Emily0e62 was suspended due to payment failure.
- Since 2024-11-14, Emily Painter (Emily0e62) has experienced issues with logging in.
- As of the present, account Emily0e62 remains suspended and Emily continues to face login issues due to unresolved payment failure from an expired card.
```

</Tab>
<Tab title="Basic (fast)">
<CodeBlocks>

```python Python
# Get memory for the thread
memory = client.thread.get_user_context(thread_id=thread_id, mode="basic")

# Access the context block (for use in prompts)
context_block = memory.context
print(context_block)
```

```typescript TypeScript
// Get memory for the thread
const memory = await client.thread.getUserContext(threadId, { mode: "basic" });

// Access the context block (for use in prompts)
const contextBlock = memory.context;
console.log(contextBlock);
```

```go Go
import (
    "context"
    v3 "github.com/getzep/zep-go/v3"
)

mode := "basic"
// Get memory for the thread
memory, err := client.Thread.GetUserContext(context.TODO(), threadId, &v3.ThreadGetUserContextRequest{
    Mode: &mode,
})
if err != nil {
    log.Fatal("Error getting memory:", err)
}
// Access the context block (for use in prompts)
contextBlock := memory.Context
fmt.Println(contextBlock)
```

</CodeBlocks>

```text
FACTS and ENTITIES represent relevant context to the current conversation.

# These are the most relevant facts and their valid date ranges

# format: FACT (Date range: from - to)

<FACTS>
  - Emily is experiencing issues with logging in. (2024-11-14 02:13:19+00:00 -
    present)
  - User account Emily0e62 has a suspended status due to payment failure.
    (2024-11-14 02:03:58+00:00 - present)
  - user has the id of Emily0e62 (2024-11-14 02:03:54 - present)
  - The failed transaction used a card with last four digits 1234. (2024-09-15
    00:00:00+00:00 - present)
  - The reason for the transaction failure was 'Card expired'. (2024-09-15
    00:00:00+00:00 - present)
  - user has the name of Emily Painter (2024-11-14 02:03:54 - present)
  - Account Emily0e62 made a failed transaction of 99.99. (2024-07-30
    00:00:00+00:00 - 2024-08-30 00:00:00+00:00)
</FACTS>

# These are the most relevant entities

# ENTITY_NAME: entity summary

<ENTITIES>
  - Emily0e62: Emily0e62 is a user account associated with a transaction,
    currently suspended due to payment failure, and is also experiencing issues
    with logging in.
  - Card expired: The node represents the reason for the transaction failure,
    which is indicated as 'Card expired'.
  - Magic Pen Tool: The tool being used by the user that is malfunctioning.
  - User: user
  - Support Agent: Support agent responding to the user's bug report.
  - SupportBot: SupportBot is the virtual assistant providing support to the user,
    Emily, identified as SupportBot.
  - Emily Painter: Emily is a user reporting a bug with the magic pen tool,
    similar to Emily Painter, who is expressing frustration with the AI art
    generation tool and seeking assistance regarding issues with the PaintWiz app.
</ENTITIES>
```

</Tab>
</Tabs>

You can also directly [search the user graph](/searching-the-graph) and [assemble the context block](/cookbook/customize-your-context-block) for more customized results.

### View your knowledge graph

Since you've created memory, you can view your knowledge graph by navigating to [the Zep Dashboard](https://app.getzep.com/), then Users > "user123" > View Graph. You can also click the "View Episodes" button to see when data is finished being added to the knowledge graph.

### Explore further

Refer to our [agent memory walk-through](/walkthrough) for a more complete example.

## Provide your agent with up-to-date knowledge (Dynamic Graph RAG)

### Create graph

<CodeBlocks>

```python Python
graph = client.graph.create(
    graph_id="some-graph-id",
    name="Graph Name",
    description="This is a description."
)
```

```typescript TypeScript
const graph = await client.graph.create({
  graphId: "some-graph-id",
  name: "Graph Name",
  description: "This is a description.",
});
```

```go Go
import (
    "context"
    "github.com/getzep/zep-go/v3"
)

name := "Graph Name"
description := "This is a description."

graph, err := client.Graph.Create(context.TODO(), &v3.CreateGraphRequest{
    GraphID:     "some-graph-id",
    Name:        &name,
    Description: &description,
})
if err != nil {
    log.Fatal("Error creating graph:", err)
}

fmt.Println("Graph created:", graph)
```

</CodeBlocks>

### Add data

You can add business data directly to a graph using the `graph.add` method. This data can be in the form of text or JSON.

<CodeBlocks>

```python Python
# Add JSON data to a graph
import json
json_data = {
    "employee": {
        "name": "Jane Smith",
        "position": "Senior Software Engineer",
        "department": "Engineering",
        "projects": ["Project Alpha", "Project Beta"]
    }
}
graph_id = "engineering_team"
client.graph.add(
    graph_id=graph_id,
    type="json",
    data=json.dumps(json_data)
)

# Add text data to a graph
client.graph.add(
    graph_id=graph_id,
    type="text",
    data="The engineering team is working on Project Alpha and Project Beta."
)
```

```typescript TypeScript
// Add JSON data to a graph
const jsonData = {
  employee: {
    name: "Jane Smith",
    position: "Senior Software Engineer",
    department: "Engineering",
    projects: ["Project Alpha", "Project Beta"],
  },
};
const graphId = "engineering_team";
await client.graph.add({
  graphId: graphId,
  type: "json",
  data: JSON.stringify(jsonData),
});

// Add text data to a graph
await client.graph.add({
  graphId: graphId,
  type: "text",
  data: "The engineering team is working on Project Alpha and Project Beta.",
});
```

```go Go
import (
    "context"
    "encoding/json"
    v3 "github.com/getzep/zep-go/v3"
)

// Add JSON data to a graph
type Employee struct {
    Name       string   `json:"name"`
    Position   string   `json:"position"`
    Department string   `json:"department"`
    Projects   []string `json:"projects"`
}
jsonData := map[string]Employee{
    "employee": {
        Name:       "Jane Smith",
        Position:   "Senior Software Engineer",
        Department: "Engineering",
        Projects:   []string{"Project Alpha", "Project Beta"},
    },
}
jsonBytes, err := json.Marshal(jsonData)
if err != nil {
    log.Fatal("Error marshaling JSON data:", err)
}
jsonString := string(jsonBytes)
graphId := "engineering_team"
_, err = client.Graph.Add(context.TODO(), &v3.AddDataRequest{
    GraphID: &graphId,
    Type:    v3.GraphDataTypeJSON,
    Data:    jsonString,
})
if err != nil {
    log.Fatal("Error adding JSON data:", err)
}
// Add text data to a graph
graphData := "The engineering team is working on Project Alpha and Project Beta."
_, err = client.Graph.Add(context.TODO(), &v3.AddDataRequest{
    GraphID: &graphId,
    Type:    v3.GraphDataTypeText,
    Data:    graphData,
})
if err != nil {
    log.Fatal("Error adding graph data:", err)
}

```

</CodeBlocks>

### Search the graph

Use the `graph.search` method to search for edges, nodes, or episodes in the graph. This is useful for finding specific information about a user or graph.

<CodeBlocks>

```python Python
query = "What projects is Jane working on?"

# Search for edges in a graph
edge_results = client.graph.search(
    graph_id=graph_id,
    query=query,
    scope="edges",  # Default is "edges"
    limit=5
)

# Search for nodes in a graph
node_results = client.graph.search(
    graph_id=graph_id,
    query=query,
    scope="nodes",
    limit=5
)

# Search for episodes in a graph
episode_results = client.graph.search(
    graph_id=graph_id,
    query=query,
    scope="episodes",
    limit=5
)
```

```typescript TypeScript
const query = "What projects is Jane working on?";

// Search for edges in a graph
const edgeResults = await client.graph.search({
  graphId: graphId,
  query: query,
  scope: "edges", // Default is "edges"
  limit: 5,
});

// Search for nodes in a graph
const nodeResults = await client.graph.search({
  graphId: graphId,
  query: query,
  scope: "nodes",
  limit: 5,
});

// Search for episodes in a graph
const episodeResults = await client.graph.search({
  graphId: graphId,
  query: query,
  scope: "episodes",
  limit: 5,
});
```

```go Go
import (
    "context"
    v3 "github.com/getzep/zep-go/v3"
)

query := "What projects is Jane working on?"
limit := 5

edgeResults, err := client.Graph.Search(context.TODO(), &v3.GraphSearchQuery{
    GraphID: &graphId,
    Query:   query,
    Scope:   v3.GraphSearchScopeEdges.Ptr(),
    Limit:   &limit,
})
if err != nil {
    log.Fatal("Error searching graph:", err)
}
fmt.Println("Edge search results:", edgeResults)
// Search for nodes in a graph
nodeResults, err := client.Graph.Search(context.TODO(), &v3.GraphSearchQuery{
    GraphID: &graphId,
    Query:   query,
    Scope:   v3.GraphSearchScopeNodes.Ptr(),
    Limit:   &limit,
})
if err != nil {
    log.Fatal("Error searching graph:", err)
}
fmt.Println("Node search results:", nodeResults)
// Search for episodes in a graph
episodeResults, err := client.Graph.Search(context.TODO(), &v3.GraphSearchQuery{
    GraphID: &graphId,
    Query:   query,
    Scope:   v3.GraphSearchScopeEpisodes.Ptr(),
    Limit:   &limit,
})
if err != nil {
    log.Fatal("Error searching graph:", err)
}
fmt.Println("Episode search results:", episodeResults)
```

</CodeBlocks>

### Assemble context block

Using the search results, you can build a context block to include in your prompts. For a complete example with helper functions and code samples, see our [Customize your context block cookbook](/cookbook/customize-your-context-block).

### View your knowledge graph

Since you've created memory, you can view your knowledge graph by navigating to [the Zep Dashboard](https://app.getzep.com/), then Users > "user123" > View Graph. You can also click the "View Episodes" button to see when data is finished being added to the knowledge graph.

## Use Zep as an Agentic Tool

Zep's memory retrieval methods can be used as agentic tools, enabling your agent to query Zep for relevant information.
The example below shows how to create a LangChain LangGraph tool to search for facts in a user's graph.

<CodeBlocks>

```python Python
from zep_cloud.client import AsyncZep

from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, MessagesState
from langgraph.prebuilt import ToolNode

zep = AsyncZep(api_key=os.environ.get('ZEP_API_KEY'))

@tool
async def search_facts(state: MessagesState, query: str, limit: int = 5):
    """Search for facts in all conversations had with a user.

    Args:
        state (MessagesState): The Agent's state.
        query (str): The search query.
        limit (int): The number of results to return. Defaults to 5.
    Returns:
        list: A list of facts that match the search query.
    """
    search_results = await zep.graph.search(
      user_id=state['user_name'],
      query=query,
      limit=limit,
    )

    return [edge.fact for edge in search_results.edges]

tools = [search_facts]
tool_node = ToolNode(tools)
llm = ChatOpenAI(model='gpt-4o-mini', temperature=0).bind_tools(tools)
```

</CodeBlocks>

## Next Steps

Now that you've learned the basics of using Zep, you can:

- Learn more about [Key Concepts](/concepts)
- Explore the [Graph API](/adding-data-to-the-graph) for adding and retrieving data
- Understand [Users and Threads](/users) in more detail
- Learn about our [Context Block](/retrieving-memory#retrieving-zeps-context-block) for building better prompts
- Explore [Graph Search](/searching-the-graph) for advanced search capabilities
