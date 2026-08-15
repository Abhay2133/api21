import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('admin_users');
  if (!hasTable) {
    await knex.schema.createTable('admin_users', (table) => {
      table.increments('id').primary();
      table.string('username', 100).notNullable().unique();
      table.string('password_hash', 255).notNullable();
      table.string('name', 255).nullable();
      table.string('email', 255).nullable();
      table.string('role', 50).notNullable().defaultTo('admin');
      table.boolean('is_active').notNullable().defaultTo(true);
      table.timestamp('last_login_at', { useTz: true }).nullable();
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('admin_users');
}
