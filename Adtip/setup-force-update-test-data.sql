-- Force Update Test Data Setup
-- This script sets up test data for the force update functionality

-- Ensure the app_versions table exists
CREATE TABLE IF NOT EXISTS app_versions (
  id INT NOT NULL AUTO_INCREMENT,
  platform ENUM('android','ios','web') DEFAULT NULL,
  latest_version VARCHAR(20) DEFAULT NULL,
  force_update TINYINT(1) DEFAULT '0',
  update_url VARCHAR(255) DEFAULT NULL,
  release_notes TEXT,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Clear existing test data
DELETE FROM app_versions WHERE platform IN ('android', 'ios');

-- Insert test data for Android
INSERT INTO app_versions (platform, latest_version, force_update, update_url, release_notes) VALUES
('android', '33.0.0', 1, 'https://play.google.com/store/apps/details?id=com.adtip.app.adtip_app', 
'🚀 Major Update v33.0.0\n\n✨ New Features:\n• Enhanced force update system\n• Improved version checking\n• Better user experience\n\n🔒 Security:\n• Critical security patches\n• Performance improvements\n\n🐛 Bug Fixes:\n• Fixed app stability issues\n• Resolved crash reports\n• UI/UX improvements');

-- Insert test data for iOS
INSERT INTO app_versions (platform, latest_version, force_update, update_url, release_notes) VALUES
('ios', '33.0.0', 1, 'https://apps.apple.com/app/adtip-watch-to-earn/id1234567890',
'🚀 Major Update v33.0.0\n\n✨ New Features:\n• Enhanced force update system\n• Improved version checking\n• Better user experience\n\n🔒 Security:\n• Critical security patches\n• Performance improvements\n\n🐛 Bug Fixes:\n• Fixed app stability issues\n• Resolved crash reports\n• UI/UX improvements');

-- Verify the data
SELECT * FROM app_versions WHERE platform IN ('android', 'ios') ORDER BY platform, id DESC;

-- Test scenarios you can create by updating the data:
-- Note: All updates are now mandatory (force_update = 1)

-- Scenario 1: Mandatory update required (current setup)
-- UPDATE app_versions SET force_update = 1, latest_version = '33.0.0' WHERE platform = 'android';

-- Scenario 2: No update needed (set latest_version to current app version)
-- UPDATE app_versions SET force_update = 1, latest_version = '1.0.0' WHERE platform = 'android';

-- Scenario 3: Major mandatory update
-- UPDATE app_versions SET force_update = 1, latest_version = '34.0.0' WHERE platform = 'android';

-- Note: The current app version in package.json is 1.0.0
-- The current app version in build.gradle is 33.0.0
-- You may need to sync these versions for consistent testing
