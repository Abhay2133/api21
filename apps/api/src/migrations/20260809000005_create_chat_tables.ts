import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Enhance users table for anonymous & claimed chat profiles
  const hasUsers = await knex.schema.hasTable('users');
  if (hasUsers) {
    const hasDeviceToken = await knex.schema.hasColumn('users', 'device_token');
    if (!hasDeviceToken) {
      await knex.schema.alterTable('users', (table) => {
        table.uuid('device_token').nullable().unique();
        table.string('ip_address', 45).nullable();
        table.string('display_name', 50).nullable();
        table.boolean('is_claimed').notNullable().defaultTo(false);
        table.string('password_hash', 255).nullable();
        table.timestamp('last_active_at', { useTz: true }).defaultTo(knex.fn.now());

        table.index(['device_token'], 'idx_users_device_token');
        table.index(['ip_address'], 'idx_users_ip_address');
        table.index(['display_name'], 'idx_users_display_name');
      });

      // Make email and name nullable to allow guest accounts without registration
      await knex.raw('ALTER TABLE users ALTER COLUMN email DROP NOT NULL;');
      await knex.raw('ALTER TABLE users ALTER COLUMN name DROP NOT NULL;');
    }
  }

  // 2. Create conversations table
  const hasConversations = await knex.schema.hasTable('conversations');
  if (!hasConversations) {
    await knex.schema.createTable('conversations', (table) => {
      table.increments('id').primary();
      table.string('slug', 100).notNullable().unique();
      table.string('title', 255).notNullable();
      table.string('type', 20).notNullable().defaultTo('global');
      table.jsonb('metadata').defaultTo('{}');
      table.boolean('is_active').notNullable().defaultTo(true);
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    });

    // Seed default global chat room
    await knex('conversations')
      .insert({
        slug: 'global',
        title: 'Global Chat',
        type: 'global',
        metadata: JSON.stringify({ description: 'Public global room for all users' }),
        is_active: true,
      })
      .onConflict('slug')
      .ignore();
  }

  // 3. Create messages table
  const hasMessages = await knex.schema.hasTable('messages');
  if (!hasMessages) {
    await knex.schema.createTable('messages', (table) => {
      table.bigIncrements('id').primary();
      table
        .integer('conversation_id')
        .notNullable()
        .references('id')
        .inTable('conversations')
        .onDelete('CASCADE');
      table
        .integer('user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');
      table.string('sender_name', 50).notNullable();
      table.string('sender_ip', 45).notNullable();
      table.text('content').notNullable();
      table.string('message_type', 20).notNullable().defaultTo('text');
      table.jsonb('metadata').defaultTo('{}');
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

      table.index(['conversation_id', 'created_at'], 'idx_messages_conv_created');
      table.index(['user_id'], 'idx_messages_user_id');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('messages');
  await knex.schema.dropTableIfExists('conversations');

  const hasUsers = await knex.schema.hasTable('users');
  if (hasUsers) {
    const hasDeviceToken = await knex.schema.hasColumn('users', 'device_token');
    if (hasDeviceToken) {
      await knex.schema.alterTable('users', (table) => {
        table.dropIndex(['device_token'], 'idx_users_device_token');
        table.dropIndex(['ip_address'], 'idx_users_ip_address');
        table.dropIndex(['display_name'], 'idx_users_display_name');

        table.dropColumn('device_token');
        table.dropColumn('ip_address');
        table.dropColumn('display_name');
        table.dropColumn('is_claimed');
        table.dropColumn('password_hash');
        table.dropColumn('last_active_at');
      });
    }
  }
}
