import { Component } from 'react'

/**
 * Catches uncaught errors in the Phaser/React game tree.
 * Shows a recovery screen instead of a blank canvas.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Game crashed:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100vw',
          height: '100vh',
          background: '#0a0a1a',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          gap: '16px',
        }}>
          <h2 style={{ margin: 0 }}>Something went wrong</h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)' }}>
            Please restart the game. If this keeps happening, check the error log.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: '10px 24px',
              background: 'transparent',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.87)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
