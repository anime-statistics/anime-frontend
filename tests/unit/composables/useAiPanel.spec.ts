import { afterEach, describe, expect, it } from 'vitest'
import { useAiPanel } from '@/composables/useAiPanel'

afterEach(() => {
  useAiPanel().close()
})

describe('useAiPanel', () => {
  it('starts closed', () => {
    expect(useAiPanel().isOpen.value).toBe(false)
  })

  it('opens and closes', () => {
    const panel = useAiPanel()

    panel.open()
    expect(panel.isOpen.value).toBe(true)

    panel.close()
    expect(panel.isOpen.value).toBe(false)
  })

  it('toggles', () => {
    const panel = useAiPanel()

    panel.toggle()
    expect(panel.isOpen.value).toBe(true)

    panel.toggle()
    expect(panel.isOpen.value).toBe(false)
  })

  it('shares one state so the bottom bar and the panel stay in sync', () => {
    useAiPanel().open()

    expect(useAiPanel().isOpen.value).toBe(true)
  })
})
