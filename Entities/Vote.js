const Vote = {
  name: 'Vote',
  type: 'object',
  properties: {
    poll_id: {
      type: 'string',
      description: 'Poll ID being voted on',
    },
    user_id: {
      type: 'string',
      description: 'User who cast the vote',
    },
    selected_option: {
      type: 'string',
      description: 'Selected option value',
    },
  },
  required: ['poll_id', 'user_id', 'selected_option'],
  rls: {
    read: {
      $or: [
        { user_id: '{{user.id}}' },
        { poll: { created_by: '{{user.id}}' } },
        { poll: { party: { host_id: '{{user.id}}' } } },
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

export default Vote;
