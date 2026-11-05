/**
 * Normalizes requested season and episode coordinates against an anime's actual season structure.
 * Pure mathematical utility safe for both SSR and client bundle environments.
 * 
 * Automatically handles:
 * 1. Absolute episode numbers (e.g. Ep 1096 requested with Season 1 or without season parameter)
 * 2. Seasonal coordinates (e.g. Season 22 Episode 8 -> absolute 1096)
 * 3. Prevents out-of-bounds math (e.g. 1088 + 1096 = 2184 bug)
 */
export function normalizeAnimeEpisodeCoordinates(
  seasons: { season_number: number; episode_count?: number }[] | undefined,
  requestedSeason: number = 1,
  requestedEpisode: number = 1
): { season: number; episode: number; absoluteEpisode: number } {
  const reqS = isNaN(requestedSeason) || requestedSeason < 1 ? 1 : requestedSeason;
  const reqEp = isNaN(requestedEpisode) || requestedEpisode < 1 ? 1 : requestedEpisode;

  const valid = seasons && seasons.length > 0 ? seasons.filter((s) => s.season_number > 0) : [];
  if (valid.length <= 1) {
    return {
      season: 1,
      episode: reqEp,
      absoluteEpisode: reqEp,
    };
  }

  const currentSeasonObj = valid.find((s) => s.season_number === reqS) || valid[0];
  const maxEpForSeason = currentSeasonObj?.episode_count || 50;

  // If requestedEpisode exceeds this season's count, or requestedSeason is 1 and ep > s1 count:
  if (reqEp > maxEpForSeason) {
    let running = 0;
    for (const s of valid) {
      const count = s.episode_count || 0;
      if (running + count >= reqEp) {
        return {
          season: s.season_number,
          episode: Math.max(1, reqEp - running),
          absoluteEpisode: reqEp,
        };
      }
      running += count;
    }
    const last = valid[valid.length - 1];
    const priorToLast = running - (last.episode_count || 0);
    return {
      season: last.season_number,
      episode: Math.max(1, reqEp - priorToLast),
      absoluteEpisode: reqEp,
    };
  }

  let priorCount = 0;
  for (const s of valid) {
    if (s.season_number < reqS) {
      priorCount += s.episode_count || 0;
    }
  }

  return {
    season: reqS,
    episode: reqEp,
    absoluteEpisode: Math.max(1, priorCount + reqEp),
  };
}

