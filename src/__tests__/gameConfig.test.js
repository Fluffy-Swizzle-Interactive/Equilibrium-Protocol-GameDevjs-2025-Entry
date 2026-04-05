import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Phaser game config', () => {
  it('main.js includes Phaser.Scale.FIT in the scale config', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/game/main.js'), 'utf8')
    expect(src).toContain('Phaser.Scale.FIT')
    expect(src).toContain('autoCenter')
  })
})
