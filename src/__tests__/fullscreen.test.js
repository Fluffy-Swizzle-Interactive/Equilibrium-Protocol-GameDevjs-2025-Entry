describe('F11 fullscreen handler', () => {
  it('calls electronAPI.toggleFullscreen and prevents default when Electron is present', () => {
    const toggleFullscreen = vi.fn().mockResolvedValue(true)
    window.electronAPI = { toggleFullscreen, isFullscreen: vi.fn(), platform: 'linux' }

    const handler = (e) => {
      if (e.key === 'F11' && window.electronAPI) {
        e.preventDefault()
        window.electronAPI.toggleFullscreen()
      }
    }

    const event = new KeyboardEvent('keydown', { key: 'F11', cancelable: true })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    window.addEventListener('keydown', handler)
    window.dispatchEvent(event)
    window.removeEventListener('keydown', handler)

    expect(toggleFullscreen).toHaveBeenCalledOnce()
    expect(preventDefaultSpy).toHaveBeenCalledOnce()

    delete window.electronAPI
  })

  it('does not preventDefault and lets event fall through in web builds', () => {
    // electronAPI is undefined — browser should handle F11 natively
    expect(window.electronAPI).toBeUndefined()

    const handler = (e) => {
      if (e.key === 'F11' && window.electronAPI) {
        e.preventDefault()
        window.electronAPI.toggleFullscreen()
      }
    }

    const event = new KeyboardEvent('keydown', { key: 'F11', cancelable: true })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    window.addEventListener('keydown', handler)
    window.dispatchEvent(event)
    window.removeEventListener('keydown', handler)

    expect(preventDefaultSpy).not.toHaveBeenCalled()
  })
})
