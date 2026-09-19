{
  "name": "Poll",
  "type": "object",
  "properties": {
    "party_id": {
      "type": "string"
    },
    "created_by": {
      "type": "string"
    },
    "question": {
      "type": "string"
    },
    "options": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "status": {
      "type": "string",
      "enum": [
        "open",
        "closed"
      ],
      "default": "open"
    }
  },
  "required": [
    "party_id",
    "created_by",
    "question",
    "options"
  ]
}