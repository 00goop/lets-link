{
  "name": "Photo",
  "type": "object",
  "properties": {
    "party_id": {
      "type": "string",
      "description": "ID of the party this photo belongs to"
    },
    "uploader_id": {
      "type": "string",
      "description": "ID of the user who uploaded the photo"
    },
    "file_url": {
      "type": "string",
      "description": "URL of the uploaded photo"
    },
    "caption": {
      "type": "string",
      "description": "Photo caption"
    },
    "likes": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Array of user IDs who liked the photo"
    }
  },
  "required": [
    "party_id",
    "uploader_id",
    "file_url"
  ],
  "rls": {
    "read": {
      "$or": [
        {
          "uploader_id": "{{user.id}}"
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
          "uploader_id": "{{user.id}}"
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