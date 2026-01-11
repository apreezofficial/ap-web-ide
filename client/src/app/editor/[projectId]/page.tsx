"use client";

import { useEffect, useState, use } from "react";
import { FileExplorer } from "@/components/ide/FileExplorer";
import { ActivityBar } from "@/components/ide/ActivityBar";
import { StatusBar } from "@/components/ide/StatusBar";
import { EditorTabs } from "@/components/ide/EditorTabs";
import { EditorComponent } from "@/components/ide/Editor";
import { TerminalComponent } from "@/components/ide/Terminal";
import { fetchAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Save, Play, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default function EditorPage({ params }: PageProps) {
    const unwrappedParams = use(params);
    const projectId = parseInt(unwrappedParams.projectId);

    const [project, setProject] = useState<any>(null);
    const [activeFile, setActiveFile] = useState<string | null>(null);
    const [openFiles, setOpenFiles] = useState<string[]>([]);
    const [fileContent, setFileContent] = useState("");
    const [isDirty, setIsDirty] = useState(false);
    const [activeView, setActiveView] = useState("explorer");
    const router = useRouter();

    useEffect(() => {
        loadProject();
    }, [projectId]);

    const loadProject = async () => {
        try {
            const data = await fetchAPI(`/projects/get.php?id=${projectId}`);
            setProject(data.project);
        } catch (error) {
            console.error("Failed to load project", error);
        }
    };

    useEffect(() => {
        if (!activeFile) return;
        loadContent(activeFile);
    }, [activeFile]);

    const loadContent = async (path: string) => {
        try {
            const data = await fetchAPI(`/files/read.php?project_id=${projectId}&path=${path}`);
            setFileContent(data.content);
            setIsDirty(false);
        } catch (error) {
            console.error("Failed to load file", error);
        }
    };

    const handleFileSelect = (path: string) => {
        setActiveFile(path);
        if (!openFiles.includes(path)) {
            setOpenFiles([...openFiles, path]);
        }
    };

    const handleCloseFile = (path: string) => {
        const newOpenFiles = openFiles.filter(f => f !== path);
        setOpenFiles(newOpenFiles);
        if (activeFile === path) {
            if (newOpenFiles.length > 0) {
                setActiveFile(newOpenFiles[newOpenFiles.length - 1]);
            } else {
                setActiveFile(null);
            }
        }
    };

    const handleSave = async () => {
        if (!activeFile) return;
        try {
            await fetchAPI("/files/write.php", {
                method: "POST",
                body: JSON.stringify({
                    project_id: projectId,
                    path: activeFile,
                    content: fileContent,
                }),
            });
            setIsDirty(false);
        } catch (error) {
            alert("Failed to save");
        }
    };

    return (
        <div className="flex h-screen w-full flex-col overflow-hidden bg-[#1e1e1e] text-[#cccccc]">
            {/* Top Bar (Optional, simpler in this layout) */}
            {/* We can hide the top bar or make it very slim if we want true VS Code full screen feel, 
          but we need a way to go back to dashboard and preview. Let's keep a very slim header or putting it in status bar?
          Let's put it in the top for now but styled dark. */}

            {/* Main Workspace */}
            <div className="flex flex-1 overflow-hidden">

                {/* Activity Bar */}
                <ActivityBar activeView={activeView} onViewChange={setActiveView} />

                {/* Sidebar */}
                <div className={cn("flex w-64 flex-col border-r border-[#2b2b2b] bg-[#252526]", activeView === 'explorer' ? 'block' : 'hidden')}>
                    <FileExplorer
                        projectId={projectId}
                        onFileSelect={handleFileSelect}
                        activeFile={activeFile}
                    />

                    {/* Preview Button in Sidebar for convenience */}
                    <div className="p-4 border-t border-[#2b2b2b]">
                        <Button
                            className="w-full bg-green-700 hover:bg-green-600 text-white"
                            size="sm"
                            onClick={() => project && window.open(project.web_url, '_blank')}
                            disabled={!project}
                        >
                            <Play className="h-4 w-4 mr-2" />
                            Run Project
                        </Button>
                        <Button
                            className="w-full mt-2"
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/dashboard')}
                        >
                            Back to Dashboard
                        </Button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex flex-1 flex-col bg-[#1e1e1e]">
                    {/* Tabs */}
                    <div className="flex bg-[#252526]">
                        <div className="flex-1 overflow-x-auto no-scrollbar">
                            <EditorTabs
                                files={openFiles}
                                activeFile={activeFile}
                                onSelect={handleFileSelect}
                                onClose={handleCloseFile}
                                unsavedFiles={activeFile && isDirty ? [activeFile] : []}
                            />
                        </div>
                        {/* Actions Grid */}
                        <div className="flex items-center gap-1 px-2 border-l border-[#2b2b2b]">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#cccccc] hover:bg-[#333]" onClick={handleSave} disabled={!isDirty}>
                                <Save className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="flex-1 relative">
                        {activeFile ? (
                            <EditorComponent
                                content={fileContent}
                                onChange={(val) => {
                                    setFileContent(val);
                                    setIsDirty(true);
                                }}
                                onSave={handleSave}
                                language={activeFile.endsWith('.php') ? 'php' : activeFile.endsWith('.js') ? 'javascript' : activeFile.endsWith('.css') ? 'css' : 'plaintext'}
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-[#585858] flex-col gap-4">
                                <div className="text-xl">Select a file to edit</div>
                            </div>
                        )}
                    </div>

                    {/* Terminal Panel */}
                    <div className="h-48 border-t border-[#2b2b2b] bg-[#1e1e1e] flex flex-col">
                        <div className="flex items-center gap-4 px-4 py-1 text-xs uppercase border-b border-[#2b2b2b] text-[#969696] bg-[#1e1e1e]">
                            <span className="cursor-pointer hover:text-white border-b border-white text-white py-1">Terminal</span>
                            <div className="flex-1" />
                            <X className="h-3 w-3 cursor-pointer hover:text-white" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <TerminalComponent />
                        </div>
                    </div>
                </div>
            </div>

            <StatusBar />
        </div>
    );
}
