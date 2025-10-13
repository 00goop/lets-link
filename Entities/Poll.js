const Poll = {
  name: 'Poll',
  type: 'object',
  properties: {
    party_id: {
      type: 'string',
      description: 'Party the poll belongs to',
    },
    created_by: {
      type: 'string',
      description: 'User who created the poll',
    },
    question: {
      type: 'string',
      description: 'Poll question',
    },
    options: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of options for the poll',
    },
    status: {
      type: 'string',
      enum: ['open', 'closed'],
      default: 'open',
    },
  },
  required: ['party_id', 'created_by', 'question', 'options'],
};

export default Poll;
