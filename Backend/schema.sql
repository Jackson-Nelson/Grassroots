-- Database Schema for Group App
-- PostgreSQL

-- Create database (run this separately)
-- CREATE DATABASE group_app;

-- Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT username_length CHECK (LENGTH(username) >= 3)
);

-- Groups table
CREATE TABLE groups (
    group_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    creator_id INTEGER NOT NULL,
    avatar_url VARCHAR(500),
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT group_name_length CHECK (LENGTH(name) >= 3)
);

-- Group members table (many-to-many relationship)
CREATE TABLE group_members (
    membership_id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(group_id, user_id)
);

-- Events table
CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    creator_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_time TIME,
    location VARCHAR(255),
    is_cancelled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Event attendees table
CREATE TABLE event_attendees (
    attendance_id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rsvp_status VARCHAR(20) DEFAULT 'going' CHECK (rsvp_status IN ('going', 'maybe', 'not_going')),
    rsvp_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(event_id, user_id)
);

-- Messages table (group chat)
CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    related_id INTEGER, -- Can reference group_id, event_id, etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_groups_creator ON groups(creator_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_events_group ON events(group_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX idx_messages_group ON messages(group_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries

-- View: Group summary with member and event counts
CREATE VIEW group_summary AS
SELECT 
    g.group_id,
    g.name,
    g.description,
    g.creator_id,
    u.username as creator_username,
    g.is_private,
    g.created_at,
    COUNT(DISTINCT gm.user_id) as member_count,
    COUNT(DISTINCT e.event_id) as event_count,
    COUNT(DISTINCT m.message_id) as message_count
FROM groups g
LEFT JOIN users u ON g.creator_id = u.user_id
LEFT JOIN group_members gm ON g.group_id = gm.group_id
LEFT JOIN events e ON g.group_id = e.group_id AND e.is_cancelled = FALSE
LEFT JOIN messages m ON g.group_id = m.group_id
GROUP BY g.group_id, u.username;

-- View: Upcoming events with attendee counts
CREATE VIEW upcoming_events AS
SELECT 
    e.event_id,
    e.group_id,
    g.name as group_name,
    e.title,
    e.description,
    e.event_date,
    e.event_time,
    e.location,
    e.creator_id,
    u.username as creator_username,
    COUNT(ea.user_id) as attendee_count
FROM events e
JOIN groups g ON e.group_id = g.group_id
JOIN users u ON e.creator_id = u.user_id
LEFT JOIN event_attendees ea ON e.event_id = ea.event_id AND ea.rsvp_status = 'going'
WHERE e.event_date >= CURRENT_DATE AND e.is_cancelled = FALSE
GROUP BY e.event_id, g.name, u.username
ORDER BY e.event_date, e.event_time;

-- Sample data (optional - for testing)
-- Insert sample users
INSERT INTO users (username, email, password_hash, full_name) VALUES
('john_doe', 'john@example.com', '$2a$10$XQSv7D.Y7zGXzXmQG4fHLO8r0Y3Y1X1X1X1X1X1X1X1X1X1X1X', 'John Doe'),
('jane_smith', 'jane@example.com', '$2a$10$XQSv7D.Y7zGXzXmQG4fHLO8r0Y3Y1X1X1X1X1X1X1X1X1X1X1X', 'Jane Smith'),
('bob_wilson', 'bob@example.com', '$2a$10$XQSv7D.Y7zGXzXmQG4fHLO8r0Y3Y1X1X1X1X1X1X1X1X1X1X1X', 'Bob Wilson');

-- Insert sample groups
INSERT INTO groups (name, description, creator_id) VALUES
('Tech Enthusiasts', 'A group for technology lovers to discuss latest trends', 1),
('Book Club', 'Monthly book discussions and recommendations', 2),
('Hiking Adventures', 'For outdoor enthusiasts who love hiking', 3);

-- Insert group members
INSERT INTO group_members (group_id, user_id, role) VALUES
(1, 1, 'admin'),
(1, 2, 'member'),
(2, 2, 'admin'),
(2, 1, 'member'),
(2, 3, 'member'),
(3, 3, 'admin'),
(3, 1, 'member');

-- Insert sample events
INSERT INTO events (group_id, creator_id, title, description, event_date, event_time, location) VALUES
(1, 1, 'AI Workshop', 'Learn about the latest in AI technology', '2025-11-15', '14:00:00', 'Tech Hub Downtown'),
(2, 2, 'Book Discussion: 1984', 'Monthly discussion of George Orwell''s classic', '2025-11-20', '18:30:00', 'Local Library'),
(3, 3, 'Mountain Trail Hike', 'Scenic 5-mile trail with beautiful views', '2025-11-10', '08:00:00', 'Mountain Peak Trailhead');

-- Insert event attendees
INSERT INTO event_attendees (event_id, user_id, rsvp_status) VALUES
(1, 1, 'going'),
(1, 2, 'going'),
(2, 2, 'going'),
(2, 1, 'maybe'),
(2, 3, 'going'),
(3, 3, 'going'),
(3, 1, 'going');

-- Insert sample messages
INSERT INTO messages (group_id, user_id, content) VALUES
(1, 1, 'Welcome everyone to Tech Enthusiasts!'),
(1, 2, 'Thanks for creating this group!'),
(2, 2, 'Looking forward to our next book discussion'),
(3, 3, 'Weather looks great for our hike this weekend!');