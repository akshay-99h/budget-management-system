"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("Application error:", error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
            <Card className="w-full max-w-md backdrop-blur-xl bg-slate-900/80 border-slate-800/50 shadow-2xl">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
                        <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-semibold text-white">Something went wrong</CardTitle>
                    <CardDescription className="text-slate-400">
                        {error.message || "An unexpected error occurred"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={reset}
                            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try again
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/">
                                <Home className="mr-2 h-4 w-4" />
                                Go home
                            </Link>
                        </Button>
                    </div>
                    {process.env.NODE_ENV === "development" && (
                        <details className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                            <summary className="text-sm text-slate-400 cursor-pointer mb-2">
                                Error details (development only)
                            </summary>
                            <pre className="text-xs text-slate-300 overflow-auto">
                                {error.stack || error.message}
                            </pre>
                        </details>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

