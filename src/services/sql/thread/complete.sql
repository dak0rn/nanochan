WITH the_comments AS (
    SELECT
        name,
        created_at,
        id_post,
        content
    FROM "post"
    INNER JOIN "user"
        ON "user".id_user = "post".user_id
    WHERE thread_id = ${id_thread}
    ORDER BY created_at DESC
)
SELECT
    "user".name,
    title,
    text,
    "thread".created_at,
    id_thread,
    CASE WHEN count(the_comments) > 0 THEN json_agg(the_comments) ELSE '[]'::json END AS comments
FROM "thread"
INNER JOIN "user"
    ON "user".id_user = "thread".user_id
LEFT JOIN the_comments
    ON TRUE
WHERE "thread".id_thread = ${id_thread}
GROUP BY
    "user".name,
    title,
    text,
    id_thread,
    "thread".created_at;