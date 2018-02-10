INSERT INTO "thread" (title, user_id, text)
VALUES (${title}, ${user_id}, ${text})
RETURNING id_thread;