import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import schema, { MessageModel, UserModel } from './schema'

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'a-little-world-with-us-mobile-db',
})

export const database = new Database({
  adapter,
  modelClasses: [MessageModel, UserModel],
})

export const messagesCollection = database.get('messages')
export const usersCollection = database.get('users')
