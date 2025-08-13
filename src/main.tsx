import { createRoot } from 'react-dom/client'
import './index.css'

// Simple error boundary
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

class SimpleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Something went wrong.</h1>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Lazy load the app to catch import errors
import('./App.tsx').then(({ default: App }) => {
  createRoot(document.getElementById("root")!).render(
    <SimpleErrorBoundary>
      <App />
    </SimpleErrorBoundary>
  )
}).catch(error => {
  console.error('Failed to load app:', error)
  document.getElementById("root")!.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h1>Failed to load application</h1>
      <p>Error: ${error.message}</p>
      <button onclick="window.location.reload()">Try Again</button>
    </div>
  `
})
