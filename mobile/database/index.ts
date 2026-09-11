import { Database } from '@nozbe/watermelondb'
import { addColumns, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import schema, { MessageModel, UserModel } from './schema'

const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'messages',
          columns: [{ name: 'couple_id', type: 'string', isOptional: true }],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        addColumns({
          table: 'messages',
          columns: [
            { name: 'message_type', type: 'string', isOptional: true },
            { name: 'location_payload', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 4,
      steps: [
        addColumns({
          table: 'messages',
          columns: [
            { name: 'media_url', type: 'string', isOptional: true },
            { name: 'media_duration', type: 'number', isOptional: true },
            { name: 'reply_to', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
  ],
})

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'a-little-world-with-us-mobile-db',
})

export const database = new Database({
  adapter,
  modelClasses: [MessageModel, UserModel],
})

export const messagesCollection = database.get('messages')
export const usersCollection = database.get('users')
