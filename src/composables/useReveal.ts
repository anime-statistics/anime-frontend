import type { Directive } from 'vue'

const HIDDEN_CLASS = 'reveal-hidden'
const VISIBLE_CLASS = 'reveal-visible'

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

const observed = new WeakMap<Element, IntersectionObserver>()

/**
 * Fades an element in the first time it scrolls into view. Falls back to the
 * visible state whenever IntersectionObserver or motion is unavailable.
 */
export const vReveal: Directive<HTMLElement> = {
  mounted(element) {
    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) {
      element.classList.add(VISIBLE_CLASS)
      return
    }

    element.classList.add(HIDDEN_CLASS)

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.remove(HIDDEN_CLASS)
        entry.target.classList.add(VISIBLE_CLASS)
        observer.unobserve(entry.target)
      }
    }, { rootMargin: '64px' })

    observer.observe(element)
    observed.set(element, observer)
  },

  unmounted(element) {
    observed.get(element)?.disconnect()
    observed.delete(element)
  },
}
