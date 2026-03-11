-- 1. Tables Creation
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user', -- user, admin, founder
    
    -- Profile Essentials
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT DEFAULT '/assets/icons/user_dragon.png',
    banner_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    views INTEGER DEFAULT 0,

    -- Styling & Colors
    accent_color TEXT DEFAULT '#FFFFFF',
    icon_color TEXT DEFAULT '#A1A1AA',
    avatar_frame_color TEXT DEFAULT 'rgba(0,0,0,1)',
    badge_bg_color TEXT DEFAULT 'rgba(255,255,255,0.05)',
    card_style TEXT DEFAULT 'glass',
    card_border TEXT DEFAULT 'on',
    card_opacity FLOAT DEFAULT 0.7,
    bg_effect TEXT DEFAULT 'none',
    entry_anim TEXT DEFAULT 'fadeIn',
    glitch_avatar INTEGER DEFAULT 0,
    tilt_3d BOOLEAN DEFAULT false,
    hover_text TEXT,
    link_hover_anim TEXT DEFAULT 'none',
    custom_cursor_url TEXT,
    last_username_change BIGINT,

    -- Fonts
    base_font TEXT DEFAULT 'Outfit',
    base_font_color TEXT DEFAULT '#FFFFFF',
    name_font TEXT DEFAULT 'Outfit',
    name_font_color TEXT DEFAULT '#FFFFFF',
    bio_font TEXT DEFAULT 'Outfit',
    bio_font_color TEXT DEFAULT '#FFFFFF',

    -- Music Slots
    profile_music_url TEXT,
    profile_music_url_p2 TEXT,
    profile_music_url_p3 TEXT,
    profile_music_url_p4 TEXT,
    profile_music_url_p5 TEXT,

    -- Banner Slots (for multi-banner)
    banner_url_p2 TEXT,
    banner_url_p3 TEXT,
    banner_url_p4 TEXT,
    banner_url_p5 TEXT,

    -- Legacy support / Extras
    links JSONB DEFAULT '[]', -- For direct migration of existing links if needed
    badges JSONB DEFAULT '[]' -- For direct migration of existing badges if needed
);

CREATE TABLE IF NOT EXISTS links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    label TEXT,
    "order" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT,
    is_global BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS user_badges (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, badge_id)
);

-- 2. Initial Data
INSERT INTO badges (name, icon, description, is_global) 
VALUES ('Founder', 'fa-solid fa-crown', 'Platform Founder', true)
ON CONFLICT DO NOTHING;
