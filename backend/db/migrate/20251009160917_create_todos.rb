# frozen_string_literal: true

class CreateTodos < ActiveRecord::Migration[7.1]
  def change
    create_table :todos do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.integer :priority, null: false, default: 1
      t.string :deadline
      t.integer :completed, null: false, default: 0

      t.timestamps
    end

    # Add CHECK constraints for SQLite
    # priority: 0 (high), 1 (medium), 2 (low)
    # completed: 0 (false), 1 (true)
    reversible do |dir|
      dir.up do
        execute <<-SQL
          CREATE TABLE todos_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            priority INTEGER NOT NULL DEFAULT 1 CHECK(priority IN (0, 1, 2)),
            deadline TEXT,
            completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
          );

          INSERT INTO todos_new SELECT * FROM todos;
          DROP TABLE todos;
          ALTER TABLE todos_new RENAME TO todos;
        SQL
      end
    end
  end
end
