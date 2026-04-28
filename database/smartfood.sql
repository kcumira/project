/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

DROP TABLE IF EXISTS `achievement`;
CREATE TABLE `achievement` (
  `achievement_id` int NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`achievement_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `admin`;
CREATE TABLE `admin` (
  `user_id` int NOT NULL,
  `work_schedule` varchar(255) DEFAULT NULL,
  `contact_work_phone` varchar(50) DEFAULT NULL,
  `employment_type` varchar(50) DEFAULT NULL,
  `assigned_areas` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `admin_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `community`;
CREATE TABLE `community` (
  `community_id` int NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `community_code` varchar(50) DEFAULT NULL,
  `manager_contact` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`community_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `foodshare`;
CREATE TABLE `foodshare` (
  `share_id` int NOT NULL AUTO_INCREMENT,
  `community_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `inventory_id` int DEFAULT NULL,
  `lat` double NOT NULL,
  `lng` double NOT NULL,
  `description` text,
  `category` varchar(50) DEFAULT 'Produce',
  `image_url` varchar(500) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `pickup_instructions` text,
  `snapshot_name` varchar(255) DEFAULT NULL,
  `snapshot_expiry_date` date DEFAULT NULL,
  `posted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`share_id`),
  KEY `community_id` (`community_id`),
  KEY `user_id` (`user_id`),
  KEY `inventory_id` (`inventory_id`),
  CONSTRAINT `foodshare_ibfk_1` FOREIGN KEY (`community_id`) REFERENCES `community` (`community_id`),
  CONSTRAINT `foodshare_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `foodshare_ibfk_3` FOREIGN KEY (`inventory_id`) REFERENCES `inventoryitem` (`inventory_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `inventoryitem`;
CREATE TABLE `inventoryitem` (
  `inventory_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `image_url` varchar(512) DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`inventory_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `inventoryitem_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `notification`;
CREATE TABLE `notification` (
  `notification_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `content` text,
  `type` varchar(50) DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`notification_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `pickuprecord`;
CREATE TABLE `pickuprecord` (
  `pickup_id` int NOT NULL,
  `request_id` int DEFAULT NULL,
  `admin_id` int DEFAULT NULL,
  `picked_up_at` datetime DEFAULT NULL,
  `confirmed_by_owner` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`pickup_id`),
  UNIQUE KEY `request_id` (`request_id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `pickuprecord_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `sharerequest` (`request_id`),
  CONSTRAINT `pickuprecord_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `admin` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `recipe`;
CREATE TABLE `recipe` (
  `recipe_id` int NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `instructions` text,
  `cook_time` varchar(50) DEFAULT NULL,
  `calories` varchar(50) DEFAULT NULL,
  `difficulty` varchar(50) DEFAULT NULL,
  `match_percentage` int DEFAULT '0',
  `tags` varchar(255) DEFAULT NULL,
  `saved_ingredients` json DEFAULT NULL,
  PRIMARY KEY (`recipe_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `scanrecord`;
CREATE TABLE `scanrecord` (
  `scan_id` int NOT NULL,
  `inventory_id` int NOT NULL,
  `scan_date` datetime DEFAULT NULL,
  `scan_result_text` text,
  `image_url` varchar(512) DEFAULT NULL,
  `method` varchar(50) DEFAULT NULL,
  `scan_step` int DEFAULT NULL,
  PRIMARY KEY (`scan_id`),
  KEY `inventory_id` (`inventory_id`),
  CONSTRAINT `scanrecord_ibfk_1` FOREIGN KEY (`inventory_id`) REFERENCES `inventoryitem` (`inventory_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `sharerequest`;
CREATE TABLE `sharerequest` (
  `request_id` int NOT NULL,
  `share_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `request_time` datetime DEFAULT NULL,
  `latest_must_receive_time` datetime DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`request_id`),
  KEY `share_id` (`share_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `sharerequest_ibfk_1` FOREIGN KEY (`share_id`) REFERENCES `foodshare` (`share_id`),
  CONSTRAINT `sharerequest_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `user_id` int NOT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `register_date` date DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `line_id` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `user_gain_achievement`;
CREATE TABLE `user_gain_achievement` (
  `user_id` int NOT NULL,
  `achievement_id` int NOT NULL,
  PRIMARY KEY (`user_id`,`achievement_id`),
  KEY `achievement_id` (`achievement_id`),
  CONSTRAINT `user_gain_achievement_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `user_gain_achievement_ibfk_2` FOREIGN KEY (`achievement_id`) REFERENCES `achievement` (`achievement_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `user_join_community`;
CREATE TABLE `user_join_community` (
  `user_id` int NOT NULL,
  `community_id` int NOT NULL,
  PRIMARY KEY (`user_id`,`community_id`),
  KEY `community_id` (`community_id`),
  CONSTRAINT `user_join_community_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `user_join_community_ibfk_2` FOREIGN KEY (`community_id`) REFERENCES `community` (`community_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `user_suggest_recipe`;
CREATE TABLE `user_suggest_recipe` (
  `user_id` int NOT NULL,
  `recipe_id` int NOT NULL,
  PRIMARY KEY (`user_id`,`recipe_id`),
  KEY `recipe_id` (`recipe_id`),
  CONSTRAINT `user_suggest_recipe_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 改成就資料庫
ALTER TABLE achievement
ADD COLUMN title varchar(100) DEFAULT NULL,
ADD COLUMN icon varchar(50) DEFAULT NULL,
ADD COLUMN category varchar(50) DEFAULT NULL,
ADD COLUMN target_value int DEFAULT 1,
ADD COLUMN points int DEFAULT 0,
ADD COLUMN rarity varchar(30) DEFAULT 'common',
ADD COLUMN accent_color varchar(100) DEFAULT NULL,
ADD COLUMN is_active tinyint(1) DEFAULT 1;

-- 改user_achievement_progress
CREATE TABLE user_achievement_progress (
  user_id int NOT NULL,
  achievement_id int NOT NULL,
  progress int DEFAULT 0,
  unlocked_at datetime DEFAULT NULL,
  last_updated_at datetime DEFAULT NULL,
  PRIMARY KEY (user_id, achievement_id),
  FOREIGN KEY (user_id) REFERENCES user(user_id),
  FOREIGN KEY (achievement_id) REFERENCES achievement(achievement_id)
);



INSERT INTO `foodshare` (`share_id`, `community_id`, `user_id`, `inventory_id`, `lat`, `lng`, `description`, `category`, `image_url`, `status`, `pickup_instructions`, `snapshot_name`, `snapshot_expiry_date`, `posted_at`) VALUES
(4, NULL, 1, NULL, 24.9868, 121.5762, '新鮮紅蘋果', 'Produce', '...', 'available', NULL, '3 Organic Apples', '2026-04-05', '2026-03-29 21:25:16');
INSERT INTO `inventoryitem` (`inventory_id`, `user_id`, `name`, `category`, `quantity`, `unit`, `expiry_date`, `purchase_date`, `image_url`, `barcode`, `notes`) VALUES
(1, 1, 'Spinach', 'Vegetable', '1.00', 'bunch', '2026-04-01', NULL, NULL, NULL, NULL),
(2, 1, 'Mushrooms', 'Vegetable', '200.00', 'g', '2026-04-02', NULL, NULL, NULL, NULL),
(3, 1, 'Milk', 'Dairy', '500.00', 'ml', '2026-04-01', NULL, NULL, NULL, NULL);


INSERT INTO `recipe` (`recipe_id`, `title`, `image_url`, `instructions`, `cook_time`, `calories`, `difficulty`, `match_percentage`, `tags`, `saved_ingredients`) VALUES
(1, 'Creamy Mushroom Pasta', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmpTRW_a71oc-k4lecS3vOeV0YGu93C4A2tjA0ijd4jbqLExo40C9BP9u22Zg4eAwohK9U7gBtsRdQugZj-KM34m5Ukh19eZMcx_qjmCUujk0btJpYeUlcE_ETmtEOHFuwSGiH5wvNWpsSEBCGX0ux2HTAZ_Qzt-tP0frsbOR2p1APDmuTn4bHKNp2a_5rcjU0AeKM51mEJw1VQY3nAiyfMRYqCUAjM89c2XSgXDWnIalmZZlwj4Grx2Sj4PxZ4IFbJqea5ToBIajt', '1. Boil pasta. 2. Saute mushrooms with garlic. 3. Add heavy cream and cheese. 4. Mix and serve.', '20m', '450', 'Easy', 95, 'Dinner, Vegetarian', '[\"Mushrooms\", \"Heavy Cream\"]');


INSERT INTO `user` (`user_id`, `user_name`, `email`, `password`, `register_date`, `role`, `line_id`) VALUES
(1, 'Ting-Kai', 'tk@example.com', 'password123', '2026-03-29', 'user', NULL);





/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;