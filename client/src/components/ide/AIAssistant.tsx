"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Send, Key, Loader2, Sparkles, Code2, Trash2, Cpu, Github } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/Toaster";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Groq API implementation
// Base URL: https://api.groq.com/openai/v1/chat/completions
// Format: OpenAI-compatible

interface Message {
    role: "user" | "assistant" | "system";
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
    const [model, setModel] = useState("llama-3.3-70b-versatile");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const models = [
        { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile" },
        { id: "llama-3.1-70b-versatile", name: "Llama 3.1 70B Versatile" },
        { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant" },
        { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
        { id: "gemma2-9b-it", name: "Gemma 2 9B" },
    ];

    useEffect(() => {
        const storedKey = localStorage.getItem("groq_api_key");
        const storedModel = localStorage.getItem("groq_model");
        const storedMessages = localStorage.getItem("groq_messages");

        if (!storedKey) {
            setShowKeyInput(true);
        } else {
            setApiKey(storedKey);
        }

        if (storedModel) {
            const modelExists = models.find(m => m.id === storedModel);
            if (modelExists) {
                setModel(storedModel);
            }
        }

        if (storedMessages) {
            try {
                setMessages(JSON.parse(storedMessages));
            } catch (e) {
                console.error("Failed to parse stored messages", e);
            }
        }
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem("groq_messages", JSON.stringify(messages));
        }
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleModelChange = (newModel: string) => {
        setModel(newModel);
        localStorage.setItem("groq_model", newModel);
    };

    const handleSaveKey = () => {
        if (!apiKey.trim()) return;
        localStorage.setItem("groq_api_key", apiKey.trim());
        setShowKeyInput(false);
        toast.success("Groq API Key saved!");
    };

    const handleClearKey = () => {
        localStorage.removeItem("groq_api_key");
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

        // Add an empty assistant message to start streaming into
        setMessages(prev => [...prev, { role: "assistant", content: "" }]);

        try {
            // Context injection
            let systemPrompt = "You are a powerful AI Assistant integrated into the AP IDE. You have FULL control over the project via the terminal.";
            systemPrompt += "\n\nCOMMAND CAPABILITIES:";
            systemPrompt += "\n1. File Management: Use commands like <terminal>mkdir -p path/to/dir</terminal>, <terminal>rm -rf filename</terminal>, <terminal>touch newfile.js</terminal>.";
            systemPrompt += "\n2. Code Refactoring: You can suggest complex terminal-based refactoring commands or propose creating scripts to transform the codebase.";
            systemPrompt += "\n3. Git Operations: Propose <terminal>git add .</terminal>, <terminal>git commit -m '...'</terminal>, etc.";
            systemPrompt += "\n4. Development: Suggest <terminal>npm run build</terminal>, <terminal>php artisan ...</terminal>, or <terminal>node scripts/refactor.js</terminal>.";
            systemPrompt += "\n\nRULES:";
            systemPrompt += "\n- ALWAYS wrap executable terminal commands in <terminal>command</terminal> tags.";
            systemPrompt += "\n- If the user asks to delete, create, or move files, PROVIDE the exact command for them to click and run.";
            systemPrompt += "\n- For codebase-wide changes, you can suggest multi-command tasks if needed.";

            if (activeFileContent && activeFilePath) {
                systemPrompt += `\n\nCURRENT CONTEXT:\nFile: ${activeFilePath}\nContent:\n\`\`\`\n${activeFileContent}\n\`\`\``;
            }

            const chatMessages = [
                { role: "system", content: systemPrompt },
                ...messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                { role: "user", content: userMsg }
            ];

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey.trim()}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: chatMessages,
                    temperature: 0.7,
                    max_tokens: 4096,
                    stream: true,
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error?.message || "Failed to get response from Groq");
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split("\n");

                    for (const line of lines) {
                        if (line.startsWith("data: ") && line !== "data: [DONE]") {
                            try {
                                const json = JSON.parse(line.substring(6));
                                const content = json.choices[0]?.delta?.content || "";
                                accumulatedContent += content;

                                setMessages(prev => {
                                    const newMessages = [...prev];
                                    newMessages[newMessages.length - 1].content = accumulatedContent;
                                    return newMessages;
                                });
                            } catch (e) {
                                // Ignore non-JSON chunks
                            }
                        }
                    }
                }
            }
        } catch (error: any) {
            console.error(error);
            const isModelError = error.message.includes("not found") || error.message.includes("not supported");
            toast.error(isModelError ? "Model not available. Try selecting a different model from the dropdown." : error.message);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = `Error: ${error.message}`;
                return newMessages;
            });
        } finally {
            setLoading(false);
        }
    };

    const runTerminalCommand = (command: string) => {
        window.dispatchEvent(new CustomEvent('terminal:run-command', { detail: { command } }));
        toast.success("Command sent to terminal");
    };

    const MessageContent = ({ content, role }: { content: string, role: string }) => {
        if (role === 'user') return <div className="whitespace-pre-wrap leading-relaxed">{content}</div>;

        // Split by terminal tags first to render them separately from Markdown
        const segments = content.split(/(<terminal>[\s\S]*?<\/terminal>)/g);

        return (
            <div className="flex flex-col gap-2">
                {segments.map((segment, idx) => {
                    const terminalMatch = segment.match(/<terminal>([\s\S]*?)<\/terminal>/);
                    if (terminalMatch) {
                        const command = terminalMatch[1].trim();
                        // Detect operation type for better UI
                        let Icon = Cpu;
                        let color = "text-emerald-400";
                        let btnColor = "bg-emerald-600 hover:bg-emerald-500 border-emerald-800";
                        let label = "Terminal Task";

                        if (command.startsWith('rm')) {
                            Icon = Trash2; color = "text-red-400"; btnColor = "bg-red-600 hover:bg-red-500 border-red-800"; label = "Delete Operation";
                        } else if (command.startsWith('mkdir') || command.startsWith('touch')) {
                            Icon = Code2; color = "text-blue-400"; btnColor = "bg-blue-600 hover:bg-blue-500 border-blue-800"; label = "Create Operation";
                        } else if (command.startsWith('git')) {
                            Icon = Github; color = "text-purple-400"; btnColor = "bg-purple-600 hover:bg-purple-500 border-purple-800"; label = "Source Control";
                        } else if (command.startsWith('npm') || command.startsWith('php')) {
                            Icon = Sparkles; color = "text-orange-400"; btnColor = "bg-orange-600 hover:bg-orange-500 border-orange-800"; label = "Execution Task";
                        }

                        return (
                            <div key={idx} className="my-2 p-3 bg-zinc-900/80 rounded-lg border border-zinc-700/50 shadow-2xl flex flex-col gap-3 backdrop-blur-sm">
                                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("p-1 rounded bg-zinc-800", color)}>
                                            <Icon className="h-3 w-3" />
                                        </div>
                                        <span>{label}</span>
                                    </div>
                                    <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", color.replace('text', 'bg'))} />
                                </div>
                                <div className="relative group">
                                    <code className={cn("block bg-black/60 p-3 rounded-md text-xs font-mono break-all border border-white/5 whitespace-pre-wrap leading-relaxed", color)}>
                                        <span className="opacity-50 mr-2">$</span>
                                        {command}
                                    </code>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => runTerminalCommand(command)}
                                    className={cn("text-white text-[11px] h-9 font-bold border-b-2 active:border-b-0 active:translate-y-0.5 transition-all w-full flex items-center justify-center gap-2 shadow-lg", btnColor)}
                                >
                                    <Send className="h-3 w-3" />
                                    AUTHORIZE & RUN
                                </Button>
                            </div>
                        );
                    }

                    return (
                        <div key={idx} className="prose prose-invert max-w-none text-sm leading-relaxed overflow-hidden">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                    code: ({ node, inline, className, children, ...props }: any) => {
                                        return !inline ? (
                                            <div className="relative my-4">
                                                <pre className="p-4 rounded-lg bg-black/40 overflow-x-auto border border-white/5 scrollbar-thin">
                                                    <code className={className} {...props}>
                                                        {children}
                                                    </code>
                                                </pre>
                                            </div>
                                        ) : (
                                            <code className="px-1 py-0.5 rounded bg-white/10 text-orange-300" {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                }}
                            >
                                {segment}
                            </ReactMarkdown>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-[#cccccc]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#bbbbbb] border-b border-[#2d2d2d] bg-[#252526]">
                <div className="flex items-center gap-2 text-orange-400">
                    <Cpu className="h-4 w-4" />
                    <span>Groq Assistant</span>
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
                    <button onClick={handleClearKey} className="hover:text-white p-1" title="Settings / API Key">
                        <Key className="h-3 w-3" />
                    </button>
                    <button onClick={() => {
                        setMessages([]);
                        localStorage.removeItem("groq_messages");
                    }} className="hover:text-white p-1" title="Clear Chat">
                        <Trash2 className="h-3 w-3" />
                    </button>
                </div>
            </div>

            {/* API Key Input */}
            {showKeyInput ? (
                <div className="p-4 flex flex-col gap-3 bg-[#2a2d2e] m-4 rounded-lg border border-[#3e3e42] shadow-xl">
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                        <Key className="h-4 w-4 text-orange-400" />
                        <span>Enter Groq API Key</span>
                    </div>
                    <div className="text-xs text-[#858585]">
                        Get your high-speed API key from <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline">Groq Console</a>.
                    </div>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Paste Groq API Key (gsk_...)"
                        className="bg-[#1e1e1e] border border-[#3e3e42] rounded p-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                    <Button onClick={handleSaveKey} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                        Initialize Engine
                        <Sparkles className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <>
                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-[#3e3e42]">
                        {messages.length === 0 && (
                            <div className="text-center text-[#858585] text-sm mt-10 flex flex-col items-center gap-2">
                                <div className="p-3 bg-[#2a2d2e] rounded-full border border-[#3e3e42] text-orange-400">
                                    <Bot className="h-8 w-8" />
                                </div>
                                <h3 className="text-white font-medium">Ultra-fast Groq Intelligence</h3>
                                <p className="text-xs max-w-[200px]">How can I help you accelerate your development today?</p>
                                <div className="text-[10px] text-[#666] mt-4 px-2 py-1 bg-[#252526] rounded-md border border-[#333]">
                                    Active Model: <span className="text-orange-300">{models.find(m => m.id === model)?.name}</span>
                                </div>
                                {activeFilePath && (
                                    <p className="text-[10px] bg-[#2a2d2e] px-2 py-1 rounded border border-[#3e3e42] animate-pulse">
                                        Context: <span className="text-[#cccccc]">{activeFilePath.split('/').pop()}</span>
                                    </p>
                                )}
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "flex flex-col gap-1 max-w-[95%] rounded-lg p-3 text-sm transition-all shadow-sm",
                                    msg.role === "user"
                                        ? "self-end bg-[#007acc] text-white rounded-tr-none"
                                        : "self-start bg-[#2d2d30] text-[#cccccc] rounded-tl-none border border-[#3e3e42]"
                                )}
                            >
                                <div className="font-bold text-[10px] opacity-70 uppercase mb-1 flex justify-between">
                                    <span>{msg.role === "user" ? "You" : "Groq AI"}</span>
                                    <span>{msg.role === "user" ? "" : models.find(m => m.id === model)?.name.split(' ')[0]}</span>
                                </div>
                                <MessageContent content={msg.content} role={msg.role} />
                            </div>
                        ))}
                        {loading && (
                            <div className="self-start bg-[#2d2d30] text-[#cccccc] rounded-lg rounded-tl-none p-3 flex gap-2 items-center border border-[#3e3e42]">
                                <Loader2 className="h-3 w-3 animate-spin text-orange-400" />
                                <span className="text-xs italic">Accelerating response...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-[#2d2d2d] bg-[#252526]">
                        {activeFilePath && (
                            <div className="flex items-center gap-2 mb-2 text-[10px] text-[#858585]">
                                <Code2 className="h-3 w-3 text-orange-400" />
                                <span>Injecting context: {activeFilePath.split('/').pop()}</span>
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
                                placeholder="Speed up your coding..."
                                className="flex-1 bg-[#1e1e1e] border border-[#3e3e42] rounded-md p-2 text-sm text-white focus:outline-none focus:border-orange-500 resize-none h-11 min-h-[44px] max-h-[150px] transition-all"
                                rows={1}
                            />
                            <Button
                                size="icon"
                                onClick={handleSendMessage}
                                disabled={!input.trim() || loading}
                                className="h-11 w-11 shrink-0 bg-orange-600 hover:bg-orange-700 shadow-lg transition-transform active:scale-95"
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
