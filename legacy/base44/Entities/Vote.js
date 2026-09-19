{
  "name": "Vote",
  "type": "object",
  "properties": {
    "poll_id": {
      "type": "string"
    },
    "user_id": {
      "type": "string"
    },
    "selected_option": {
      "type": "string"
    }
  },
  "required": [
    "poll_id",
    "user_id",
    "selected_option"
  ],
  "rls": {
    "read": {
      "$or": [
        {
          "user_id": "{{user.id}}"
        },
        {
          "user_condition": {
            "role": "admin"
          }
        }
      ]
    },
    "write": {
      "$or": [
        {
          "user_id": "{{user.id}}"
        },
        {
          "user_condition": {
            "role": "admin"
          }
        }
      ]
    }
  }
}