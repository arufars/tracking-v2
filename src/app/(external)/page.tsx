import Link from "next/link";

import { ArrowRight, Monitor } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Monitor className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to Studio Admin</CardTitle>
          <CardDescription className="text-base">
            Production tracking and management system for TV/Film production
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <Link href="/live-board">
              <Button size="lg" className="w-full justify-between group" variant="default">
                <span className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Live Production Board
                </span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" className="w-full justify-between group" variant="outline">
                <span>Dashboard Login</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Live Production Board is publicly accessible • Dashboard requires authentication
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
