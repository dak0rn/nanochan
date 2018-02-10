INSERT INTO "user" ("name", "password")
VALUES (${name}, ${password})
RETURNING *;
