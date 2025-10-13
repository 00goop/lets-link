export const sanitizeUser = (user) => {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
};

export const sanitizeUsers = (users = []) => users.map(sanitizeUser);

const unique = (values = []) => {
  return Array.from(new Set(values.filter(Boolean)));
};

export const serializeParty = (party) => {
  if (!party) return null;
  const { members, member_ids, host_id, ...rest } = party;
  const existingIds = Array.isArray(member_ids) ? member_ids : [];
  const relatedIds = Array.isArray(members) ? members.map((member) => member.user_id) : [];
  const mergedIds = unique([...existingIds, ...relatedIds, host_id]);
  return {
    ...rest,
    host_id,
    member_ids: mergedIds,
  };
};

export const serializeParties = (parties = []) => parties.map(serializeParty);
