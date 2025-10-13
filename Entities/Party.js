{
  "name": "Party",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Party title"
    },
    "description": {
      "type": "string",
      "description": "Party description"
    },
    "type": {
      "type": "string",
      "enum": [
        "recreational",
        "dining",
        "family_vacation",
        "entertainment",
        "shopping",
        "educational"
      ],
      "description": "Type of party/outing"
    },
    "host_id": {
      "type": "string",
      "description": "User ID of the party host"
    },
    "join_code": {
      "type": "string",
      "description": "Unique code for others to join the party"
    },
    "max_size": {
      "type": "number",
      "description": "Maximum number of members (optional)"
    },
    "status": {
      "type": "string",
      "enum": [
        "planning",
        "confirmed",
        "completed",
        "cancelled"
      ],
      "default": "planning"
    },
    "scheduled_date": {
      "type": "string",
      "format": "datetime-local",
      "description": "When the outing is scheduled"
    },
    "location_name": {
      "type": "string",
      "description": "Chosen location name"
    },
    "location_address": {
      "type": "string",
      "description": "Address of chosen location"
    },
    "member_ids": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Array of user IDs who are party members"
    }
  },
  "required": [
    "title",
    "type",
    "host_id",
    "join_code"
  ],
  "rls": {
    "read": {
      "$or": [
        {
          "host_id": "{{user.id}}"
        },
        {
          "member_ids": "{{user.id}}"
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
          "host_id": "{{user.id}}"
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