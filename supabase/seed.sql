-- Seed data for development/testing
-- This file contains sample data to populate the database for testing purposes

-- Note: Make sure to run the initial migration (001_initial_schema.sql) before running this seed file

-- Insert sample users (these will need to be created in auth.users first via Supabase Auth)
-- For now, we'll use placeholder UUIDs - replace these with actual user IDs from auth.users
-- You can create users via Supabase Auth dashboard or API first

-- Sample Properties
INSERT INTO public.properties (id, name, city, price_range, bedrooms, type, status, image_url, description, features) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Luxury Modern Villa with Pool', 'Riyadh', '8M - 12M SAR', 5, 'villa', 'available', '/luxury-modern-villa-with-pool-riyadh.jpg', 'Stunning modern villa featuring contemporary design with private pool and landscaped gardens.', ARRAY['Private Pool', 'Garden', 'Garage', 'Maid Room', 'Modern Kitchen']),
  ('550e8400-e29b-41d4-a716-446655440002', 'Affordable Modern Apartment', 'Riyadh', '1.5M - 2.5M SAR', 2, 'apartment', 'available', '/affordable-modern-apartment-riyadh.jpg', 'Modern apartment in prime location with excellent amenities.', ARRAY['Balcony', 'Parking', 'Gym Access', 'Security']),
  ('550e8400-e29b-41d4-a716-446655440003', 'Arabian Traditional Villa', 'Riyadh', '6M - 9M SAR', 4, 'villa', 'available', '/arabian-traditional-villa-riyadh.jpg', 'Beautiful traditional Arabian villa with authentic design elements.', ARRAY['Traditional Design', 'Large Garden', 'Majlis', 'Garage']),
  ('550e8400-e29b-41d4-a716-446655440004', 'Luxury Penthouse Sea View', 'Jeddah', '15M - 20M SAR', 4, 'penthouse', 'available', '/luxury-penthouse-sea-view-jeddah.jpg', 'Ultra-luxury penthouse with panoramic sea views.', ARRAY['Sea View', 'Private Elevator', 'Rooftop Terrace', 'Premium Finishes']),
  ('550e8400-e29b-41d4-a716-446655440005', 'Marina Penthouse Arabian Gulf View', 'Dammam', '12M - 18M SAR', 3, 'penthouse', 'reserved', '/marina-penthouse-arabian-gulf-view.jpg', 'Exclusive penthouse overlooking the Arabian Gulf.', ARRAY['Gulf View', 'Marina Access', 'Modern Design', 'High Ceilings']),
  ('550e8400-e29b-41d4-a716-446655440006', 'Contemporary Villa Modern Design', 'Dammam', '7M - 10M SAR', 5, 'villa', 'available', '/contemporary-villa-modern-design-dammam.jpg', 'Contemporary villa with modern architectural design.', ARRAY['Modern Design', 'Smart Home', 'Pool', 'Garden']),
  ('550e8400-e29b-41d4-a716-446655440007', 'Modern High-Rise Apartment', 'Jeddah', '2M - 3.5M SAR', 3, 'apartment', 'available', '/modern-high-rise-apartment-jeddah-city.jpg', 'Modern apartment in high-rise building with city views.', ARRAY['City View', 'Balcony', 'Parking', 'Gym']),
  ('550e8400-e29b-41d4-a716-446655440008', 'Modern Townhouse with Garden', 'Riyadh', '3M - 5M SAR', 3, 'townhouse', 'available', '/modern-townhouse-garden-riyadh.jpg', 'Spacious townhouse with private garden.', ARRAY['Garden', 'Garage', 'Modern Kitchen', '3 Floors']),
  ('550e8400-e29b-41d4-a716-446655440009', 'Modern Villa Gated Community', 'Riyadh', '9M - 13M SAR', 6, 'villa', 'available', '/modern-villa-gated-community-riyadh.jpg', 'Luxury villa in prestigious gated community.', ARRAY['Gated Community', 'Pool', 'Large Garden', '6 Bedrooms']),
  ('550e8400-e29b-41d4-a716-446655440010', 'Palatial Luxury Villa Marble', 'Jeddah', '20M - 30M SAR', 7, 'villa', 'sold', '/palatial-luxury-villa-marble-jeddah.jpg', 'Palatial villa with premium marble finishes throughout.', ARRAY['Marble Finishes', '7 Bedrooms', 'Private Pool', 'Large Plot']),
  ('550e8400-e29b-41d4-a716-446655440011', 'Spacious Villa Modern Traditional', 'Riyadh', '5M - 8M SAR', 4, 'villa', 'available', '/spacious-villa-modern-traditional-riyadh.jpg', 'Spacious villa blending modern and traditional elements.', ARRAY['Traditional Elements', 'Modern Amenities', 'Garden', 'Garage']),
  ('550e8400-e29b-41d4-a716-446655440012', 'Ultra Luxury Mansion Estate', 'Riyadh', '30M - 50M SAR', 8, 'villa', 'available', '/ultra-luxury-mansion-estate-riyadh.jpg', 'Ultra-luxury mansion estate with extensive grounds.', ARRAY['Estate', '8+ Bedrooms', 'Multiple Pools', 'Guest House']),
  ('550e8400-e29b-41d4-a716-446655440013', 'Villa Water Features Landscaping', 'Riyadh', '10M - 15M SAR', 5, 'villa', 'available', '/villa-water-features-landscaping-riyadh.jpg', 'Luxury villa with water features and professional landscaping.', ARRAY['Water Features', 'Landscaping', 'Pool', 'Garden']),
  ('550e8400-e29b-41d4-a716-446655440014', 'Waterfront Apartment Bay View', 'Dammam', '2.5M - 4M SAR', 2, 'apartment', 'available', '/waterfront-apartment-dammam-bay-view.jpg', 'Waterfront apartment with stunning bay views.', ARRAY['Bay View', 'Waterfront', 'Balcony', 'Modern Design']),
  ('550e8400-e29b-41d4-a716-446655440015', 'Apartment Red Sea View', 'Jeddah', '3M - 5M SAR', 3, 'apartment', 'available', '/apartment-red-sea-view-jeddah.jpg', 'Beautiful apartment with Red Sea views.', ARRAY['Sea View', 'Balcony', 'Modern', 'Parking'])
