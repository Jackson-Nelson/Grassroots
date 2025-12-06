-- Database Schema for PostgreSQL

-- CREATE DATABASE grassroots;

-- Users table
CREATE TABLE users (
    user_id uuid DEFAULT uuidv4(),
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    city VARCHAR(255) NOT NULL,
    county VARCHAR(255),
    state VARCHAR(255),
    zip INTEGER,
    country VARCHAR(255) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id),
    CONSTRAINT username_length CHECK (LENGTH(username) >= 3)
);

-- Groups table
CREATE TABLE groups (
    group_id uuid DEFAULT uuidv4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    city VARCHAR(255) NOT NULL,
    county VARCHAR(255),
    state VARCHAR(255),
    zip INTEGER,
    country VARCHAR(255) NOT NULL,
    creator_id uuid NOT NULL,
    avatar_url VARCHAR(500),
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id),
    FOREIGN KEY (creator_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT group_name_length CHECK (LENGTH(name) >= 3)
);

-- Group tags
CREATE TABLE tags (
    tag_id uuid DEFAULT uuidv4 () PRIMARY KEY,
    tag VARCHAR(255) NOT NULL,
	gid uuid NOT NULL,
    FOREIGN KEY (gid) REFERENCES groups(group_id) ON DELETE CASCADE
);

-- Group members table (many-to-many relationship)
CREATE TABLE group_members (
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE --,
    -- UNIQUE(group_id, user_id)
);

-- Events table
CREATE TABLE events (
    event_id uuid DEFAULT uuidv4 () PRIMARY KEY,
    group_id uuid NOT NULL,
    creator_id uuid NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_time TIME,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    county VARCHAR(255),
    state VARCHAR(255),
    zip INTEGER,
    country VARCHAR(255) NOT NULL,
    is_cancelled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Event attendees table
CREATE TABLE event_attendees (
    event_id uuid NOT NULL,
    user_id uuid NOT NULL,
    rsvp_status CHAR(5) DEFAULT 'maybe' CHECK (rsvp_status IN ('yes', 'maybe', 'no')),
    rsvp_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(event_id, user_id)
);

-- Messages table (group chat)
CREATE TABLE messages (
    message_id uuid DEFAULT uuidv4 () PRIMARY KEY,
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
-- EXAMPLE DATA

-- USERS
INSERT INTO users (user_id, username, email, password_hash, full_name, city, county, state, zip, country, bio) VALUES ('A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11'::UUID, 'celina', 'test@example.com', 'password', 'celina vo', 'Bellingham', 'Whatcom', 'Washington', 98225, 'United States', 'This is my test biography');

-- GROUPS
INSERT INTO groups (group_id, name, description, city, county, state, zip, country, creator_id) VALUES ('A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11'::UUID, 'Climate Action Bellingham', 'A climate activism group based in Bellingham, WA.', 'Bellingham', 'Whatcom', 'Washington', 98225, 'United States', 'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11'::UUID);
INSERT INTO groups (group_id, name, description, city, county, state, zip, country, creator_id) VALUES ('A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A12'::UUID, 'Test Group', 'A Test Group From Bham', 'Bellingham', 'Whatcom', 'Washington', 98225, 'United States', 'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11'::UUID);

-- GROUP MEMBERS
INSERT INTO group_members (group_id, user_id, role) VALUES ('A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11'::UUID, 'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11'::UUID, 'owner');
INSERT INTO group_members (group_id, user_id, role) VALUES ('A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A12'::UUID, 'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11'::UUID, 'owner');

-- EVENTS
INSERT INTO events (event_id, group_id, creator_id, title, description, event_date, event_time, address, city, county, state, zip, country, is_cancelled) VALUES ('A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A20'::UUID, 'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11'::UUID, 'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11'::UUID, 'Climate Action Bellingham Meeting', 'A meeting to discuss climate action in Bellingham, WA.', '2025-12-01', '10:00:00', '123 Main St', 'Bellingham', 'Whatcom', 'Washington', 98225, 'United States of America', FALSE);
INSERT INTO events (event_id, group_id, creator_id, title, description, event_date, event_time, address, city, county, state, zip, country, is_cancelled) VALUES ('A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A21'::UUID, 'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A12'::UUID, 'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11'::UUID, 'Test Event', 'A Test Event From Bham', '2025-12-01', '10:00:00', '123 Main St', 'Bellingham', 'Whatcom', 'Washington', 98225, 'United States of America', FALSE);