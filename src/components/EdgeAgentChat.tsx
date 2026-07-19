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
      <div className="h-64 overflow-y-auto mb-4 border border-gray-700 p-2">
        {!connected && <div className="text-gray-400">Connecting to WFP CRM Edge Agent...</div>}
        {state?.messages?.map((msg: any, i: number) => (
          <div key={i} className={`mb-2 ${msg.role === 'user' ? 'text-blue-400' : 'text-green-400'}`}>
            <strong>{msg.role === 'user' ? 'You' : 'Edge Agent'}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          className="flex-1 p-2 bg-gray-800 text-white rounded border border-gray-700 focus:outline-none focus:border-blue-500"
          placeholder="Type a message for Edge Agent..."
          disabled={!connected}
        />
        <button 
          onClick={sendMessage}
          disabled={!connected}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
