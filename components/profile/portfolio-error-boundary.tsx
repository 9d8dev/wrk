"use client";

import { Component, type ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
}

export class PortfolioErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("Portfolio error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				this.props.fallback || (
					<div className="flex items-center justify-center py-24">
						<div className="text-center space-y-4">
							<h2 className="text-lg font-medium">Something went wrong</h2>
							<p className="text-muted-foreground">
								Unable to load portfolio. Please try again later.
							</p>
							<button
								type="button"
								className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
								onClick={() =>
									this.setState({ hasError: false, error: undefined })
								}
							>
								Try again
							</button>
						</div>
					</div>
				)
			);
		}

		return this.props.children;
	}
}
