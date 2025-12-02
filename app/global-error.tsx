"use client"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html>
            <body>
                <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
                    <div className="text-center space-y-4 max-w-md">
                        <h1 className="text-2xl font-bold text-white">Application Error</h1>
                        <p className="text-slate-400">{error.message || "An unexpected error occurred"}</p>
                        <button
                            onClick={reset}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    )
}

