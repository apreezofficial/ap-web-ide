"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

export function TerminalComponent() {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);

    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new Terminal({
            cursorBlink: true,
            theme: {
                background: "#09090b", // zinc-950
            },
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            fontSize: 14,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;

        term.writeln("Welcome to AP AI IDE Terminal");
        term.writeln("Connection to server not established yet.");
        term.write("$ ");

        // Handle resize
        const handleResize = () => fitAddon.fit();
        window.addEventListener("resize", handleResize);

        return () => {
            term.dispose();
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return <div className="h-full w-full p-2 bg-zinc-950" ref={terminalRef} />;
}
