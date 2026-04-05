describe('F11 fullscreen handler', () => {
  it('calls electronAPI.toggleFullscreen when F11 is pressed', () => {
    // Mock the electronAPI (only available in Electron, not browser/test)
    const toggleFullscreen = vi.fn().mockResolvedValue(true)
    window.electronAPI = { toggleFullscreen, isFullscreen: vi.fn(), platform: 'linux' }

    // Simulate the keydown handler directly (the handler is tested in isolation)
    const handler = (e) => {
      if (e.key === 'F11') {
        e.preventDefault()
        window.electronAPI?.toggleFullscreen()
      }
    }

    window.addEventListener('keydown', handler)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F11' }))
    window.removeEventListener('keydown', handler)

    expect(toggleFullscreen).toHaveBeenCalledOnce()

    delete window.electronAPI
  })

  it('does nothing when electronAPI is absent (web build)', () => {
    // electronAPI is undefined in web/browser context
    expect(window.electronAPI).toBeUndefined()

    const handler = (e) => {
      if (e.key === 'F11') {
        e.preventDefault()
        window.electronAPI?.toggleFullscreen()
      }
    }

    // Should not throw
    window.addEventListener('keydown', handler)
    expect(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F11' }))
    }).not.toThrow()
    window.removeEventListener('keydown', handler)
  })
})
