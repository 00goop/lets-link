const ROUTES = {
  Dashboard: '/dashboard',
  Parties: '/parties',
  CreateParty: '/create-party',
  PartyDetails: '/party-details',
  Friends: '/friends',
  AddFriend: '/add-friend',
  Notifications: '/notifications',
  Profile: '/profile',
};

const toKebab = (value) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();

export const createPageUrl = (name = '', fallback = '/') => {
  if (!name) return fallback;
  if (ROUTES[name]) return ROUTES[name];
  return `/${toKebab(name)}`;
};

export { ROUTES };
