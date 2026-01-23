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
INSERT INTO virtual_speed_dating (id, title, description, scheduled_datetime, duration_minutes, round_duration_seconds, min_participants, max_participants, gender_preference, age_min, age_max, status) VALUES
  (gen_random_uuid(), 'Friday Night Connections', 'Meet 10 new people in quick 3-minute rounds!', NOW() + INTERVAL '3 days', 45, 180, 10, 20, 'mixed', 25, 40, 'scheduled'),
  (gen_random_uuid(), 'Weekend Mingle', 'Casual speed dating for the weekend crowd', NOW() + INTERVAL '5 days', 30, 180, 8, 16, 'mixed', 30, 50, 'scheduled'),
  (gen_random_uuid(), 'Young Professionals Night', 'Speed dating for career-focused singles', NOW() + INTERVAL '7 days', 45, 180, 10, 20, 'mixed', 22, 35, 'scheduled');
