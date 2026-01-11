"use client";

import { useState, useEffect } from "react";
import { Folder, File, ChevronRight, ChevronDown, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAPI } from "@/lib/api";

interface FileSystemItem {
    name: string;
    path: string;
    type: "file" | "directory";
}

interface FileExplorerProps {
    projectId: number;
    onFileSelect: (path: string) => void;
}

export function FileExplorer({ projectId, onFileSelect }: FileExplorerProps) {
    const [items, setItems] = useState<FileSystemItem[]>([]);
    const [currentPath, setCurrentPath] = useState("");

    useEffect(() => {
        loadFiles(currentPath);
    }, [currentPath, projectId]);

    const loadFiles = async (path: string) => {
        try {
            const data = await fetchAPI(`/files/list.php?project_id=${projectId}&path=${path}`);
            setItems(data.files || []);
        } catch (error) {
            console.error("Failed to load files", error);
        }
    };

    const handleItemClick = (item: FileSystemItem) => {
        if (item.type === "directory") {
            setCurrentPath(item.path);
        } else {
            onFileSelect(item.path);
        }
    };

    const handleUpLevel = () => {
        if (!currentPath) return;
        const parts = currentPath.split("/");
        parts.pop();
        setCurrentPath(parts.join("/"));
    };

    return (
        <div className="flex bg-zinc-50 dark:bg-zinc-900 border-r w-64 h-full flex-col">
            <div className="p-4 border-b text-sm font-semibold flex justify-between items-center">
                <span>Files</span>
                <div className="flex gap-1">
                    {/* Add file/folder buttons here later */}
                </div>
            </div>

            <div className="p-2 text-xs text-muted-foreground break-all">
                /{currentPath}
            </div>

            {currentPath && (
                <div
                    className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer text-sm"
                    onClick={handleUpLevel}
                >
                    <ChevronDown className="h-4 w-4" />
                    <span>..</span>
                </div>
            )}

            <div className="flex-1 overflow-auto">
                {items.map((item) => (
                    <div
                        key={item.path}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer text-sm"
                        onClick={() => handleItemClick(item)}
                    >
                        {item.type === "directory" ? (
                            <Folder className="h-4 w-4 text-blue-500" />
                        ) : (
                            <File className="h-4 w-4 text-zinc-500" />
                        )}
                        <span className="truncate">{item.name}</span>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="p-4 text-xs text-muted-foreground text-center">
                        Empty directory
                    </div>
                )}
            </div>
        </div>
    );
}
