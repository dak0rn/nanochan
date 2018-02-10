CREATE TABLE "post" (
    id_post UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "user" (id_user),
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    thread_id UUID NOT NULL REFERENCES thread(id_thread)
);
