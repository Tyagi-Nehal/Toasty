-- Run once to set up the database: mysql -u root -p < server/schema.sql

CREATE DATABASE IF NOT EXISTS toasty;
USE toasty;

CREATE TABLE IF NOT EXISTS president_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  member_id VARCHAR(100) NOT NULL,
  club_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clubs (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  club_id VARCHAR(100),
  district VARCHAR(255),
  area VARCHAR(255),
  members INT NOT NULL DEFAULT 0,
  founded_year VARCHAR(20),
  city VARCHAR(255),
  country VARCHAR(255),
  location VARCHAR(255),
  president_name VARCHAR(255),
  president_email VARCHAR(255),
  meeting_day VARCHAR(20),
  meeting_time VARCHAR(20),
  meeting_location VARCHAR(255),
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
