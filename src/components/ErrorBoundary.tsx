import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-inter">
                    <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full border border-slate-100">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h1>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            We encountered an unexpected error. Don't worry, your data is safe.
                        </p>
                        <div className="p-4 bg-slate-50 rounded-xl mb-6 text-left border border-slate-100">
                            <code className="text-[10px] text-slate-400 break-all block">
                                {this.state.error?.message || "Unknown Error"}
                            </code>
                        </div>
                        <Button
                            onClick={() => window.location.reload()}
                            className="w-full bg-slate-900 hover:bg-black text-white rounded-xl h-12 font-bold shadow-lg"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reload Page
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
