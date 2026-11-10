BEGIN;

CREATE TABLE IF NOT EXISTS lessons (
  id VARCHAR(80) PRIMARY KEY,
  number VARCHAR(80) NOT NULL,
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(500) NOT NULL,
  icon VARCHAR(40) NOT NULL,
  color VARCHAR(7) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT lessons_id_format
    CHECK (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT lessons_color_format
    CHECK (color ~ '^#[0-9a-fA-F]{6}$')
);

CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(80) PRIMARY KEY,
  lesson_id VARCHAR(80) NOT NULL,
  question VARCHAR(2000) NOT NULL,
  vietnamese VARCHAR(2000) NOT NULL,
  phrase VARCHAR(2000) NOT NULL,
  meaning VARCHAR(2000) NOT NULL,
  answer VARCHAR(5000) NOT NULL,
  translation VARCHAR(5000) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT questions_id_format
    CHECK (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT questions_lesson_fk
    FOREIGN KEY (lesson_id)
    REFERENCES lessons(id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS questions_lesson_order_idx
  ON questions (lesson_id, sort_order, id);

COMMIT;