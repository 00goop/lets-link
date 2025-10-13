import prisma from '../prisma.js';

const getClient = (tx) => tx ?? prisma;

const getCurrentMemberIds = async (client, partyId) => {
  if (!partyId) return [];
  const party = await client.party.findUnique({
    where: { id: partyId },
    select: { member_ids: true },
  });
  return party?.member_ids ?? [];
};

export const addMemberToParty = async (tx, partyId, userId) => {
  if (!partyId || !userId) return;
  const client = getClient(tx);
  const existingIds = await getCurrentMemberIds(client, partyId);
  if (existingIds.includes(userId)) return;
  await client.party.update({
    where: { id: partyId },
    data: { member_ids: { push: userId } },
  });
};

export const removeMemberFromParty = async (tx, partyId, userId) => {
  if (!partyId || !userId) return;
  const client = getClient(tx);
  const existingIds = await getCurrentMemberIds(client, partyId);
  if (!existingIds.includes(userId)) return;
  await client.party.update({
    where: { id: partyId },
    data: { member_ids: { set: existingIds.filter((id) => id !== userId) } },
  });
};

export const syncPartyMemberStatus = async (tx, partyId, userId, status) => {
  if (!partyId || !userId) return;
  if (status === 'declined') {
    await removeMemberFromParty(tx, partyId, userId);
    return;
  }
  await addMemberToParty(tx, partyId, userId);
};
