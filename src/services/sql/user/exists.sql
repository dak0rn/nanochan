SELECT
    CASE WHEN count(*) > 0 THEN TRUE ELSE FALSE END as exists
FROM "user"
WHERE "name" = ${name};
