export interface PerpUserRole {
  role:
    | 'missing'
    | 'user'
    | 'subAccount'
    | 'vault'
    | 'agent'
    | 'feeder'
    | string;
  data?: unknown;
}

export interface PerpUserRolePayload {
  address: string;
}
