/* Guide data: the trophy list and the campaign phases, loaded from the app's own files.
   The app fetches nothing from the network; these are relative paths inside app/. */

const TROPHIES_URL = './data/trophies.json';
const CAMPAIGN_URL = './data/campaign.json';

/** Load both data files and return the guide, with lookups built. */
export async function loadGuide() {
  const [trophyRes, campaignRes] = await Promise.all([
    fetch(TROPHIES_URL),
    fetch(CAMPAIGN_URL),
  ]);
  if (!trophyRes.ok) throw new Error('trophies.json could not be loaded');
  if (!campaignRes.ok) throw new Error('campaign.json could not be loaded');
  const trophyDoc = await trophyRes.json();
  const campaignDoc = await campaignRes.json();
  const trophies = trophyDoc.trophies || [];
  const byId = new Map();
  for (const trophy of trophies) byId.set(trophy.id, trophy);
  return {
    game: trophyDoc.game,
    total: trophies.length,
    gradeCounts: trophyDoc.gradeCounts,
    sourceBook: trophyDoc.sourceBook || {},
    trophies,
    byId,
    campaign: campaignDoc,
  };
}

/** A trophy's cited sources, resolved from the source book. */
export function sourcesOf(guide, trophy) {
  const out = [];
  for (const key of trophy.src || []) {
    const entry = guide.sourceBook[key];
    if (entry) out.push(entry);
  }
  return out;
}

/** The trophies of one campaign phase, in the phase's own order. */
export function phaseTrophies(guide, phase) {
  const out = [];
  for (const id of phase.trophyIds || []) {
    const trophy = guide.byId.get(id);
    if (trophy) out.push(trophy);
  }
  return out;
}

/** A trophy's grade rank, for sorting: platinum first, bronze last. */
export function gradeRank(grade) {
  if (grade === 'platinum') return 0;
  if (grade === 'gold') return 1;
  if (grade === 'silver') return 2;
  return 3;
}
