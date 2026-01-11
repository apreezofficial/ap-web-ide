"use client";

import { useEffect, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";

interface EditorComponentProps {
    content: string;
    language?: string;
    onChange: (value: string) => void;
    onSave: () => void;
}

export function EditorComponent({ content, language = "plaintext", onChange, onSave }: EditorComponentProps) {

    const handleEditorChange = (value: string | undefined) => {
        onChange(value || "");
    };

    // Basic Ctrl+S handling
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            onSave();
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onSave]); // Be careful with dependencies here

    return (
        <div className="h-full flex flex-col">
            <div className="h-full w-full">
                <Editor
                    height="100%"
                    defaultLanguage={language}
                    value={content}
                    onChange={handleEditorChange}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: "on",
                        automaticLayout: true,
                    }}
                />
            </div>
        </div>
    );
}
