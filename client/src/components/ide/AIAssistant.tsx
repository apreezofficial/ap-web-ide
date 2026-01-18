"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Send, Key, Loader2, Sparkles, Code2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/Toaster";
// We'll use a direct fetch to Gemini API from client for simplicity and speed, 
// or proxy through backend if we wanted to hide keys (but requirements said user inserts key).

interface Message {
    role: "user" | "model";
    content: string;
}

interface AIAssistantProps {
    activeFileContent?: string;
    activeFilePath?: string;
}

export function AIAssistant({ activeFileContent, activeFilePath }: AIAssistantProps) {
    const [apiKey, setApiKey] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showKeyInput, setShowKeyInput] = useState(false);
    const [model, setModel] = useState("gemini-2.0-flash-exp");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const models = [
        { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash (Exp)" },
        { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
        { id: "gemini-1.5-flash-001", name: "Gemini 1.5 Flash-001" },
        { id: "gemini-1.5-flash-8b", name: "Gemini 1.5 Flash-8b" },
        { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
        { id: "gemini-1.5-pro-001", name: "Gemini 1.5 Pro-001" },
        { id: "gemini-pro", name: "Gemini Pro (Legacy)" },
    ];

    useEffect(() => {
        const storedKey = localStorage.getItem("gemini_api_key");
        const storedModel = localStorage.getItem("gemini_model");
        if (storedKey) {
            setApiKey(storedKey);
        } else {
            setShowKeyInput(true);
        }
        if (storedModel) {
            setModel(storedModel);
        }
    }, []);

    // ... (scrollToBottom)

    const handleModelChange = (newModel: string) => {
        setModel(newModel);
        localStorage.setItem("gemini_model", newModel);
    };

    // ... (scrollToBottom)

    const handleSaveKey = () => {
        if (!apiKey.trim()) return;
        localStorage.setItem("gemini_api_key", apiKey);
        setShowKeyInput(false);
        toast.success("API Key saved!");
    };

    const handleClearKey = () => {
        localStorage.removeItem("gemini_api_key");
        setApiKey("");
        setShowKeyInput(true);
        toast.success("API Key removed");
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !apiKey) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setInput("");
        setLoading(true);

        try {
            // Context injection
            let prompt = userMsg;
            if (activeFileContent && activeFilePath) {
                prompt += `\n\nContext:\nCurrent File: ${activeFilePath}\nContent:\n\`\`\`\n${activeFileContent}\n\`\`\``;
            }

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || "Failed to get response from Gemini");
            }

            const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

            setMessages(prev => [...prev, { role: "model", content: botResponse }]);
        } catch (error: any) {
            console.error(error);
            const isModelError = error.message.includes("not found") || error.message.includes("not supported");
            toast.error(isModelError ? "Model not available. Try selecting a different model from the dropdown." : error.message);
            setMessages(prev => [...prev, { role: "model", content: `Error: ${error.message}${isModelError ? "\n\nTip: Try changing the model in the top right dropdown." : ""}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#252526] text-[#cccccc]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#bbbbbb] border-b border-[#3c3c3c]">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#dcb67a]" />
                    <span>AI Assistant</span>
                </div>
                <div className="flex items-center gap-1">
                    <select
                        value={model}
                        onChange={(e) => handleModelChange(e.target.value)}
                        className="bg-[#3c3c3c] text-[#cccccc] border border-[#3e3e42] rounded px-1 py-0.5 text-[10px] focus:outline-none"
                    >
                        {models.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                    <button onClick={handleClearKey} className="hover:text-white p-1" title="Clear API Key">
                        <Key className="h-3 w-3" />
                    </button>
                    <button onClick={() => setMessages([])} className="hover:text-white p-1" title="Clear Chat">
                        <Trash2 className="h-3 w-3" />
                    </button>
                </div>
            </div>

            {/* API Key Input */}
            {showKeyInput ? (
                <div className="p-4 flex flex-col gap-3 bg-[#2a2d2e] m-4 rounded border border-[#3e3e42]">
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                        <Key className="h-4 w-4 text-[#dcb67a]" />
                        <span>Enter Gemini API Key</span>
                    </div>
                    <div className="text-xs text-[#858585]">
                        Get your free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[#007acc] hover:underline">Google AI Studio</a>.
                    </div>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Paste API Key here..."
                        className="bg-[#1e1e1e] border border-[#3e3e42] rounded p-2 text-sm text-white focus:outline-none focus:border-[#007acc]"
                    />
                    <Button onClick={handleSaveKey} className="w-full bg-[#007acc] hover:bg-[#0062a3] text-white">
                        Let's Go
                        <Sparkles className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <>
                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                        {messages.length === 0 && (
                            <div className="text-center text-[#858585] text-sm mt-10 flex flex-col items-center gap-2">
                                <Bot className="h-8 w-8 opacity-50" />
                                <p>How can I help you code today?</p>
                                <div className="text-xs text-[#666]">Using {models.find(m => m.id === model)?.name}</div>
                                {activeFilePath && (
                                    <p className="text-xs bg-[#2a2d2e] px-2 py-1 rounded border border-[#3e3e42]">
                                        Looking at: <span className="text-[#cccccc]">{activeFilePath.split('/').pop()}</span>
                                    </p>
                                )}
                            </div>
                        )}
                        {/* ... messages map ... */}

                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "flex flex-col gap-1 max-w-[90%] rounded p-3 text-sm",
                                    msg.role === "user"
                                        ? "self-end bg-[#007acc] text-white"
                                        : "self-start bg-[#3e3e42] text-[#cccccc]"
                                )}
                            >
                                <div className="font-bold text-[10px] opacity-70 uppercase mb-1">
                                    {msg.role === "user" ? "You" : "Gemini"}
                                </div>
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        ))}
                        {loading && (
                            <div className="self-start bg-[#3e3e42] text-[#cccccc] rounded p-3 flex gap-2 items-center">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-xs">Thinking...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-[#3c3c3c]">
                        {activeFilePath && (
                            <div className="flex items-center gap-2 mb-2 text-[10px] text-[#858585]">
                                <Code2 className="h-3 w-3" />
                                <span>Context: {activeFilePath.split('/').pop()}</span>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Ask a question..."
                                className="flex-1 bg-[#3c3c3c] border border-[#3e3e42] rounded p-2 text-sm focus:outline-none focus:border-[#007acc] resize-none h-10 min-h-[40px] max-h-[100px]"
                                rows={1}
                            />
                            <Button
                                size="icon"
                                onClick={handleSendMessage}
                                disabled={!input.trim() || loading}
                                className="h-10 w-10 shrink-0 bg-[#007acc] hover:bg-[#0062a3]"
                            >
                                <Send className="h-4 w-4 text-white" />
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
