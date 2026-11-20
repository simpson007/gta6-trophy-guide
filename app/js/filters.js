/* Filters: by kind, by search text, and the spoiler setting.
   Kinds are the tracker's own: story, strangers, collectibles, activities, crime, misc.
   "Missable" is a virtual kind holding the trophies flagged missable. There are no
   online trophies in this game, so no online filter is offered. */

export const KINDS = ['all', 'story', 'stranger', 'collectible', 'activity', 'crime', 'misc', 'missable'];

/** Whether a trophy passes the chosen kind filter. */
export function matchesKind(trophy, kind) {
  if (kind === 'all') return true;
  if (kind === 'missable') return trophy.missable === true;
  return trophy.kind === kind;
}

/** Whether a trophy matches the search text (name, description, chapter, or id). */
export function matchesQuery(trophy, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;
  const haystack = [trophy.name, trophy.desc, trophy.chapter || '', trophy.id, trophy.kind]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

/** The trophies that pass both the kind filter and the search text, in campaign order. */
export function visibleTrophies(guide, kind, query) {
  const ordered = [];
  for (const phase of guide.campaign.phases) {
    for (const id of phase.trophyIds || []) {
      const trophy = guide.byId.get(id);
      if (trophy && !ordered.includes(trophy)) ordered.push(trophy);
    }
  }
  for (const trophy of guide.trophies) {
    if (!ordered.includes(trophy)) ordered.push(trophy);
  }
  return ordered.filter((t) => matchesKind(t, kind) && matchesQuery(t, query));
}

/** Whether a trophy's name and description must be hidden by the spoiler setting:
    a story trophy the player has not earned yet. */
export function isSpoilerHidden(trophy, spoilerOn, earned) {
  return spoilerOn === true && trophy.kind === 'story' && !earned;
}

/** The text shown for a hidden story trophy. */
export function spoilerPlaceholder() {
  return 'Hidden story trophy — earn it to reveal its name.';
}
