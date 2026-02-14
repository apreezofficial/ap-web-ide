"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { fetchAPI } from "@/lib/api";

interface TerminalProps {
    projectId: string;
}

export function TerminalComponent({ projectId }: TerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef(-1);

    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new Terminal({
            cursorBlink: true,
            theme: {
                background: "#09090b",
                foreground: "#eff0f3",
            },
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            fontSize: 14,
            scrollback: 1000,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;

        term.writeln("\x1b[32mWelcome to AP IDE Terminal\x1b[0m");

        let currentPrompt = "\x1b[34m~\x1b[0m $ ";
        term.write(currentPrompt);

        let isProcessing = false;
        let activeProcessId: string | null = null;
        let currentLine = "";

        // Global listener for executing commands from other components
        const handleTerminalRun = (e: any) => {
            const { command } = e.detail;
            if (!command) return;

            // Clean up command
            const cleanCmd = command.trim();

            // For visual feedback, show the command being "typed" or pasted
            // If multi-line, we should probably just write it as is but ensure \r
            const terminalFriendlyCmd = cleanCmd.replace(/\n/g, '\r\n');
            term.write(terminalFriendlyCmd + '\r');

            // Trigger the execution logic
            executeCommand(cleanCmd);
        };

        const executeCommand = (command: string) => {
            if (isProcessing) return;

            // Add to history
            historyRef.current.push(command);
            historyIndexRef.current = -1;

            isProcessing = true;
            activeProcessId = null;
            term.write("\x1b[36m⚡ Executing Task...\x1b[0m\r\n");

            fetch('/api/terminal/exec.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: command, project_id: projectId })
            }).then(async (response) => {
                if (!response.body) throw new Error("No response body");

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        if (!line.trim()) continue;
                        try {
                            const json = JSON.parse(line);
                            if (json.type === 'output') {
                                // Sanitize path: hide full server path and show '~' instead
                                let sanitizedData = json.data;
                                const workspacePathRegex = /C:.*[\\\/]storage[\\\/]workspaces[\\\/]\d+[\\\/][^\\\/\s]+/g;
                                sanitizedData = sanitizedData.replace(workspacePathRegex, '~');

                                term.write(sanitizedData.replace(/\n/g, '\r\n'));
                            } else if (json.type === 'meta') {
                                if (json.process_id) {
                                    activeProcessId = json.process_id;
                                }
                                if (json.cwd !== undefined) {
                                    const cwd = json.cwd || "~";
                                    const user = json.user || "user";
                                    currentPrompt = `\x1b[32m${user}@ap-ide\x1b[0m:\x1b[34m${cwd}\x1b[0m$ `;
                                }
                            } else if (json.type === 'error') {
                                term.write(`\x1b[31mError: ${json.data}\x1b[0m\r\n`);
                            }
                        } catch (e) {
                            console.error("Failed to parse chunk", line, e);
                        }
                    }
                }

                isProcessing = false;
                activeProcessId = null;
                term.write(currentPrompt);
                currentLine = "";
            }).catch((err: any) => {
                isProcessing = false;
                activeProcessId = null;
                term.write(`\x1b[31mError: ${err.message}\x1b[0m\r\n`);
                term.write(currentPrompt);
                currentLine = "";
            });
        };

        window.addEventListener('terminal:run-command', handleTerminalRun);

        term.onData(e => {
            if (isProcessing && activeProcessId) {
                // Forward input to process stdin
                fetch('/api/terminal/stdin.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ process_id: activeProcessId, input: e })
                }).catch(err => console.error("Stdin failed:", err));
                return;
            }

            if (isProcessing) return;

            switch (e) {
                case '\r': // Enter
                    term.write('\r\n');
                    if (currentLine.trim()) {
                        executeCommand(currentLine);
                    } else {
                        term.write(currentPrompt);
                    }
                    break;
                case '\u007F': // Backspace
                    if (currentLine.length > 0) {
                        currentLine = currentLine.slice(0, -1);
                        term.write('\b \b');
                    }
                    break;
                case '\x1b[A': // Up Arrow
                    if (historyRef.current.length > 0) {
                        if (historyIndexRef.current === -1) {
                            historyIndexRef.current = historyRef.current.length - 1;
                        } else if (historyIndexRef.current > 0) {
                            historyIndexRef.current--;
                        }
                        // Clear current line
                        for (let i = 0; i < currentLine.length; i++) term.write('\b \b');
                        // Write history command
                        const historyCmd = historyRef.current[historyIndexRef.current];
                        currentLine = historyCmd;
                        term.write(historyCmd);
                    }
                    break;
                case '\x1b[B': // Down Arrow
                    if (historyIndexRef.current !== -1) {
                        // Clear current line
                        for (let i = 0; i < currentLine.length; i++) term.write('\b \b');
                        if (historyIndexRef.current < historyRef.current.length - 1) {
                            historyIndexRef.current++;
                            const historyCmd = historyRef.current[historyIndexRef.current];
                            currentLine = historyCmd;
                            term.write(historyCmd);
                        } else {
                            historyIndexRef.current = -1;
                            currentLine = "";
                        }
                    }
                    break;
                case '\u0003': // Ctrl+C
                    term.write('^C\r\n');
                    term.write(currentPrompt);
                    currentLine = "";
                    break;
                default:
                    // Printable characters
                    if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
                        currentLine += e;
                        term.write(e);
                    }
            }
        });

        // Handle resize with ResizeObserver
        const resizeObserver = new ResizeObserver(() => {
            try {
                fitAddon.fit();
            } catch (e) {
                // ignore
            }
        });

        if (terminalRef.current) {
            resizeObserver.observe(terminalRef.current);
        }

        return () => {
            term.dispose();
            resizeObserver.disconnect();
            window.removeEventListener('terminal:run-command', handleTerminalRun);
        };
    }, [projectId]);

    return (
        <div className="h-full w-full bg-zinc-950 overflow-hidden pl-1 pt-1" ref={terminalRef} />
    );
}
