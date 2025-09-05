import { PersistentStore } from 'src/modules/persistent-store';

type SearchStoreState = {
  version: 1;
  searchHistory: string[];
};

const MAX_RECENT_SEARCH_SIZE = 10;

function updateSearchHistory(
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

class SearchStore extends PersistentStore<SearchStoreState> {
  static initialState: SearchStoreState = {
    version: 1,
    searchHistory: [],
  };

  addRecentSearch(fungibleId: string) {
    this.setState((state) => ({
      ...state,
      searchHistory: updateSearchHistory(fungibleId, state.searchHistory),
    }));
  }

  removeRecentSearch(fungibleId: string) {
    this.setState((state) => ({
      ...state,
      searchHistory: state.searchHistory.filter((id) => id !== fungibleId),
    }));
  }

  clearSearchHistory() {
    this.setState((state) => ({
      ...state,
      searchHistory: [],
    }));
  }

  getSearchHistory() {
    return this.getState().searchHistory;
  }
}

export const searchStore = new SearchStore(
  SearchStore.initialState,
  'search-store'
);
