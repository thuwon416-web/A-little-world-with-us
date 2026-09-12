import { Model, appSchema, tableSchema } from '@nozbe/watermelondb'

export class MessageModel extends Model {
  static table = 'messages'

  public static createTableSchema() {
    return tableSchema({
      name: 'messages',
      columns: [
        { name: 'content', type: 'string' },
        { name: 'sender_id', type: 'string' },
        { name: 'couple_id', type: 'string', isOptional: true },
        { name: 'message_type', type: 'string', isOptional: true },
        { name: 'media_url', type: 'string', isOptional: true },
        { name: 'media_duration', type: 'number', isOptional: true },
        { name: 'reply_to', type: 'string', isOptional: true },
        { name: 'location_payload', type: 'string', isOptional: true },
        { name: 'created_at', type: 'string' },
        { name: 'synced', type: 'boolean' },
      ],
    })
  }
}

export class UserModel extends Model {
  static table = 'users'

  public static createTableSchema() {
    return tableSchema({
      name: 'users',
      columns: [
        { name: 'email', type: 'string', isOptional: true },
        { name: 'full_name', type: 'string', isOptional: true },
      ],
    })
  }
}

export class OfflineQueueModel extends Model {
  static table = 'offline_queue'
  method!: string
  url!: string
  body!: string
  retry_count!: number
  created_at!: string

  static createTableSchema() {
    return tableSchema({
      name: 'offline_queue',
      columns: [
        { name: 'method', type: 'string' },
        { name: 'url', type: 'string' },
        { name: 'body', type: 'string' },
        { name: 'retry_count', type: 'number' },
        { name: 'created_at', type: 'string' },
      ],
    })
  }
}

export default appSchema({
  version: 5,
  tables: [
    MessageModel.createTableSchema(),
    UserModel.createTableSchema(),
    OfflineQueueModel.createTableSchema(),
  ],
})
