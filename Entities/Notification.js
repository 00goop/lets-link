const Notification = {
  name: 'Notification',
  type: 'object',
  properties: {
    user_id: {
      type: 'string',
      description: 'ID of the user receiving the notification',
    },
    type: {
      type: 'string',
      enum: ['friend_request', 'party_invite', 'party_update', 'photo_tagged'],
      description: 'Type of notification',
    },
    title: {
      type: 'string',
      description: 'Notification title',
    },
    message: {
      type: 'string',
      description: 'Notification message',
    },
    read: {
      type: 'boolean',
      default: false,
      description: 'Whether notification has been read',
    },
    related_id: {
      type: 'string',
      description: 'ID of related entity (party, friend request, etc.)',
    },
  },
  required: ['user_id', 'type', 'title', 'message'],
  rls: {
    read: {
      $or: [
        { user_id: '{{user.id}}' },
        { user_condition: { role: 'admin' } },
      ],
    },
    write: {
      $or: [
        { user_id: '{{user.id}}' },
        { user_condition: { role: 'admin' } },
      ],
    },
  },
};

export default Notification;
