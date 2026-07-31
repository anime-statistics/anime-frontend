import { computed, type ComputedRef } from 'vue'
import { useIsLandscape, useIsMobile, useMediaQuery } from '@/composables/useMediaQuery'

export const MOBILE_MAX_COLUMNS = 2
export const TABLET_PORTRAIT_MAX_COLUMNS = 2
export const TABLET_LANDSCAPE_MAX_COLUMNS = 3
export const DESKTOP_MAX_COLUMNS = 12

// Wider than the shared `useIsTablet` breakpoint on purpose: an iPad in
// landscape reports exactly 1024px and still deserves tablet column limits.
const TABLET_WIDTH_QUERY = '(min-width: 768px) and (max-width: 1024px)'

export function useMaxColumns(): ComputedRef<number> {
  const isMobile = useIsMobile()
  const isTabletWidth = useMediaQuery(TABLET_WIDTH_QUERY)
  const isLandscape = useIsLandscape()

  return computed(() => {
    if (isMobile.value) return MOBILE_MAX_COLUMNS
    if (isTabletWidth.value) {
      return isLandscape.value ? TABLET_LANDSCAPE_MAX_COLUMNS : TABLET_PORTRAIT_MAX_COLUMNS
    }
    return DESKTOP_MAX_COLUMNS
  })
}
