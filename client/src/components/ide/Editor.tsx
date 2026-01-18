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

    const [editorInstance, setEditorInstance] = useState<any>(null);

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

        const handleFormat = () => {
            if (editorInstance) {
                editorInstance.getAction('editor.action.formatDocument')?.run();
            }
        };
        window.addEventListener('ide-format-code', handleFormat);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('ide-format-code', handleFormat);
        };
    }, [onSave, editorInstance]); // Be careful with dependencies here

    return (
        <div className="h-full flex flex-col">
            <div className="h-full w-full">
                <Editor
                    height="100%"
                    defaultLanguage={language}
                    language={language}
                    value={content}
                    onChange={handleEditorChange}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: "on",
                        automaticLayout: true,
                        colorDecorators: true,
                        scrollBeyondLastLine: false,
                        renderWhitespace: "selection",
                        fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                        fontLigatures: true,
                        bracketPairColorization: { enabled: true },
                        guides: { bracketPairs: true },
                    }}
                    onMount={(editor) => {
                        setEditorInstance(editor);

                        // Auto-format HTML by default if it's a new or messy file
                        if (language === 'html' || language === 'css') {
                            setTimeout(() => {
                                editor.getAction('editor.action.formatDocument')?.run();
                            }, 500);
                        }

                        // Add a format action to the context menu or command palette
                        editor.addAction({
                            id: 'format-code',
                            label: 'Format Document',
                            keybindings: [
                                // monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF
                            ],
                            run: (ed) => {
                                ed.getAction('editor.action.formatDocument')?.run();
                            }
                        });
                    }}
                />
            </div>
        </div>
    );
}
