import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n";
import ErrorBoundary from "@/components/ErrorBoundary"; // Import ErrorBoundary

console.log('Mounting React App...');

try {
    const rootElement = document.getElementById("root");
    if (!rootElement) throw new Error("Root element not found");

    createRoot(rootElement).render(
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    );
} catch (error) {
    console.error("Failed to mount React app:", error);
    document.body.innerHTML = `<div style="color: red; padding: 20px;"><h1>App Failed to Start</h1><pre>${error instanceof Error ? error.message : String(error)}</pre></div>`;
}
