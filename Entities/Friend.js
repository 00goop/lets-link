const Friend = {
  name: 'Friend',
  type: 'object',
  properties: {
    requester_id: {
      type: 'string',
      description: 'ID of the user who sent the friend request',
    },
    recipient_id: {
      type: 'string',
      description: 'ID of the user who received the friend request',
    },
    status: {
      type: 'string',
      enum: ['pending', 'accepted', 'declined', 'blocked'],
      default: 'pending',
      description: 'Current status of the friend request',
    },
  },
  required: ['requester_id', 'recipient_id'],
  rls: {
    read: {
      $or: [
        { requester_id: '{{user.id}}' },
        { recipient_id: '{{user.id}}' },
        { user_condition: { role: 'admin' } },
      ],
    },
    write: {
      $or: [
        { requester_id: '{{user.id}}' },
        { recipient_id: '{{user.id}}' },
        { user_condition: { role: 'admin' } },
      ],
    },
  },
};

export default Friend;
