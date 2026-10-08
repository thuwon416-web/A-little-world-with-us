import { Database } from '@nozbe/watermelondb'
import { addColumns, createTable, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import schema, { MessageModel, OfflineOpModel, OfflineQueueModel, UserModel } from './schema'

const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [addColumns({ table: 'messages', columns: [{ name: 'couple_id', type: 'string', isOptional: true }] })],
    },
    {
      toVersion: 3,
      steps: [addColumns({ table: 'messages', columns: [
        { name: 'message_type', type: 'string', isOptional: true },
        { name: 'location_payload', type: 'string', isOptional: true },
      ] })],
    },
    {
      toVersion: 4,
      steps: [addColumns({ table: 'messages', columns: [
        { name: 'media_url', type: 'string', isOptional: true },
        { name: 'media_duration', type: 'number', isOptional: true },
        { name: 'reply_to', type: 'string', isOptional: true },
      ] })],
    },
    {
      toVersion: 5,
      steps: [createTable({ name: 'offline_queue', columns: [
        { name: 'method', type: 'string' },
        { name: 'url', type: 'string' },
        { name: 'body', type: 'string' },
        { name: 'retry_count', type: 'number' },
        { name: 'created_at', type: 'number' },
      ] })],
    },
    {
      toVersion: 6,
      steps: [addColumns({ table: 'messages', columns: [
        { name: 'encrypted', type: 'boolean', isOptional: true },
        { name: 'encryption_version', type: 'number', isOptional: true },
      ] })],
    },
    {
      toVersion: 7,
      steps: [addColumns({ table: 'messages', columns: [
        { name: 'media_mime_type', type: 'string', isOptional: true },
        { name: 'edited_at', type: 'string', isOptional: true },
        { name: 'deleted_at', type: 'string', isOptional: true },
        { name: 'transcript', type: 'string', isOptional: true },
      ] })],
    },
    {
      toVersion: 8,
      steps: [
        addColumns({ table: 'messages', columns: [{ name: 'sync_version', type: 'number', isOptional: true }] }),
        createTable({ name: 'offline_ops', columns: [
          { name: 'op_id', type: 'string' },
          { name: 'operation', type: 'string' },
          { name: 'table_name', type: 'string' },
          { name: 'row_id', type: 'string' },
          { name: 'base_version', type: 'number' },
          { name: 'payload', type: 'string' },
          { name: 'retry_count', type: 'number' },
          { name: 'created_at', type: 'number' },
        ] }),
      ],
    },
    {
      toVersion: 9,
      steps: [addColumns({ table: 'messages', columns: [
        { name: 'media_storage_provider', type: 'string', isOptional: true },
        { name: 'media_storage_path', type: 'string', isOptional: true },
        { name: 'media_storage_file_id', type: 'string', isOptional: true },
        { name: 'media_size_bytes', type: 'number', isOptional: true },
      ] })],
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
  modelClasses: [MessageModel, UserModel, OfflineQueueModel, OfflineOpModel],
})

export const messagesCollection = database.get('messages')
export const usersCollection = database.get('users')
export const offlineQueueCollection = database.get('offline_queue')
export const offlineOpsCollection = database.get('offline_ops')
