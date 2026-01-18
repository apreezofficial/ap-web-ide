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
import { Save, Play, X, Github, Eye, Code, Loader2, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FilePreview } from "@/components/ide/FilePreview";
import { toast } from "@/components/ui/Toaster";

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default function EditorPage({ params }: PageProps) {
    const unwrappedParams = use(params);
    const projectId = unwrappedParams.projectId; // UUID string

    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeFile, setActiveFile] = useState<string | null>(null);
    const [openFiles, setOpenFiles] = useState<string[]>([]);
    const [fileContent, setFileContent] = useState("");
    const [isDirty, setIsDirty] = useState(false);
    const [activeView, setActiveView] = useState("explorer");
    const [previewMode, setPreviewMode] = useState(false);
    const router = useRouter();

    useEffect(() => {
        loadProject();
    }, [projectId]);

    const loadProject = async () => {
        setLoading(true);
        try {
            const data = await fetchAPI(`/projects/get.php?id=${projectId}`);
            setProject(data.project);
        } catch (error) {
            console.error("Failed to load project", error);
        } finally {
            setLoading(false);
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
        // Auto-switch to preview for media/markdown if preferred? 
        // Let's keep it manual for now but maybe default to preview for images.
        if (isImage(path)) {
            setPreviewMode(true);
        } else {
            setPreviewMode(false);
        }
    };

    const isImage = (path: string) => /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(path);
    const isMarkdown = (path: string) => /\.md$/i.test(path);
    const isHtml = (path: string) => /\.html$/i.test(path);

    const getFileType = (path: string): "markdown" | "image" | "html" | "other" => {
        if (isMarkdown(path)) return "markdown";
        if (isImage(path)) return "image";
        if (isHtml(path)) return "html";
        return "other";
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
        toast.loading("Saving file...");
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
            toast.success("File saved fr fr!");
        } catch (error: any) {
            console.error("Failed to save", error);
            toast.error(error.message || "Failed to save");
        }
    };

    const handlePush = async () => {
        toast.loading("Pushing to GitHub...");
        try {
            const res = await fetchAPI("/projects/push.php", {
                method: "POST",
                body: JSON.stringify({ id: projectId }),
            });
            if (res.success) {
                toast.success("Pushed to GitHub successfully!");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to push to GitHub");
        }
    };

    // Auto-save logic
    useEffect(() => {
        if (!isDirty || !activeFile) return;

        const timer = setTimeout(() => {
            handleSave();
        }, 2000); // Auto-save after 2 seconds of inactivity

        return () => clearTimeout(timer);
    }, [fileContent, isDirty, activeFile]);

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
                            className="w-full mt-2 bg-blue-700 hover:bg-blue-600 text-white"
                            size="sm"
                            onClick={handlePush}
                            disabled={!project}
                        >
                            <Github className="h-4 w-4 mr-2" />
                            Push to GitHub
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
                            {activeFile && (getFileType(activeFile) !== "other" || isMarkdown(activeFile)) && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-8 w-8 text-[#cccccc] hover:bg-[#333]", previewMode && "bg-[#333] text-white")}
                                    onClick={() => setPreviewMode(!previewMode)}
                                    title={previewMode ? "Show Code" : "Show Preview"}
                                >
                                    {previewMode ? <Code className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            )}
                            {!previewMode && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-[#cccccc] hover:bg-[#333]"
                                    onClick={() => {
                                        // We'll need a way to trigger formatting in the child.
                                        // For now, let's just use the shortcut message or a custom event.
                                        const event = new CustomEvent('ide-format-code');
                                        window.dispatchEvent(event);
                                    }}
                                    title="Format Code"
                                >
                                    <Wand2 className="h-4 w-4" />
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#cccccc] hover:bg-[#333]" onClick={handleSave} disabled={!isDirty}>
                                <Save className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Editor or Preview */}
                    <div className="flex-1 relative overflow-hidden">
                        {loading ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : activeFile ? (
                            previewMode ? (
                                <FilePreview
                                    projectId={projectId}
                                    path={activeFile}
                                    content={fileContent}
                                    type={getFileType(activeFile)}
                                />
                            ) : (
                                <EditorComponent
                                    content={fileContent}
                                    onChange={(val) => {
                                        setFileContent(val);
                                        setIsDirty(true);
                                    }}
                                    onSave={handleSave}
                                    language={
                                        activeFile.endsWith('.php') ? 'php' :
                                            activeFile.endsWith('.js') ? 'javascript' :
                                                activeFile.endsWith('.ts') ? 'typescript' :
                                                    activeFile.endsWith('.tsx') ? 'typescript' :
                                                        activeFile.endsWith('.css') ? 'css' :
                                                            activeFile.endsWith('.html') ? 'html' :
                                                                activeFile.endsWith('.json') ? 'json' :
                                                                    activeFile.endsWith('.md') ? 'markdown' :
                                                                        'plaintext'
                                    }
                                />
                            )
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
