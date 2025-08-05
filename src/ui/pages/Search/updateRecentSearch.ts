const MAX_RECENT_SEARCH_SIZE = 10;

export function updateRecentSearch(
  fungibleId: string,
  recentSearch: string[]
): string[] {
  const searchIndex = recentSearch.findIndex((item) => item === fungibleId);
  if (searchIndex >= 0) {
    return [
      fungibleId,
      ...recentSearch.slice(0, searchIndex),
      ...recentSearch.slice(searchIndex + 1, MAX_RECENT_SEARCH_SIZE),
    ];
  }
  return [fungibleId, ...recentSearch.slice(0, MAX_RECENT_SEARCH_SIZE - 1)];
}
