import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Github } from "lucide-react";

export default function Home() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Card className="w-[350px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">AP AI IDE</CardTitle>
          <CardDescription>
            Cloud-based development environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button className="w-full" asChild>
              <a href="http://localhost/ap%20ai%20ide/server/api/auth/login.php">
                <Github className="mr-2 h-4 w-4" />
                Sign in with GitHub
              </a>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center text-xs text-muted-foreground">
          By signing in, you agree to our Terms of Service.
        </CardFooter>
      </Card>
    </div>
  );
}
