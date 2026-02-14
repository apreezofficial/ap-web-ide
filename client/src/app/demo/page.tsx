"use client";

import { useState } from "react";
import { Folder, File, ChevronRight, ChevronDown, Play, Save, Code2, Search, MoreHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Editor from "@monaco-editor/react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { ActivityBar } from "@/components/ide/ActivityBar";
import { StatusBar } from "@/components/ide/StatusBar";
import { EditorTabs } from "@/components/ide/EditorTabs";
import { cn } from "@/lib/utils";

// Mock Data
const INITIAL_FILES = {
    "index.php": "<?php\n\necho 'Hello from Demo Mode!';\n",
    "style.css": "body { background: #1e1e1e; color: #fff; font-family: sans-serif; }",
    "readme.md": "# Demo Project\n\nThis is a demo project running entirely in the browser memory.",
};

export default function DemoPage() {
    if (process.env.NEXT_PUBLIC_APP_ENV !== 'local') {
        return <div className="p-8 text-center text-red-500">Demo mode is disabled.</div>;
    }

    const [files, setFiles] = useState(INITIAL_FILES);
    const [activeFile, setActiveFile] = useState<string | null>("index.php");
    const [openFiles, setOpenFiles] = useState<string[]>(["index.php", "readme.md"]);
    const [content, setContent] = useState(INITIAL_FILES["index.php"]);
    const [activeView, setActiveView] = useState("explorer");

    const handleFileSelect = (filename: string) => {
        setActiveFile(filename);
        setContent(files[filename as keyof typeof files]);
        if (!openFiles.includes(filename)) {
            setOpenFiles([...openFiles, filename]);
        }
    };

    const handleCloseFile = (filename: string) => {
        const newOpenFiles = openFiles.filter(f => f !== filename);
        setOpenFiles(newOpenFiles);
        if (activeFile === filename) {
            if (newOpenFiles.length > 0) {
                handleFileSelect(newOpenFiles[newOpenFiles.length - 1]);
            } else {
                setActiveFile(null);
            }
        }
    };

    const handleEditorChange = (value: string | undefined) => {
        if (activeFile && value !== undefined) {
            setFiles(prev => ({ ...prev, [activeFile]: value }));
            setContent(value);
        }
    };

    return (
        <div className="flex h-screen w-full flex-col overflow-hidden bg-[#1e1e1e] text-[#cccccc]">

            {/* Main Workspace */}
            <div className="flex flex-1 overflow-hidden">

                {/* Activity Bar */}
                <ActivityBar activeView={activeView} onViewChange={setActiveView} />

                {/* Sidebar */}
                <div className={cn("flex w-64 flex-col border-r border-[#2b2b2b] bg-[#252526]", activeView === 'explorer' ? 'block' : 'hidden')}>
                    <div className="flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#bbbbbb]">
                        <span>Explorer</span>
                        <MoreHorizontal className="h-4 w-4 cursor-pointer" />
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="px-2">
                            <div className="flex items-center py-1 text-sm font-bold text-white hover:bg-[#2a2d2e] cursor-pointer">
                                <ChevronDown className="mr-1 h-4 w-4" />
                                <span>DEMO-PROJECT</span>
                            </div>

                            <div className="ml-2">
                                {Object.keys(files).map(filename => (
                                    <div
                                        key={filename}
                                        className={cn(
                                            "flex items-center gap-1.5 py-1 px-2 cursor-pointer text-sm rounded-sm",
                                            activeFile === filename ? "bg-[#37373d] text-white" : "hover:bg-[#2a2d2e] text-[#cccccc]"
                                        )}
                                        onClick={() => handleFileSelect(filename)}
                                    >
                                        <File className="h-4 w-4 text-[#cccccc]" />
                                        <span>{filename}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Editor Area */}
                <div className="flex flex-1 flex-col bg-[#1e1e1e]">
                    {/* Tabs */}
                    <EditorTabs
                        files={openFiles}
                        activeFile={activeFile}
                        onSelect={handleFileSelect}
                        onClose={handleCloseFile}
                    />

                    {/* Breadcrumbs / Toolbar (Optional, keeping it simple for now) */}

                    {/* Editor */}
                    <div className="flex-1 relative">
                        {activeFile ? (
                            <Editor
                                height="100%"
                                defaultLanguage="php"
                                language={activeFile?.endsWith('.php') ? 'php' : activeFile?.endsWith('.css') ? 'css' : 'markdown'}
                                value={content}
                                theme="vs-dark"
                                onChange={handleEditorChange}
                                options={{
                                    minimap: { enabled: true },
                                    fontSize: 14,
                                    fontFamily: "'Fira Code', 'Droid Sans Mono', 'monospace'",
                                    padding: { top: 10 }
                                }}
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-[#585858] flex-col gap-4">
                                <div className="text-6xl opacity-20">AP IDE</div>
                                <div className="text-sm">Select a file to start editing</div>
                                <div className="flex gap-2 text-xs">
                                    <span>Show All Commands</span>
                                    <span className="bg-[#333] px-1 rounded">Ctrl+Shift+P</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Terminal Panel */}
                    <div className="h-48 border-t border-[#2b2b2b] bg-[#1e1e1e] flex flex-col">
                        <div className="flex items-center gap-4 px-4 py-1 text-xs uppercase border-b border-[#2b2b2b] text-[#969696]">
                            <span className="cursor-pointer hover:text-white border-b border-white text-white py-1">Terminal</span>
                            <span className="cursor-pointer hover:text-white py-1">Output</span>
                            <span className="cursor-pointer hover:text-white py-1">Debug Console</span>
                            <div className="flex-1" />
                            <X className="h-3 w-3 cursor-pointer hover:text-white" />
                        </div>
                        <div className="flex-1 p-2 font-mono text-sm text-[#cccccc] overflow-auto">
                            <div>$ User@AP-IDE:~/demo-project</div>
                            <div>$ ready</div>
                            <div className="mt-1">$ <span className="animate-pulse">_</span></div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Status Bar */}
            <StatusBar />
        </div>
    );
}
