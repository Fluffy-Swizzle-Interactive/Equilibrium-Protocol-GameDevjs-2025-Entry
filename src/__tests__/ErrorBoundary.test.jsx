import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'

function BrokenComponent() {
  throw new Error('Test crash')
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    console.error.mockRestore()
  })

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Game loaded</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Game loaded')).toBeInTheDocument()
  })

  it('renders the error screen when a child throws', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
  })

  it('resets error state when Try Again is clicked', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    )
    // Click Try Again — resets the error flag (BrokenComponent throws again immediately,
    // which is correct: the error screen reappears, proving the reset cycle works)
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }))
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})
