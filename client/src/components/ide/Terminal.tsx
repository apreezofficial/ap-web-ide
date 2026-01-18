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

        term.writeln("\x1b[32mWelcome to AP AI IDE Terminal\x1b[0m");

        let currentPrompt = "\x1b[34m~\x1b[0m $ ";
        term.write(currentPrompt);

        let currentLine = "";

        term.onData(e => {
            switch (e) {
                case '\r': // Enter
                    term.write('\r\n');
                    if (currentLine.trim()) {
                        // Add to history
                        historyRef.current.push(currentLine);
                        historyIndexRef.current = -1;

                        fetchAPI('/terminal/exec.php', {
                            method: 'POST',
                            body: JSON.stringify({ command: currentLine, project_id: projectId })
                        }).then((res: any) => {
                            const output = (res.output || "").replace(/\n/g, '\r\n');
                            if (output) term.write(output);

                            const cwd = res.cwd || "~";
                            const user = res.user || "user";
                            currentPrompt = `\x1b[32m${user}@ap-ide\x1b[0m:\x1b[34m${cwd}\x1b[0m$ `;
                            term.write(currentPrompt);
                            currentLine = "";
                        }).catch((err: any) => {
                            term.write(`\x1b[31mError: ${err.message}\x1b[0m\r\n`);
                            term.write(currentPrompt);
                            currentLine = "";
                        });
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
        };
    }, [projectId]);

    return (
        <div className="h-full w-full bg-zinc-950 overflow-hidden pl-1 pt-1" ref={terminalRef} />
    );
}
