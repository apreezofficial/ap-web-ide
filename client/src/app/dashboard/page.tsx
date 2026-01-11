"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Plus, Folder, Trash2, LogOut, Code2, Terminal } from "lucide-react";

interface Project {
    id: number;
    name: string;
    path: string;
    last_accessed: string;
}

export default function Dashboard() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [newProjectName, setNewProjectName] = useState("");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
        loadProjects();
    }, []);

    const checkAuth = async () => {
        try {
            const data = await fetchAPI("/auth/user.php");
            if (!data.authenticated) {
                router.push("/");
            }
        } catch (error) {
            router.push("/");
        }
    };

    const loadProjects = async () => {
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

    const handleDeleteProject = async (id: number) => {
        if (!confirm("Are you sure you want to delete this project?")) return;
        try {
            await fetchAPI("/projects/delete.php", {
                method: "POST",
                body: JSON.stringify({ id }),
            });
            loadProjects();
        } catch (error) {
            alert("Failed to delete project");
        }
    };

    const handleLogout = () => {
        window.location.href = "http://localhost/ap%20ai%20ide/server/api/auth/logout.php";
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <Code2 className="h-6 w-6" />
                        <span>AP AI IDE</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </header>

            <main className="container mx-auto py-8 px-4">
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
                    <div className="flex gap-2">
                        {/* Placeholder for future filter/sort */}
                    </div>
                </div>

                <div className="mb-8 bg-card p-6 rounded-lg border shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Create New Project</h2>
                    <div className="flex gap-4">
                        <Input
                            placeholder="Project Name (e.g. my-awesome-app)"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            className="max-w-md"
                        />
                        <Button onClick={handleCreateProject}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <Card key={project.id} className="cursor-pointer transition-shadow hover:shadow-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Folder className="h-5 w-5 text-blue-500" />
                                    {project.name}
                                </CardTitle>
                                <CardDescription>
                                    Last accessed: {new Date(project.last_accessed).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Location: /{project.path}
                                </p>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" size="sm" onClick={() => router.push(`/editor/${project.id}`)}>
                                    Open Editor
                                </Button>
                                <Button variant="destructive" size="icon" onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteProject(project.id);
                                }}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}

                    {projects.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground">
                            No projects found. Create one to get started!
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
