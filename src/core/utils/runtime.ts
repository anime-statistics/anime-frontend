const MINUTES_PER_HOUR = 60

export interface IRuntime {
  hours: number
  minutes: number
  totalMinutes: number
}

// Announced titles carry neither an episode count nor a duration, so the total
// is unknown rather than zero.
export function totalRuntime(
  episodes: number | undefined,
  minutesPerEpisode: number | undefined,
): IRuntime | null {
  if (!episodes || !minutesPerEpisode) return null

  const totalMinutes = episodes * minutesPerEpisode
  return {
    hours: Math.floor(totalMinutes / MINUTES_PER_HOUR),
    minutes: totalMinutes % MINUTES_PER_HOUR,
    totalMinutes,
  }
}
