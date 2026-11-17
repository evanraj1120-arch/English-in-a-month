import type { NovelStudyGuide, StudyClaim } from '../content/types';

export type RetrievalCategory = 'novel-recall' | 'themes-symbols';
export type RetrievalKind = 'plot' | 'character' | 'theme' | 'symbol';

export const novelDisplayNames: Record<NovelStudyGuide['novel'], string> = {
  '1984': '1984',
  'catcher-in-the-rye': 'The Catcher in the Rye',
  metamorphosis: 'The Metamorphosis',
  'glass-castle': 'The Glass Castle',
};

export interface RetrievalCard {
  id: string;
  category: RetrievalCategory;
  kind: RetrievalKind;
  novel: NovelStudyGuide['novel'];
  prompt: string;
  claims: StudyClaim[];
  evidenceIds: string[];
  coverageNote?: string;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function hasSources(claim: StudyClaim): boolean {
  return claim.sourceRecordIds.length > 0
    || Boolean(claim.sourceDocuments?.length)
    || Boolean(claim.evidenceIds?.length);
}

function makeCard(
  guide: NovelStudyGuide,
  kind: RetrievalKind,
  id: string,
  prompt: string,
  claims: StudyClaim[],
  coverageField: keyof NovelStudyGuide['coverage'],
  additionalEvidenceIds: string[] = [],
): RetrievalCard | null {
  const sourcedClaims = claims.filter(hasSources);
  if (sourcedClaims.length === 0) return null;
  const status = guide.coverage[coverageField];
  return {
    id,
    category: kind === 'plot' || kind === 'character' ? 'novel-recall' : 'themes-symbols',
    kind,
    novel: guide.novel,
    prompt,
    claims: sourcedClaims,
    evidenceIds: unique([...sourcedClaims.flatMap((claim) => claim.evidenceIds ?? []), ...additionalEvidenceIds]),
    coverageNote: status === 'supported' ? undefined : `The guide marks ${coverageField.replaceAll(/([A-Z])/g, ' $1').toLowerCase()} coverage as ${status}; this card reflects available records, not complete coverage.`,
  };
}

export function buildRetrievalCards(guides: NovelStudyGuide[]): RetrievalCard[] {
  const cards: RetrievalCard[] = [];
  for (const guide of guides) {
    if (guide.status === 'source_limited') continue;

    for (const point of guide.plotChronology) {
      const card = makeCard(
        guide,
        'plot',
        `${guide.novel}-plot-${point.order}`,
        `From memory, describe the event at plot point ${point.order} in ${novelDisplayNames[guide.novel]}, then explain why it matters.`,
        [point.event, ...(point.significance ? [point.significance] : [])],
        'plot',
      );
      if (card) cards.push(card);
    }

    for (const character of guide.characters) {
      const card = makeCard(
        guide,
        'character',
        `${guide.novel}-character-${character.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`,
        `Recall ${character.name}'s defining traits, motivations, conflicts, relationships, and development in ${novelDisplayNames[guide.novel]}.`,
        [
          character.profile,
          ...character.traits,
          ...character.motivations,
          ...character.conflicts,
          ...character.relationships,
          ...character.development,
          ...character.themeConnections,
        ],
        'characters',
        character.evidenceIds,
      );
      if (card) cards.push(card);
    }

    for (const theme of guide.themes) {
      const card = makeCard(
        guide,
        'theme',
        `${guide.novel}-theme-${theme.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`,
        `Explain how “${theme.name}” develops in ${novelDisplayNames[guide.novel]}. From memory, state the idea and connect it to events or evidence.`,
        [theme.centralIdea, ...theme.development, ...theme.nuance],
        'themes',
        theme.evidenceIds,
      );
      if (card) cards.push(card);
    }

    for (const symbol of guide.symbolsAndMotifs) {
      const card = makeCard(
        guide,
        'symbol',
        `${guide.novel}-symbol-${symbol.objectOrMotif.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`,
        `Explain the literal role of “${symbol.objectOrMotif}” in ${novelDisplayNames[guide.novel]} and how its possible meaning develops.`,
        [symbol.literalPresence, ...symbol.developingMeanings, ...symbol.characterAndThemeLinks],
        'symbolsAndMotifs',
        symbol.evidenceIds,
      );
      if (card) cards.push(card);
    }
  }
  return cards;
}
