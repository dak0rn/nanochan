SELECT
    title,
    created_at,
    name,
    id_user,
    id_thread
FROM "thread"
INNER JOIN "user"
    ON "user".id_user = "thread".user_id
ORDER BY created_at DESC;