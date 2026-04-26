"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/utils/logger";

interface State {
  hasError: boolean;
  error?: Error;
}

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    logger.error("react.error_boundary_caught", {
      error: { name: error.name, message: error.message, stack: error.stack },
      componentStack: info.componentStack,
    });
  }

  reset = () => this.setState({ hasError: false, error: undefined });

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center gap-4 border border-rule bg-ivory p-8 text-center">
          <AlertCircle className="h-8 w-8 text-rust" aria-hidden />
          <div>
            <h3 className="font-serif text-xl font-medium text-text">
              Something broke.
            </h3>
            <p className="mt-1 text-sm text-text-2">
              {this.state.error?.message ?? "Unexpected error"}
            </p>
          </div>
          <Button variant="ghost" onClick={this.reset}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
