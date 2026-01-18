"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Github, RefreshCw } from "lucide-react";

export default function ReposPage() {
    const [githubRepos, setGithubRepos] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [reposData, projectsData] = await Promise.all([
                fetchAPI("/github/repos.php"),
                fetchAPI("/projects/list.php")
            ]);
            setGithubRepos(reposData.repos || []);
            setProjects(projectsData.projects || []);
        } catch (error) {
            console.error("Failed to load GitHub repos", error);
        } finally {
            setLoading(false);
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
                router.push("/dashboard/projects");
            }
        } catch (error) {
            alert("Failed to import repository");
        } finally {
            setImportingRepoId(null);
        }
    };

    return (
        <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="border-border bg-card">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-6 w-1/3" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                            <Skeleton className="h-9 w-full sm:w-32" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 pt-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : githubRepos.length > 0 ? (
                githubRepos.map((repo) => (
                    <Card key={repo.id} className="group border-border bg-card hover:border-primary/50 transition-all hover:shadow-md">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                            <div className="flex-1">
                                <div className="flex items-center flex-wrap gap-2">
                                    <Github className="h-4 w-4 text-muted-foreground mr-1" />
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
                                variant={projects.some((p: any) => p.name === repo.name) ? "outline" : "default"}
                                disabled={importingRepoId === repo.id || projects.some((p: any) => p.name === repo.name)}
                                onClick={() => handleImportRepo(repo)}
                                className="w-full sm:w-32 h-9 shadow-sm"
                            >
                                {importingRepoId === repo.id ? (
                                    <>
                                        <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                                        Cloning...
                                    </>
                                ) :
                                    projects.some((p: any) => p.name === repo.name) ? "Imported" : "Import Project"}
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
                                <div className="flex items-center gap-1 text-xs outline-none">
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
                    <Button variant="outline" size="sm" onClick={loadData}>Retry</Button>
                </div>
            )}
        </div>
    );
}