ON CONFLICT (id) DO NOTHING;

-- Sample Integrations
INSERT INTO public.integrations (id, name, type, status, last_sync, icon) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Salesforce', 'crm', 'connected', NOW() - INTERVAL '2 minutes', NULL),
  ('660e8400-e29b-41d4-a716-446655440002', 'Twilio Voice', 'telephony', 'connected', NOW(), NULL),
  ('660e8400-e29b-41d4-a716-446655440003', 'WhatsApp Business API', 'messaging', 'connected', NOW(), NULL),
  ('660e8400-e29b-41d4-a716-446655440004', 'Twilio SMS', 'messaging', 'connected', NOW(), NULL),
  ('660e8400-e29b-41d4-a716-446655440005', 'SendGrid', 'email', 'connected', NOW() - INTERVAL '5 minutes', NULL),
  ('660e8400-e29b-41d4-a716-446655440006', 'Google Calendar', 'calendar', 'connected', NOW() - INTERVAL '1 minute', NULL),
  ('660e8400-e29b-41d4-a716-446655440007', 'HubSpot', 'crm', 'disconnected', NULL, NULL),
  ('660e8400-e29b-41d4-a716-446655440008', 'Microsoft Teams', 'messaging', 'error', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Note: To seed users, prospects, campaigns, and other user-dependent data,
-- you'll need to:
-- 1. First create users via Supabase Auth
-- 2. Then insert records into public.users table with matching IDs
-- 3. Then insert related data (prospects, campaigns, etc.)

-- Example structure for users (replace UUIDs with actual auth.users IDs):
-- INSERT INTO public.users (id, name, email, role, status) VALUES
--   ('actual-auth-user-id-1', 'Ahmed Al-Mansour', 'ahmed@fph.sa', 'admin', 'active'),
--   ('actual-auth-user-id-2', 'Sarah Al-Rashid', 'sarah@fph.sa', 'sales_manager', 'active')
-- ON CONFLICT (id) DO NOTHING;

