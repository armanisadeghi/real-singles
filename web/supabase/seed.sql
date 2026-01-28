-- RealSingles Seed Data
-- This file contains sample data for development/testing

-- Sample products for the rewards system
INSERT INTO products (id, name, description, image_url, points_cost, retail_value, category, stock_quantity, is_active) VALUES
  (gen_random_uuid(), 'Amazon Gift Card $10', 'Digital Amazon gift card delivered via email', NULL, 1000, 10.00, 'gift_card', NULL, true),
  (gen_random_uuid(), 'Amazon Gift Card $25', 'Digital Amazon gift card delivered via email', NULL, 2500, 25.00, 'gift_card', NULL, true),
  (gen_random_uuid(), 'Amazon Gift Card $50', 'Digital Amazon gift card delivered via email', NULL, 5000, 50.00, 'gift_card', NULL, true),
  (gen_random_uuid(), 'Starbucks Gift Card $15', 'Digital Starbucks gift card', NULL, 1500, 15.00, 'gift_card', NULL, true),
  (gen_random_uuid(), 'RealSingles Premium - 1 Month', 'One month of premium features', NULL, 2000, 19.99, 'subscription', NULL, true),
  (gen_random_uuid(), 'RealSingles Premium - 3 Months', 'Three months of premium features', NULL, 5000, 49.99, 'subscription', NULL, true),
  (gen_random_uuid(), 'Movie Night Experience', 'Two movie tickets at participating theaters', NULL, 3000, 30.00, 'experience', 50, true),
  (gen_random_uuid(), 'Dinner for Two', '$50 restaurant gift certificate', NULL, 5000, 50.00, 'experience', 25, true);

-- Sample virtual speed dating sessions
-- Using longer intervals (30, 60, 90 days) so data doesn't expire quickly
INSERT INTO virtual_speed_dating (id, title, description, scheduled_datetime, duration_minutes, round_duration_seconds, min_participants, max_participants, gender_preference, age_min, age_max, status) VALUES
  (gen_random_uuid(), 'Friday Night Connections', 'Meet 10 new people in quick 3-minute rounds! Join us for an exciting evening of speed dating where you''ll have the chance to connect with like-minded singles.', NOW() + INTERVAL '7 days', 45, 180, 10, 20, 'mixed', 25, 40, 'scheduled'),
  (gen_random_uuid(), 'Weekend Mingle', 'Casual speed dating for the weekend crowd. Perfect for those who want a relaxed atmosphere to meet new people.', NOW() + INTERVAL '14 days', 30, 180, 8, 16, 'mixed', 30, 50, 'scheduled'),
  (gen_random_uuid(), 'Young Professionals Night', 'Speed dating for career-focused singles. Connect with ambitious individuals who share your drive for success.', NOW() + INTERVAL '21 days', 45, 180, 10, 20, 'mixed', 22, 35, 'scheduled'),
  (gen_random_uuid(), 'Valentine Special', 'Find your special someone this Valentine''s season! Extended rounds for deeper conversations.', NOW() + INTERVAL '30 days', 60, 240, 12, 24, 'mixed', 25, 45, 'scheduled'),
  (gen_random_uuid(), 'Over 40s Mixer', 'Mature singles looking for meaningful connections. A relaxed pace for quality conversations.', NOW() + INTERVAL '35 days', 45, 180, 8, 16, 'mixed', 40, 60, 'scheduled');

-- Sample events (in-person and virtual)
INSERT INTO events (id, title, description, event_type, start_datetime, end_datetime, max_attendees, city, state, venue_name, address, is_public, status, created_at) VALUES
  (gen_random_uuid(), 'Singles Mixer at The Rooftop', 'Join us for an evening of mingling, drinks, and great conversations at the city''s hottest rooftop bar.', 'in_person', NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days' + INTERVAL '3 hours', 50, 'New York', 'NY', 'The Rooftop Bar', '123 Main Street', true, 'upcoming', NOW()),
  (gen_random_uuid(), 'Virtual Wine Tasting', 'A fun online event where you can taste wines from around the world while meeting new people.', 'virtual', NOW() + INTERVAL '15 days', NOW() + INTERVAL '15 days' + INTERVAL '2 hours', 30, NULL, NULL, 'Online Event', NULL, true, 'upcoming', NOW()),
  (gen_random_uuid(), 'Hiking & Coffee', 'Start your weekend with a group hike followed by coffee and conversation. All fitness levels welcome!', 'in_person', NOW() + INTERVAL '20 days', NOW() + INTERVAL '20 days' + INTERVAL '4 hours', 20, 'Los Angeles', 'CA', 'Griffith Park', 'Griffith Park Drive', true, 'upcoming', NOW()),
  (gen_random_uuid(), 'Game Night for Singles', 'Board games, video games, and plenty of opportunities to connect. Pizza provided!', 'in_person', NOW() + INTERVAL '25 days', NOW() + INTERVAL '25 days' + INTERVAL '3 hours', 40, 'Chicago', 'IL', 'The Game Room', '456 Oak Avenue', true, 'upcoming', NOW());
