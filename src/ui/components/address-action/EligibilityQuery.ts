export interface EligibilityQuery {
  data?: null | { data: { eligible: boolean } };
  status: 'error' | 'success' | 'loading';
  isError: boolean;
}
