# Cloudflare Edge AI Agent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a stateful, real-time Cloudflare AI Agent using the Agents SDK to handle edge-based AI chat interactions and integrate it with the WFP CRM frontend.

**Architecture:** We will create a new separate project folder `wfp-crm-edge-agent` using the `cloudflare/agents-starter` template. The agent will run on Cloudflare Workers edge, use Durable Objects for persistent state, and expose a WebSocket connection. Then we will add the `agents` React hook to our frontend to render a real-time chat interface.

**Tech Stack:** Cloudflare Workers, Cloudflare Agents SDK, TypeScript, React, Vite.

---

### Task 1: Scaffold Cloudflare Agent

**Files:**
- Create: `wfp-crm-edge-agent/` (via scaffolding)

**Step 1: Write the failing test**
*N/A for scaffolding step.*

**Step 2: Run test to verify it fails**
Run: `cd wfp-crm-edge-agent && npm run dev`
Expected: FAIL with "directory not found"

**Step 3: Write minimal implementation**
```bash
npx create-cloudflare@latest wfp-crm-edge-agent --template=cloudflare/agents-starter --ts --no-deploy
```

**Step 4: Run test to verify it passes**
Run: `cd wfp-crm-edge-agent && npm run build`
Expected: PASS (Successfully builds the worker)

**Step 5: Commit**
```bash
git add wfp-crm-edge-agent
git commit -m "feat: scaffold cloudflare agents sdk starter"
```

---

### Task 2: Configure AI Chat Agent Logic

**Files:**
- Modify: `wfp-crm-edge-agent/src/agent.ts:1-50`

**Step 1: Write the failing test**
Run: `cd wfp-crm-edge-agent && npm run test`

**Step 2: Write minimal implementation**
Modify `wfp-crm-edge-agent/src/agent.ts` to use `AIChatAgent`:
```typescript
import { AIChatAgent } from "agents/ai-chat-agent";

export class ChatBot extends AIChatAgent<Env> {
  async onChatMessage(message: string) {
    const response = await this.env.AI.run("@cf/meta/llama-3-8b-instruct", {
      messages: [
        { role: "system", content: "You are the WFP CRM Edge Assistant." },
        ...this.messages,
        { role: "user", content: message },
      ],
      stream: true,
    });
    return response;
  }
}
```

**Step 3: Run test to verify it passes**
Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**
```bash
git add wfp-crm-edge-agent/src/agent.ts
git commit -m "feat: configure AIChatAgent logic with Llama-3"
```

---

### Task 3: Integrate Agent React Hook in Frontend

**Files:**
- Modify: `package.json` (root)
- Create: `src/components/EdgeAgentChat.tsx`

**Step 1: Write the failing test**
Create `tests/EdgeAgentChat.test.tsx`
Expected: FAIL (Component doesn't exist)

**Step 2: Write minimal implementation**
```bash
npm install agents
```

Create `src/components/EdgeAgentChat.tsx`:
```tsx
import React, { useState } from 'react';
import { useAgent } from 'agents/react';

export function EdgeAgentChat({ userId }: { userId: string }) {
  const [input, setInput] = useState('');
  const { state, send, connected } = useAgent({
    agent: "chat-bot",
    name: userId,
  });

  const sendMessage = () => {
    if (!input.trim()) return;
    send(JSON.stringify({ type: "chat", content: input }));
    setInput('');
  };

  return (
    <div className="p-4 bg-gray-900 rounded-lg">
      <div className="h-64 overflow-y-auto mb-4">
        {state?.messages?.map((msg: any, i: number) => (
          <div key={i} className="text-white">
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <input 
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && sendMessage()}
        className="w-full p-2 text-black"
      />
    </div>
  );
}
```

**Step 3: Run test to verify it passes**
Verify compilation: `npm run build`
Expected: PASS

**Step 4: Commit**
```bash
git add src/components/EdgeAgentChat.tsx package.json package-lock.json
git commit -m "feat: add React UI for Cloudflare Edge Agent"
```
