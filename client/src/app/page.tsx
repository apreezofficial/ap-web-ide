"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Github, Code2, Loader2 } from "lucide-react";
import { fetchAPI } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await fetchAPI("/auth/user.php");
      if (data.authenticated) {
        router.push("/dashboard/projects");
      } else {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-[400px] shadow-xl border-t-4 border-t-primary">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
            <Code2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">AP IDE</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Cloud-based development environment
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4">
            <Button className="w-full h-11 text-base font-semibold transition-all hover:scale-[1.02]" asChild>
              <a href="http://localhost/ap%20ai%20ide/server/api/auth/login.php">
                <Github className="mr-2 h-5 w-5" />
                Sign in with GitHub
              </a>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 border-t bg-muted/50 p-6 text-center text-xs text-muted-foreground">
          <p>By signing in, you agree to our Terms of Service.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
