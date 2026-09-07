import { Component, ErrorInfo, ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-8 text-center bg-bg-card border border-border rounded-xl m-4">
            <h2 className="text-xl font-bold text-red-600 mb-2 font-cormorant italic">
              Что-то пошло не так
            </h2>
            <p className="text-text-secondary font-assistant text-sm mb-4">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-brand text-white rounded font-tenor text-xs uppercase tracking-leif font-semibold"
            >
              Попробовать снова
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
