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
        { name: 'created_at', type: 'number' },
        { name: 'synced', type: 'boolean' },
        { name: 'encrypted', type: 'boolean', isOptional: true },
        { name: 'encryption_version', type: 'number', isOptional: true },
        { name: 'media_mime_type', type: 'string', isOptional: true },
        { name: 'edited_at', type: 'string', isOptional: true },
        { name: 'deleted_at', type: 'string', isOptional: true },
        { name: 'transcript', type: 'string', isOptional: true },
        { name: 'sync_version', type: 'number', isOptional: true },
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

export class OfflineOpModel extends Model {
  static table = 'offline_ops'
  op_id!: string
  operation!: string
  table_name!: string
  row_id!: string
  base_version!: number
  payload!: string
  retry_count!: number
  created_at!: number

  static createTableSchema() {
    return tableSchema({
      name: 'offline_ops',
      columns: [
        { name: 'op_id', type: 'string' },
        { name: 'operation', type: 'string' },
        { name: 'table_name', type: 'string' },
        { name: 'row_id', type: 'string' },
        { name: 'base_version', type: 'number' },
        { name: 'payload', type: 'string' },
        { name: 'retry_count', type: 'number' },
        { name: 'created_at', type: 'number' },
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
  created_at!: number

  static createTableSchema() {
    return tableSchema({
      name: 'offline_queue',
      columns: [
        { name: 'method', type: 'string' },
        { name: 'url', type: 'string' },
        { name: 'body', type: 'string' },
        { name: 'retry_count', type: 'number' },
        { name: 'created_at', type: 'number' },
      ],
    })
  }
}

export default appSchema({
  version: 8,
  tables: [
    MessageModel.createTableSchema(),
    UserModel.createTableSchema(),
    OfflineQueueModel.createTableSchema(),
    OfflineOpModel.createTableSchema(),
  ],
})
