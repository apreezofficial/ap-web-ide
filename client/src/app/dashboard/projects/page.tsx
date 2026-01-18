"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Plus, Folder, Trash2 } from "lucide-react";

interface Project {
    id: number;
    uuid: string;
    name: string;
    path: string;
    last_accessed: string;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [newProjectName, setNewProjectName] = useState("");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const data = await fetchAPI("/projects/list.php");
            setProjects(data.projects || []);
        } catch (error) {
            console.error("Failed to load projects", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectName) return;
        try {
            const res = await fetchAPI("/projects/create.php", {
                method: "POST",
                body: JSON.stringify({ name: newProjectName }),
            });
            if (res.success) {
                setNewProjectName("");
                loadProjects();
            }
        } catch (error) {
            alert("Failed to create project");
        }
    };

    const handleDeleteProject = async (uuid: string) => {
        if (!confirm("Are you sure you want to delete this project?")) return;
        try {
            await fetchAPI("/projects/delete.php", {
                method: "POST",
                body: JSON.stringify({ id: uuid }),
            });
            loadProjects();
        } catch (error) {
            alert("Failed to delete project");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card p-6 rounded-xl border shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Create New Project</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                        placeholder="Project Name (e.g. my-awesome-app)"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        className="flex-1"
                    />
                    <Button onClick={handleCreateProject} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Create
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden border-border bg-card">
                            <CardHeader className="pb-3">
                                <Skeleton className="h-10 w-10 rounded-lg mb-2" />
                                <Skeleton className="h-6 w-3/4 mb-1" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent className="pb-3">
                                <Skeleton className="h-8 w-full rounded" />
                            </CardContent>
                            <CardFooter className="flex gap-2 pt-0">
                                <Skeleton className="h-9 flex-1" />
                                <Skeleton className="h-9 w-9 rounded-md" />
                            </CardFooter>
                        </Card>
                    ))
                ) : projects.length > 0 ? (
                    projects.map((project) => (
                        <Card key={project.id} className="group transition-all hover:shadow-lg hover:-translate-y-1 border-border bg-card overflow-hidden">
                            <CardHeader className="pb-3 text-center sm:text-left">
                                <div className="mx-auto sm:mx-0 w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2 group-hover:bg-blue-500/20 transition-colors">
                                    <Folder className="h-6 w-6 text-blue-500" />
                                </div>
                                <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors truncate">
                                    {project.name}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Last accessed: {new Date(project.last_accessed).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-3">
                                <div className="bg-muted/50 p-2 rounded text-[10px] font-mono text-muted-foreground truncate group-hover:bg-muted transition-colors">
                                    /{project.path}
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-2 pt-0">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => router.push(`/editor/${project.uuid}`)}
                                    className="flex-1"
                                >
                                    Open Editor
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteProject(project.uuid);
                                    }}
                                    className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-muted/20 rounded-xl border border-dashed flex flex-col items-center gap-3 animate-in zoom-in-95 duration-300">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                            <Folder className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-semibold">No projects yet</p>
                            <p className="text-sm text-muted-foreground">Create your first project or import from GitHub.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
