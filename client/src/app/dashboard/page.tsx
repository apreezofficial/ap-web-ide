"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Plus, Folder, Trash2, LogOut, Code2, Terminal, Github } from "lucide-react";

interface Project {
    id: number;
    uuid: string;
    name: string;
    path: string;
    last_accessed: string;
}

export default function Dashboard() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [githubRepos, setGithubRepos] = useState<any[]>([]);
    const [newProjectName, setNewProjectName] = useState("");
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"projects" | "github">("projects");
    const [importingRepoId, setImportingRepoId] = useState<number | null>(null);
    const router = useRouter();

    const languageColors: { [key: string]: string } = {
        "JavaScript": "#f1e05a",
        "TypeScript": "#3178c6",
        "PHP": "#4F5D95",
        "Python": "#3572A5",
        "Java": "#b07219",
        "Rust": "#dea584",
        "Go": "#00ADD8",
        "C++": "#f34b7d",
        "C#": "#178600",
        "HTML": "#e34c26",
        "CSS": "#563d7c",
        "Ruby": "#701516",
        "Swift": "#F05138",
        "Kotlin": "#A97BFF",
        "Dart": "#00B4AB",
    };

    const getLanguageColor = (lang: string) => {
        return languageColors[lang] || "#8b8b8b";
    };

    useEffect(() => {
        checkAuth();
        loadProjects();
        loadGithubRepos();
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

    const loadGithubRepos = async () => {
        try {
            const data = await fetchAPI("/github/repos.php");
            setGithubRepos(data.repos || []);
        } catch (error) {
            console.error("Failed to load GitHub repos", error);
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

    const handleImportRepo = async (repo: any) => {
        setImportingRepoId(repo.id);
        try {
            const res = await fetchAPI("/projects/import_github.php", {
                method: "POST",
                body: JSON.stringify({
                    name: repo.name,
                    clone_url: repo.clone_url
                }),
            });
            if (res.success) {
                loadProjects();
                setActiveTab("projects");
                alert(`${repo.name} imported successfully!`);
            }
        } catch (error) {
            alert("Failed to import repository");
        } finally {
            setImportingRepoId(null);
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

    const handleLogout = () => {
        window.location.href = "http://localhost/ap%20ai%20ide/server/api/auth/logout.php";
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-muted-foreground animate-pulse">Loading workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <Code2 className="h-6 w-6 text-primary" />
                        <span>AP AI IDE</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:bg-destructive/10 hover:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Logout</span>
                    </Button>
                </div>
            </header>

            <main className="container mx-auto py-8 px-4 max-w-7xl">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground">Manage your projects and GitHub repositories</p>
                    </div>
                    <div className="flex bg-muted p-1 rounded-lg w-full md:w-auto overflow-x-auto">
                        <Button
                            variant={activeTab === "projects" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setActiveTab("projects")}
                            className="flex-1 md:flex-none whitespace-nowrap"
                        >
                            Your Projects
                        </Button>
                        <Button
                            variant={activeTab === "github" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setActiveTab("github")}
                            className="flex-1 md:flex-none whitespace-nowrap"
                        >
                            GitHub Repos
                        </Button>
                    </div>
                </div>

                {activeTab === "projects" ? (
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
                            {projects.map((project) => (
                                <Card key={project.id} className="group transition-all hover:shadow-lg hover:-translate-y-1 border-border bg-card overflow-hidden">
                                    <CardHeader className="pb-3 text-center sm:text-left">
                                        <div className="mx-auto sm:mx-0 w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
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
                                        <div className="bg-muted/50 p-2 rounded text-[10px] font-mono text-muted-foreground truncate">
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
                            ))}

                            {projects.length === 0 && (
                                <div className="col-span-full py-20 text-center bg-muted/20 rounded-xl border border-dashed flex flex-col items-center gap-3">
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
                ) : (
                    <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {githubRepos.length > 0 ? (
                            githubRepos.map((repo) => (
                                <Card key={repo.id} className="group border-border bg-card hover:border-primary/50 transition-colors">
                                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center flex-wrap gap-2">
                                                <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                                                    {repo.full_name}
                                                </CardTitle>
                                                {repo.private && (
                                                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-semibold uppercase text-muted-foreground border">Private</span>
                                                )}
                                            </div>
                                            <CardDescription className="line-clamp-2 mt-1 min-h-[1.2rem]">
                                                {repo.description || "No description provided"}
                                            </CardDescription>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={projects.some(p => p.name === repo.name) ? "outline" : "default"}
                                            disabled={importingRepoId === repo.id || projects.some(p => p.name === repo.name)}
                                            onClick={() => handleImportRepo(repo)}
                                            className="w-full sm:w-32 h-9"
                                        >
                                            {importingRepoId === repo.id ? (
                                                <>
                                                    <div className="h-3 w-3 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                                    Cloning...
                                                </>
                                            ) :
                                                projects.some(p => p.name === repo.name) ? "Imported" : "Import Project"}
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground pt-2">
                                            {repo.language && (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getLanguageColor(repo.language) }}></div>
                                                    {repo.language}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <span>⭐</span>
                                                {repo.stargazers_count}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span>🕒</span>
                                                Updated {new Date(repo.updated_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="py-20 text-center bg-muted/20 rounded-xl border border-dashed flex flex-col items-center gap-3">
                                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                                    <Github className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground">No GitHub repositories found or failed to load.</p>
                                <Button variant="outline" size="sm" onClick={loadGithubRepos}>Retry</Button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
