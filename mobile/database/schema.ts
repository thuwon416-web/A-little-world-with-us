import { Model, appSchema, tableSchema } from '@nozbe/watermelondb'

export class MessageModel extends Model {
  static table = 'messages'

  public static createTableSchema() {
    return tableSchema({
      name: 'messages',
      columns: [
        { name: 'content', type: 'string' },
        { name: 'sender_id', type: 'string' },
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

export default appSchema({
  version: 1,
  tables: [MessageModel.createTableSchema(), UserModel.createTableSchema()],
})
