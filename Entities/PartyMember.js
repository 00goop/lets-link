const PartyMember = {
  name: 'PartyMember',
  type: 'object',
  properties: {
    party_id: {
      type: 'string',
      description: 'ID of the party',
    },
    user_id: {
      type: 'string',
      description: 'ID of the user',
    },
    status: {
      type: 'string',
      enum: ['pending', 'confirmed', 'declined'],
      default: 'confirmed',
      description: 'Member status in the party',
    },
    location_lat: {
      type: 'number',
      description: "User's latitude for location calculations",
    },
    location_lng: {
      type: 'number',
      description: "User's longitude for location calculations",
    },
    location_name: {
      type: 'string',
      description: "User's location description",
    },
  },
  required: ['party_id', 'user_id'],
  rls: {
    read: {
      $or: [
        { user_id: '{{user.id}}' },
        { party: { host_id: '{{user.id}}' } },
        { user_condition: { role: 'admin' } },
      ],
    },
    write: {
      $or: [
        { user_id: '{{user.id}}' },
        { party: { host_id: '{{user.id}}' } },
        { user_condition: { role: 'admin' } },
      ],
    },
  },
};

export default PartyMember;
