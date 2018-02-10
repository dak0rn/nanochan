CREATE TABLE "user" (
  id_user UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(32) NOT NULL UNIQUE,
  password VARCHAR(64),
  mod BOOLEAN DEFAULT FALSE
);
