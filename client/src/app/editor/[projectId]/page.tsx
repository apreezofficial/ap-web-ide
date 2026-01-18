"use client";

import { useEffect, useState, use } from "react";
import { FileExplorer } from "@/components/ide/FileExplorer";
import { ActivityBar } from "@/components/ide/ActivityBar";
import { StatusBar } from "@/components/ide/StatusBar";
import { EditorTabs } from "@/components/ide/EditorTabs";
import { EditorComponent } from "@/components/ide/Editor";
// import { TerminalComponent } from "@/components/ide/Terminal";
import { SourceControl } from "@/components/ide/SourceControl";
import { Search } from "@/components/ide/Search";
import { AIAssistant } from "@/components/ide/AIAssistant";
import { fetchAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Save, Play, X, Github, Eye, Code, Loader2, Wand2, ChevronUp, ChevronDown, Bot, Files } from "lucide-react";
import dynamic from 'next/dynamic';

const TerminalComponent = dynamic(() => import('@/components/ide/Terminal').then(mod => mod.TerminalComponent), {
    ssr: false,
    loading: () => <div className="h-full bg-zinc-950 text-zinc-500 p-2">Loading terminal...</div>
});
// Imports already declared above, removing duplicates
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FilePreview } from "@/components/ide/FilePreview";
import { toast } from "@/components/ui/Toaster";

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default function EditorPage({ params }: PageProps) {
    const { projectId } = use(params);
    const router = useRouter();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('explorer');
    const [activeFile, setActiveFile] = useState<string | null>(null);
    const [openFiles, setOpenFiles] = useState<string[]>([]);
    const [fileContent, setFileContent] = useState<string>("");
    const [isDirty, setIsDirty] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    // Terminal State
    const [terminalHeight, setTerminalHeight] = useState(250);
    const [isTerminalOpen, setIsTerminalOpen] = useState(true);
    const [isResizingTerminal, setIsResizingTerminal] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingTerminal) return;
            const newHeight = window.innerHeight - e.clientY;
            // Min height 30px (header), max height 80% of screen
            if (newHeight >= 30 && newHeight < window.innerHeight * 0.8) {
                setTerminalHeight(newHeight);
            }
        };

        const handleMouseUp = () => {
            setIsResizingTerminal(false);
            document.body.style.cursor = 'default';
        };

        if (isResizingTerminal) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'row-resize';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [isResizingTerminal]);

    useEffect(() => {
        if (projectId) {
            fetchProject();
        }
    }, [projectId]);

    const fetchProject = async () => {
        try {
            const data = await fetchAPI(`/projects/get.php?id=${projectId}`);
            setProject(data);
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to load project");
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (path: string) => {
        if (!openFiles.includes(path)) {
            setOpenFiles([...openFiles, path]);
        }
        setActiveFile(path);
        setLoading(true);
        try {
            const data = await fetchAPI(`/files/read.php?project_id=${projectId}&path=${path}`);
            setFileContent(data.content || "");
            setIsDirty(false);
        } catch (error: any) {
            toast.error("Failed to read file");
        } finally {
            setLoading(false);
        }
    };

    const handleCloseFile = (path: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const newOpenFiles = openFiles.filter(f => f !== path);
        setOpenFiles(newOpenFiles);
        if (activeFile === path) {
            setActiveFile(newOpenFiles[newOpenFiles.length - 1] || null);
            setFileContent("");
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
                    content: fileContent
                })
            });
            setIsDirty(false);
            toast.success("File saved");
        } catch (error: any) {
            toast.error("Failed to save file");
        }
    };

    const handlePush = async () => {
        toast.loading("Pushing to GitHub...");
        try {
            const res = await fetchAPI("/github/push.php", {
                method: "POST",
                body: JSON.stringify({ project_id: projectId }),
            });
            if (res.success) {
                toast.success("Pushed to GitHub successfully!");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to push to GitHub");
        }
    };

    const getFileType = (path: string): "image" | "code" | "markdown" | "html" | "other" => {
        const ext = path.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) return 'image';
        if (['md'].includes(ext || '')) return 'markdown';
        if (['html'].includes(ext || '')) return 'html';
        return 'code';
    };

    const isMarkdown = (path: string) => path.endsWith('.md');

    const handleSearchResultClick = (path: string, line: number) => {
        // Open file functionality
        if (!openFiles.includes(path)) {
            setOpenFiles([...openFiles, path]);
        }
        setActiveFile(path);
        // Ideally we would scroll to the line number too, but for now just opening is good.
        // We can implement scroll later if needed.
    };

    // ... (existing effects)

    // Mobile State
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileActiveView, setMobileActiveView] = useState<string | null>(null); // For "popups"

    // When view changes on desktop, it's just activeView. On mobile, we might want to open the "sheet"
    const handleViewChange = (view: string) => {
        setActiveView(view);
        setMobileActiveView(view); // On mobile this triggers the popup
    };

    return (
        <div className="flex h-screen w-full flex-col overflow-hidden bg-[#1e1e1e] text-[#cccccc]">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-2 bg-[#252526] border-b border-[#2b2b2b]">
                <div className="flex items-center gap-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <Files className="h-5 w-5" />
                    <span className="font-bold text-sm">AP IDE</span>
                </div>
                {/* Quick Actions Mobile */}
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleViewChange('ai')}><Bot className="h-5 w-5 text-yellow-500" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleViewChange('explorer')}><Files className="h-5 w-5" /></Button>
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* Desktop Sidebar & Activity Bar */}
                <div className="hidden md:flex flex-row h-full">
                    <ActivityBar activeView={activeView} onViewChange={setActiveView} />

                    <div className={cn(
                        "flex flex-col border-r border-[#2b2b2b] bg-[#252526] transition-all duration-300 w-64",
                        // On desktop always visible if activeView is set (conceptually)
                        // For now we just keep the sidebar always open on desktop
                    )}>
                        {activeView === 'explorer' ? (
                            <>
                                <FileExplorer
                                    projectId={projectId}
                                    onFileSelect={handleFileSelect}
                                    activeFile={activeFile}
                                />
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
                            </>
                        ) : activeView === 'search' ? (
                            <Search projectId={projectId} onResultClick={handleSearchResultClick} />
                        ) : activeView === 'git' ? (
                            <SourceControl projectId={projectId} />
                        ) : activeView === 'ai' ? (
                            <AIAssistant activeFileContent={fileContent} activeFilePath={activeFile || undefined} />
                        ) : (
                            <div className="flex-1 p-4 text-sm text-[#858585]">
                                View {activeView} is not implemented yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Drawer / Popup Overlay */}
                {mobileActiveView && (
                    <div className="md:hidden absolute inset-0 z-50 bg-[#1e1e1e] flex flex-col animate-in slide-in-from-bottom-full duration-200">
                        {/* Popup Header */}
                        <div className="flex items-center justify-between p-3 border-b border-[#2b2b2b] bg-[#252526]">
                            <span className="font-bold uppercase text-sm">{mobileActiveView}</span>
                            <Button variant="ghost" size="sm" onClick={() => setMobileActiveView(null)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        {/* Popup Content */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            {mobileActiveView === 'explorer' ? (
                                <FileExplorer
                                    projectId={projectId}
                                    onFileSelect={(path) => {
                                        handleFileSelect(path);
                                        setMobileActiveView(null); // Close on select
                                    }}
                                    activeFile={activeFile}
                                />
                            ) : mobileActiveView === 'search' ? (
                                <Search projectId={projectId} onResultClick={(path, line) => {
                                    handleSearchResultClick(path, line);
                                    setMobileActiveView(null);
                                }} />
                            ) : mobileActiveView === 'git' ? (
                                <SourceControl projectId={projectId} />
                            ) : mobileActiveView === 'ai' ? (
                                <AIAssistant activeFileContent={fileContent} activeFilePath={activeFile || undefined} />
                            ) : null}

                            {/* Mobile Project Actions if in Explorer */}
                            {mobileActiveView === 'explorer' && (
                                <div className="p-4 border-t border-[#2b2b2b]">
                                    <Button className="w-full mb-2" onClick={handlePush}><Github className="mr-2 h-4 w-4" /> Push</Button>
                                    <Button className="w-full" variant="secondary" onClick={() => setMobileActiveView(null)}>Close</Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {/* Editor Area */}
                <div className="flex flex-1 flex-col bg-[#1e1e1e] w-full min-w-0">
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
                    <div
                        className="border-t border-[#2b2b2b] bg-[#1e1e1e] flex flex-col relative transition-all ease-out duration-75"
                        style={{ height: isTerminalOpen ? terminalHeight : 30 }}
                    >
                        {/* Resize Handle only on desktop really, but works on mobile touch too */}
                        <div
                            className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-[#007acc] z-10"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                setIsResizingTerminal(true);
                            }}
                            onTouchStart={() => setIsResizingTerminal(true)}
                        />

                        {/* Header */}
                        <div className="flex items-center gap-4 px-4 h-[30px] text-xs uppercase border-b border-[#2b2b2b] text-[#969696] bg-[#1e1e1e] shrink-0">
                            <span
                                className="cursor-pointer hover:text-white border-b border-white text-white h-full flex items-center"
                                onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                            >
                                Terminal
                            </span>
                            <div className="flex-1" />
                            <div
                                className="cursor-pointer hover:text-white"
                                onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                            >
                                {isTerminalOpen ? <X className="h-3 w-3" /> : <div className="h-3 w-3 border border-current rounded-sm" />}
                            </div>
                        </div>

                        {/* Body */}
                        <div className={cn("flex-1 overflow-hidden", !isTerminalOpen && "hidden")}>
                            <TerminalComponent projectId={projectId} />
                        </div>
                    </div>
                </div>

            </div>

            <StatusBar />
        </div>
    );
}
