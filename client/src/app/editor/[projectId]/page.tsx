"use client";

import { useEffect, useState, use } from "react";
import { FileExplorer } from "@/components/ide/FileExplorer";
import { EditorComponent } from "@/components/ide/Editor";
import { TerminalComponent } from "@/components/ide/Terminal";
import { fetchAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Save, Play } from "lucide-react";
import { useRouter } from "next/navigation";

// Since this is a Client Component, we need to unwrap params with React.use() in Next 15+ or 
// just use the prop if it's passed as a Promise (in some setups). 
// However, in standard Next.js App Router for page.tsx, params is a Promise.
// Let's assume params is a Promise as per latest Next.js conventions.

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default function EditorPage({ params }: PageProps) {
    // Unwrap params using React.use() hook (available in Next.js 13+ / React 18+)
    const unwrappedParams = use(params);
    const projectId = parseInt(unwrappedParams.projectId);

    const [project, setProject] = useState<any>(null);
    const [activeFile, setActiveFile] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState("");
    const [isDirty, setIsDirty] = useState(false);
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

    // Load file content when activeFile changes
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
            // alert("Saved!");
        } catch (error) {
            alert("Failed to save");
        }
    };

    return (
        <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
            {/* Top Bar */}
            <div className="flex h-12 items-center justify-between border-b px-4 bg-zinc-100 dark:bg-zinc-900">
                <div className="font-semibold">Project ID: {projectId}</div>
                <div className="flex items-center gap-2">
                    {activeFile && (
                        <span className="text-sm text-muted-foreground mr-4">
                            {activeFile} {isDirty ? "*" : ""}
                        </span>
                    )}
                    <Button size="sm" variant="ghost" onClick={handleSave} disabled={!isDirty}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                    </Button>
                    <Button size="sm" variant="default" onClick={() => project && window.open(project.web_url, '_blank')} disabled={!project}>
                        <Play className="h-4 w-4 mr-2" />
                        Preview
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => router.push('/dashboard')}>
                        Dashboard
                    </Button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <FileExplorer
                    projectId={projectId}
                    onFileSelect={(path) => setActiveFile(path)}
                />

                {/* Editor Area */}
                <div className="flex flex-1 flex-col">
                    <div className="flex-1 border-b relative">
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
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                Select a file to edit
                            </div>
                        )}
                    </div>

                    {/* Terminal */}
                    <div className="h-48 border-t">
                        <TerminalComponent />
                    </div>
                </div>
            </div>
        </div>
    );
}
