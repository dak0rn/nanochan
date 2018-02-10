CREATE TABLE "thread" (
    id_thread UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES "user" (id_user),
    text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
)
