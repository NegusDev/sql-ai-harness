-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 21, 2026 at 06:07 AM
-- Server version: 10.11.14-MariaDB-0ubuntu0.24.04.1
-- PHP Version: 8.2.31

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `forex_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `agent_commissions`
--

CREATE TABLE `agent_commissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `agent_line_id` bigint(20) UNSIGNED NOT NULL,
  `period_month` date NOT NULL,
  `amount` decimal(20,4) NOT NULL,
  `currency_id` bigint(20) UNSIGNED NOT NULL,
  `entered_by` bigint(20) UNSIGNED NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `agent_commissions`
--

INSERT INTO `agent_commissions` (`id`, `agent_line_id`, `period_month`, `amount`, `currency_id`, `entered_by`, `notes`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, '2026-05-01', 300000.0000, 1, 1, NULL, '2026-06-01 10:26:39', '2026-06-01 10:26:39', NULL),
(2, 1, '2026-04-01', 150000.0000, 1, 1, NULL, '2026-06-01 10:29:12', '2026-06-01 10:29:12', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `agent_lines`
--

CREATE TABLE `agent_lines` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `company_name` varchar(255) NOT NULL,
  `contact_name` varchar(255) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `phone_registered_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `agent_lines`
--

INSERT INTO `agent_lines` (`id`, `user_id`, `company_name`, `contact_name`, `phone`, `phone_registered_name`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, NULL, 'MTN Uganda', 'HALVEK TECHNOLOGIES', '0767606429', 'HALVEK TECHNOLOGIES', '2026-05-12 06:55:07', '2026-05-12 06:55:07', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `agent_rates`
--

CREATE TABLE `agent_rates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `currency_pair_id` bigint(20) UNSIGNED NOT NULL,
  `set_by` bigint(20) UNSIGNED NOT NULL,
  `buy_rate` decimal(10,6) NOT NULL,
  `sell_rate` decimal(10,6) NOT NULL,
  `superseded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `agent_rates`
--

INSERT INTO `agent_rates` (`id`, `currency_pair_id`, `set_by`, `buy_rate`, `sell_rate`, `superseded_at`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 1.000000, 28.080000, '2026-05-08 06:10:14', '2026-05-08 06:09:06', '2026-05-08 07:22:50', '2026-05-08 07:22:50'),
(2, 1, 1, 3.000000, 27.000000, NULL, '2026-05-08 06:10:14', '2026-05-08 07:20:07', NULL),
(3, 3, 1, 28.000000, 3.000000, NULL, '2026-05-08 07:23:13', '2026-05-08 07:23:13', NULL),
(4, 4, 1, 1.000000, 34.000000, NULL, '2026-05-08 08:26:37', '2026-05-08 08:26:42', '2026-05-08 08:26:42'),
(5, 4, 1, 0.300000, 0.400000, NULL, '2026-05-11 05:30:04', '2026-05-11 05:30:04', NULL),
(6, 2, 1, 3750.000000, 3760.000000, NULL, '2026-05-13 07:35:16', '2026-05-13 07:35:16', NULL),
(7, 5, 1, 30.000000, 40.000000, NULL, '2026-05-18 08:11:25', '2026-05-18 08:11:25', NULL),
(8, 7, 1, 3720.000000, 3720.000000, NULL, '2026-05-22 09:32:41', '2026-06-20 05:00:18', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cache`
--

INSERT INTO `cache` (`key`, `value`, `expiration`) VALUES
('laravel-cache-avitacare7988@gmail.com|127.0.0.1', 'i:1;', 1778075271),
('laravel-cache-avitacare7988@gmail.com|127.0.0.1:timer', 'i:1778075271;', 1778075271);

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `credit_limit` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `credit_balance` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`id`, `name`, `phone`, `credit_limit`, `credit_balance`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Enoch Gulyeika', '+256775929398', 500000.0000, 0.0000, 1, '2026-05-11 06:51:43', '2026-10-15 05:53:07', '2026-10-15 05:53:07'),
(2, 'Damali Nakyomu', '+256702291173', 100000.0000, 0.0000, 1, '2026-05-11 07:06:11', '2026-10-15 05:53:12', '2026-10-15 05:53:12'),
(3, 'Negus', '0767 606429', 0.0000, 0.0000, 1, '2026-05-11 07:32:52', '2026-05-11 08:27:39', '2026-05-11 08:27:39'),
(4, 'Gudo', '+256779413431', 0.0000, 0.0000, 1, '2026-05-11 07:34:11', '2026-06-23 10:48:06', NULL),
(5, 'Negus', '+256767606429', 0.0000, 100.0000, 1, '2026-05-12 09:13:16', '2026-10-15 06:54:24', NULL),
(6, 'Unknown', '0754 603654', 0.0000, 0.0000, 1, '2026-05-13 04:25:06', '2026-05-13 04:25:06', NULL),
(7, 'Unknown', '+256754603654', 0.0000, 0.0000, 1, '2026-05-13 04:38:51', '2026-05-13 04:38:51', NULL),
(8, 'John Okeloo', '+256700123456', 0.0000, 0.0000, 1, '2026-05-18 07:24:49', '2026-06-23 10:53:02', NULL),
(9, 'Namusu', '+256757020528', 0.0000, 50.0000, 1, '2026-05-26 03:20:53', '2026-10-15 06:43:32', NULL),
(10, 'Karen', '+256778204170', 0.0000, 0.0000, 1, '2026-06-04 05:45:59', '2026-07-09 13:14:04', NULL),
(11, 'Karen', '+256778204173', 0.0000, 0.0000, 1, '2026-06-04 05:46:38', '2026-06-04 05:46:38', NULL),
(12, 'Kaleb', '+256778204179', 0.0000, 0.0000, 1, '2026-06-04 06:12:06', '2026-06-04 06:12:06', NULL),
(13, 'Ms Teayy', '+256778204171', 0.0000, 0.0000, 1, '2026-06-04 06:14:09', '2026-06-04 06:14:09', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `client_rates`
--

CREATE TABLE `client_rates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `currency_pair_id` bigint(20) UNSIGNED NOT NULL,
  `set_by` bigint(20) UNSIGNED NOT NULL,
  `direction` enum('send','withdraw') NOT NULL,
  `rate_type` enum('cash','credit') NOT NULL,
  `rate` decimal(10,6) NOT NULL,
  `superseded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `client_rates`
--

INSERT INTO `client_rates` (`id`, `currency_pair_id`, `set_by`, `direction`, `rate_type`, `rate`, `superseded_at`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 3, 1, 'send', 'cash', 1.240000, NULL, '2026-05-08 08:09:59', '2026-05-19 04:11:16', '2026-05-19 04:11:16'),
(2, 3, 1, 'withdraw', 'cash', 1.240000, NULL, '2026-05-08 08:12:40', '2026-05-19 04:11:14', '2026-05-19 04:11:14'),
(3, 4, 1, 'send', 'cash', 30.000000, NULL, '2026-05-08 08:19:18', '2026-05-08 08:25:38', '2026-05-08 08:25:38'),
(4, 1, 1, 'send', 'cash', 0.540000, NULL, '2026-05-12 10:32:35', '2026-05-19 04:11:11', '2026-05-19 04:11:11'),
(5, 1, 1, 'withdraw', 'cash', 1.720000, NULL, '2026-05-12 10:32:51', '2026-05-19 04:11:08', '2026-05-19 04:11:08'),
(6, 1, 1, 'send', 'credit', 0.450000, NULL, '2026-05-13 05:25:50', '2026-05-19 04:11:03', '2026-05-19 04:11:03'),
(7, 7, 1, 'withdraw', 'credit', 0.000230, NULL, '2026-05-19 04:09:13', '2026-06-23 10:14:20', NULL),
(8, 7, 1, 'withdraw', 'cash', 0.000270, NULL, '2026-05-19 04:09:36', '2026-05-25 13:23:35', NULL),
(9, 1, 1, 'withdraw', 'credit', 1.750000, NULL, '2026-05-19 04:11:37', '2026-05-19 04:11:37', NULL),
(10, 1, 1, 'withdraw', 'cash', 1.780000, NULL, '2026-05-19 04:11:59', '2026-05-22 03:22:30', NULL),
(11, 1, 1, 'send', 'credit', 0.450450, NULL, '2026-05-19 04:12:22', '2026-06-05 11:44:35', NULL),
(12, 1, 1, 'send', 'cash', 0.540540, NULL, '2026-05-19 04:12:42', '2026-06-09 04:18:28', NULL),
(13, 5, 1, 'send', 'cash', 0.000000, NULL, '2026-05-19 11:25:49', '2026-05-19 11:32:07', '2026-05-19 11:32:07'),
(14, 5, 1, 'send', 'cash', 0.000270, NULL, '2026-05-19 11:32:43', '2026-05-19 11:32:43', NULL),
(15, 2, 1, 'send', 'cash', 3680.000000, '2026-05-19 13:57:58', '2026-05-19 12:44:07', '2026-05-19 13:57:58', NULL),
(16, 2, 1, 'send', 'cash', 3680.000000, NULL, '2026-05-19 13:57:58', '2026-05-19 13:57:58', NULL),
(17, 7, 1, 'send', 'cash', 3680.000000, '2026-06-04 06:21:14', '2026-05-19 13:58:39', '2026-06-04 06:21:14', NULL),
(18, 8, 1, 'send', 'cash', 6700.000000, NULL, '2026-05-22 06:49:06', '2026-05-22 06:49:06', NULL),
(19, 8, 1, 'withdraw', 'cash', 0.000150, NULL, '2026-05-22 06:54:29', '2026-05-22 06:54:29', NULL),
(20, 7, 1, 'send', 'cash', 3650.000000, NULL, '2026-06-04 06:21:14', '2026-06-20 04:59:47', NULL),
(21, 7, 1, 'send', 'credit', 3650.000000, NULL, '2026-06-16 12:45:14', '2026-06-16 12:45:14', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `client_wallets`
--

CREATE TABLE `client_wallets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `client_id` bigint(20) UNSIGNED NOT NULL,
  `currency_id` bigint(20) UNSIGNED NOT NULL,
  `balance` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `client_wallets`
--

INSERT INTO `client_wallets` (`id`, `client_id`, `currency_id`, `balance`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 5, 1, 0.0000, '2026-05-12 09:13:16', '2026-05-13 07:06:17', NULL),
(2, 5, 2, 0.0000, '2026-05-12 09:13:16', '2026-05-12 09:13:16', NULL),
(3, 5, 3, 0.0000, '2026-05-12 09:13:16', '2026-05-12 09:13:16', NULL),
(4, 5, 4, 0.0000, '2026-05-12 09:13:16', '2026-05-13 07:06:17', NULL),
(5, 6, 1, 0.0000, '2026-05-13 04:25:06', '2026-05-13 04:25:06', NULL),
(6, 6, 2, 0.0000, '2026-05-13 04:25:06', '2026-05-13 04:25:06', NULL),
(7, 6, 3, 0.0000, '2026-05-13 04:25:06', '2026-05-13 04:25:06', NULL),
(8, 6, 4, 0.0000, '2026-05-13 04:25:06', '2026-05-13 04:25:06', NULL),
(9, 7, 1, 0.0000, '2026-05-13 04:38:51', '2026-05-13 04:49:51', NULL),
(10, 7, 2, 0.0000, '2026-05-13 04:38:51', '2026-05-13 04:38:51', NULL),
(11, 7, 3, 0.0000, '2026-05-13 04:38:51', '2026-05-13 04:38:51', NULL),
(12, 7, 4, 0.0000, '2026-05-13 04:38:51', '2026-05-13 04:38:51', NULL),
(13, 8, 1, 0.0000, '2026-05-18 07:24:49', '2026-06-23 10:52:46', NULL),
(14, 8, 2, 0.0000, '2026-05-18 07:24:49', '2026-05-18 07:24:49', NULL),
(15, 8, 3, 0.0000, '2026-05-18 07:24:49', '2026-06-23 10:53:05', NULL),
(16, 8, 4, 0.0000, '2026-05-18 07:24:49', '2026-05-18 07:24:49', NULL),
(17, 9, 1, 182500.0000, '2026-05-26 03:20:53', '2026-10-15 06:43:32', NULL),
(18, 9, 2, 0.0000, '2026-05-26 03:20:53', '2026-05-26 03:20:53', NULL),
(19, 9, 3, 0.0000, '2026-05-26 03:20:53', '2026-07-09 13:19:49', NULL),
(20, 9, 4, 0.0000, '2026-05-26 03:20:53', '2026-06-19 04:53:25', NULL),
(21, 10, 1, 27027.0000, '2026-06-04 05:45:59', '2026-10-15 05:55:50', NULL),
(22, 10, 2, 0.0000, '2026-06-04 05:45:59', '2026-06-04 05:45:59', NULL),
(23, 10, 3, 0.0000, '2026-06-04 05:45:59', '2026-07-07 05:00:35', NULL),
(24, 10, 4, 53400.0000, '2026-06-04 05:45:59', '2026-10-15 05:57:49', NULL),
(25, 11, 1, 27027.0000, '2026-06-04 05:46:38', '2026-10-15 06:05:44', NULL),
(26, 11, 2, 0.0000, '2026-06-04 05:46:38', '2026-06-04 05:46:38', NULL),
(27, 11, 3, 0.0000, '2026-06-04 05:46:38', '2026-07-14 05:52:17', NULL),
(28, 11, 4, 0.0000, '2026-06-04 05:46:38', '2026-06-04 05:46:38', NULL),
(29, 12, 1, 500000.0000, '2026-06-04 06:12:07', '2026-10-15 05:54:20', NULL),
(30, 12, 2, 0.0000, '2026-06-04 06:12:07', '2026-06-04 06:12:07', NULL),
(31, 12, 3, 0.0000, '2026-06-04 06:12:07', '2026-07-14 05:46:15', NULL),
(32, 12, 4, 0.0000, '2026-06-04 06:12:07', '2026-06-04 06:12:07', NULL),
(33, 13, 1, 0.0000, '2026-06-04 06:14:09', '2026-07-14 07:37:59', NULL),
(34, 13, 2, 0.0000, '2026-06-04 06:14:09', '2026-06-04 06:14:09', NULL),
(35, 13, 3, 0.0000, '2026-06-04 06:14:09', '2026-07-14 07:37:59', NULL),
(36, 13, 4, 0.0000, '2026-06-04 06:14:09', '2026-06-04 06:14:25', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `currencies`
--

CREATE TABLE `currencies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(3) NOT NULL,
  `symbol` varchar(10) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `currencies`
--

INSERT INTO `currencies` (`id`, `name`, `code`, `symbol`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Uganda Shilling', 'UGX', 'Ush', '2026-05-07 07:59:53', '2026-05-07 23:56:41', NULL),
(2, 'Kenya Shilling', 'KES', 'Ksh', '2026-05-07 08:02:24', '2026-05-07 08:02:24', NULL),
(3, 'US Dollar', 'USD', '$', '2026-05-07 10:25:31', '2026-05-07 10:25:31', NULL),
(4, 'South Sudanese Pounds', 'SSP', '£', '2026-05-07 10:26:19', '2026-05-07 23:54:52', NULL),
(5, 'Euros', 'EUR', '€', '2026-05-11 05:27:47', '2026-05-11 05:27:59', '2026-05-11 05:27:59');

-- --------------------------------------------------------

--
-- Table structure for table `currency_pairs`
--

CREATE TABLE `currency_pairs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `base_currency` bigint(20) UNSIGNED NOT NULL,
  `quote_currency` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `base_is_foreign` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `currency_pairs`
--

INSERT INTO `currency_pairs` (`id`, `base_currency`, `quote_currency`, `created_at`, `updated_at`, `deleted_at`, `base_is_foreign`) VALUES
(1, 4, 1, '2026-05-07 10:27:45', '2026-05-22 04:42:30', NULL, 1),
(2, 3, 1, '2026-05-07 10:56:01', '2026-05-21 07:23:25', '2026-05-21 07:23:25', 0),
(3, 1, 4, '2026-05-07 10:56:41', '2026-05-21 07:23:44', '2026-05-21 07:23:44', 0),
(4, 1, 2, '2026-05-07 11:09:18', '2026-05-21 07:23:29', '2026-05-21 07:23:29', 0),
(5, 4, 2, '2026-05-07 11:09:55', '2026-05-21 07:23:32', '2026-05-21 07:23:32', 0),
(6, 2, 3, '2026-05-11 05:28:21', '2026-05-11 05:28:36', '2026-05-11 05:28:36', 0),
(7, 1, 3, '2026-05-19 04:03:20', '2026-05-19 04:03:20', NULL, 0),
(8, 4, 3, '2026-05-22 04:59:34', '2026-05-22 04:59:34', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ref_no` varchar(255) NOT NULL,
  `expense_category_id` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(20,4) NOT NULL,
  `currency_id` bigint(20) UNSIGNED NOT NULL,
  `expense_date` date NOT NULL,
  `payment_source` enum('till','other') NOT NULL DEFAULT 'till',
  `description` varchar(255) NOT NULL,
  `recorded_by` bigint(20) UNSIGNED NOT NULL,
  `is_reversed` tinyint(1) NOT NULL DEFAULT 0,
  `reversed_at` timestamp NULL DEFAULT NULL,
  `reversed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `reversal_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`id`, `ref_no`, `expense_category_id`, `amount`, `currency_id`, `expense_date`, `payment_source`, `description`, `recorded_by`, `is_reversed`, `reversed_at`, `reversed_by`, `reversal_reason`, `created_at`, `updated_at`) VALUES
(1, 'EXP-20260619-EDQR', 1, 200000.0000, 1, '2026-06-19', 'till', 'Office rent for june', 1, 1, '2026-06-19 06:09:02', 1, 'recorded error', '2026-06-19 06:05:46', '2026-06-19 06:09:02'),
(2, 'EXP-20260619-Q9AR', 2, 150000.0000, 1, '2026-06-19', 'other', 'weekly salary', 1, 0, NULL, NULL, NULL, '2026-06-19 06:09:51', '2026-06-19 06:09:51');

-- --------------------------------------------------------

--
-- Table structure for table `expense_categories`
--

CREATE TABLE `expense_categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_categories`
--

INSERT INTO `expense_categories` (`id`, `name`, `description`, `is_active`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 'Rent', NULL, 1, NULL, '2026-06-19 05:53:17', '2026-06-19 05:53:17'),
(2, 'Salary', NULL, 1, NULL, '2026-06-19 06:00:16', '2026-06-19 06:00:16');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(5, '2026_05_06_145911_add_new_column_to_users_table', 2),
(6, '2026_05_07_091140_create_currencies_table', 3),
(7, '2026_05_07_121416_create_currency_pairs_table', 4),
(8, '2026_05_08_074043_create_agent_rates_table', 5),
(9, '2026_05_08_102348_create_client_rates_table', 6),
(15, '2026_05_08_135519_create_agent_lines_table', 7),
(16, '2026_05_11_091746_create_clients_table', 7),
(18, '2026_05_11_091947_create_client_wallets_table', 8),
(19, '2026_05_12_114535_create_till_sessions_table', 9),
(20, '2026_05_12_114813_create_till_entries_table', 9),
(21, '2026_05_12_124420_create_transactions_table', 10),
(22, '2026_05_12_130418_add_new_column_to_till_entries_table', 10),
(23, '2026_05_13_080411_create_pending_settlements_table', 11),
(24, '2026_05_19_142800_modify_rate_in_client_rates_table', 12),
(25, '2026_05_19_142939_modify_rate_in_agent_rates_table', 12),
(26, '2026_05_22_072831_add_new_column_in_currency_pairs_table', 13),
(27, '2026_05_28_062545_create_agent_commissions_table', 14),
(28, '2026_05_28_074451_add_new_columns_to_transactions_table', 15),
(29, '2026_06_03_154442_add_new_columns_to_transactions_table', 16),
(30, '2026_06_04_072311_add_new_column_to_pending_settlement_table', 17),
(31, '2026_06_04_072822_create_settlement_payments_table', 17),
(33, '2026_06_16_155807_modify_column_in_transactions_table', 18),
(34, '2026_06_19_081052_create_expense_categories_table', 19),
(35, '2026_06_19_081232_create_expenses_table', 19),
(36, '2026_06_19_081749_add_expense_id_to_till_entries_table', 19),
(45, '2026_06_24_112403_create_roles_table', 20),
(46, '2026_06_24_112744_create_permissions_table', 20),
(47, '2026_06_24_114013_add_new_column_to_users_table', 20),
(48, '2026_06_24_114346_create_role_permissions_table', 20),
(49, '2026_06_24_125908_drop_column_from_users__table', 21),
(54, '2026_06_25_125608_modify_till_sessions_table', 22),
(55, '2026_06_25_130059_modify_till_sessions_table', 22);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pending_settlements`
--

CREATE TABLE `pending_settlements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `transaction_id` bigint(20) UNSIGNED NOT NULL,
  `amount_due` decimal(10,2) NOT NULL,
  `amount_paid` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `amount_remaining` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `currency_id` bigint(20) UNSIGNED NOT NULL,
  `due_date` date NOT NULL,
  `status` enum('unsettled','settled','overdue') NOT NULL DEFAULT 'unsettled',
  `settled_at` timestamp NULL DEFAULT NULL,
  `settled_by` bigint(20) UNSIGNED DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pending_settlements`
--

INSERT INTO `pending_settlements` (`id`, `transaction_id`, `amount_due`, `amount_paid`, `amount_remaining`, `currency_id`, `due_date`, `status`, `settled_at`, `settled_by`, `notes`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 9, 30000.00, 0.0000, 0.0000, 4, '2026-05-20', 'settled', '2026-05-13 06:42:13', 1, NULL, '2026-05-13 06:02:29', '2026-05-13 06:42:13', NULL),
(2, 10, 15000.00, 0.0000, 0.0000, 4, '2026-05-20', 'settled', '2026-05-13 06:42:53', 1, NULL, '2026-05-13 06:39:26', '2026-05-13 06:42:53', NULL),
(3, 12, 15000.00, 15000.0000, 0.0000, 4, '2026-05-20', 'settled', '2026-06-23 09:40:15', 1, NULL, '2026-05-13 07:03:52', '2026-06-23 09:40:15', NULL),
(4, 26, 100000.00, 0.0000, 0.0000, 4, '2026-05-25', 'settled', '2026-05-18 08:02:41', 1, NULL, '2026-05-18 08:00:07', '2026-05-18 08:02:41', NULL),
(5, 90, 100000.00, 0.0000, 0.0000, 4, '2026-06-16', 'unsettled', NULL, NULL, NULL, '2026-06-09 04:04:37', '2026-06-09 04:04:37', NULL),
(6, 91, 185000.00, 100000.0000, 85000.0000, 4, '2026-06-16', 'unsettled', NULL, NULL, NULL, '2026-06-09 04:18:39', '2026-06-09 04:26:29', NULL),
(7, 99, 50.00, 50.0000, 0.0000, 3, '2026-06-23', 'settled', '2026-06-23 05:16:53', 1, NULL, '2026-06-16 12:46:22', '2026-06-23 05:16:53', NULL),
(8, 102, 18500.00, 18500.0000, 0.0000, 4, '2026-06-26', 'settled', '2026-06-19 04:28:00', 1, NULL, '2026-06-19 04:21:02', '2026-06-19 04:28:00', NULL),
(9, 112, 150.00, 150.0000, 0.0000, 3, '2026-06-30', 'settled', '2026-06-23 09:42:43', 1, NULL, '2026-06-23 09:42:03', '2026-06-23 09:42:43', NULL),
(10, 113, 730000.00, 730000.0000, 0.0000, 1, '2026-06-30', 'settled', '2026-06-23 10:19:25', 1, NULL, '2026-06-23 10:14:48', '2026-06-23 10:19:26', NULL),
(11, 114, 50.00, 50.0000, 0.0000, 3, '2026-06-30', 'settled', '2026-06-23 10:26:27', 1, NULL, '2026-06-23 10:25:48', '2026-06-23 10:26:27', NULL),
(12, 115, 450000.00, 450000.0000, 0.0000, 1, '2026-06-30', 'settled', '2026-06-23 10:31:34', 1, NULL, '2026-06-23 10:29:45', '2026-06-23 10:31:34', NULL),
(13, 116, 70.00, 70.0000, 0.0000, 3, '2026-06-30', 'settled', '2026-06-23 10:36:48', 1, NULL, '2026-06-23 10:36:20', '2026-06-23 10:36:48', NULL),
(14, 117, 50.00, 50.0000, 0.0000, 3, '2026-06-30', 'settled', '2026-06-23 10:48:06', 1, NULL, '2026-06-23 10:47:45', '2026-06-23 10:48:06', NULL),
(15, 118, 100.00, 100.0000, 0.0000, 3, '2026-06-30', 'settled', '2026-06-23 10:53:02', 1, NULL, '2026-06-23 10:52:46', '2026-06-23 10:53:02', NULL),
(16, 120, 300000.00, 300000.0000, 0.0000, 1, '2026-06-30', 'settled', '2026-06-23 11:03:10', 1, NULL, '2026-06-23 11:00:45', '2026-06-23 11:03:10', NULL),
(17, 122, 400000.00, 400000.0000, 0.0000, 1, '2026-06-30', 'settled', '2026-06-23 11:12:26', 1, NULL, '2026-06-23 11:09:11', '2026-06-23 11:12:26', NULL),
(18, 131, 100.00, 100.0000, 0.0000, 3, '2026-07-03', 'settled', '2026-06-26 09:33:19', 1, NULL, '2026-06-26 09:10:14', '2026-06-26 09:33:19', NULL),
(19, 133, 50.00, 50.0000, 0.0000, 3, '2026-07-03', 'settled', '2026-06-26 09:52:44', 1, NULL, '2026-06-26 09:52:06', '2026-06-26 09:52:44', NULL),
(20, 135, 500.00, 500.0000, 0.0000, 3, '2026-07-14', 'settled', '2026-07-09 13:03:03', 1, NULL, '2026-07-07 05:00:35', '2026-07-09 13:03:03', NULL),
(21, 136, 1000000.00, 500000.0000, 500000.0000, 1, '2026-07-16', 'unsettled', NULL, NULL, NULL, '2026-07-09 13:14:04', '2026-07-09 13:14:04', NULL),
(22, 137, 300.00, 300.0000, 0.0000, 3, '2026-07-16', 'settled', '2026-07-09 13:19:49', 1, NULL, '2026-07-09 13:18:09', '2026-07-09 13:19:49', NULL),
(23, 141, 50.00, 40.0000, 10.0000, 3, '2026-07-20', 'unsettled', NULL, NULL, NULL, '2026-07-13 10:18:08', '2026-10-19 07:55:54', NULL),
(24, 151, 150.00, 150.0000, 0.0000, 3, '2026-07-21', 'settled', '2026-07-14 07:38:38', 1, NULL, '2026-07-14 07:37:59', '2026-07-14 07:38:38', NULL),
(25, 159, 50.00, 0.0000, 50.0000, 3, '2026-10-22', 'unsettled', NULL, NULL, NULL, '2026-10-15 06:43:32', '2026-10-15 06:43:32', NULL),
(26, 160, 100.00, 0.0000, 100.0000, 3, '2026-10-22', 'unsettled', NULL, NULL, NULL, '2026-10-15 06:54:24', '2026-10-15 06:54:24', NULL),
(27, 161, 100000.00, 0.0000, 100000.0000, 4, '2026-10-22', 'unsettled', NULL, NULL, NULL, '2026-10-15 07:21:32', '2026-10-15 07:21:32', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `group` varchar(255) NOT NULL DEFAULT 'general',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `name`, `slug`, `group`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'View Dashboard', 'dashboard.view', 'dashboard', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(2, 'View Transactions', 'transactions.view', 'transactions', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(3, 'Create Transactions', 'transactions.create', 'transactions', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(4, 'Settle Transactions', 'transactions.settle', 'transactions', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(5, 'Reverse Transactions', 'transactions.reverse', 'transactions', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(6, 'Cancel Transactions', 'transactions.cancel', 'transactions', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(7, 'View Clients', 'clients.view', 'clients', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(8, 'Create Clients', 'clients.create', 'clients', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(9, 'Edit Clients', 'clients.edit', 'clients', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(10, 'Delete Clients', 'clients.delete', 'clients', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(11, 'Manage Wallets', 'clients.wallets', 'clients', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(12, 'View Rates', 'rates.view', 'rates', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(13, 'Manage Client Rates', 'rates.client.manage', 'rates', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(14, 'Manage Agent Rates', 'rates.agent.manage', 'rates', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(15, 'View Till', 'till.view', 'till', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(16, 'Open/Close Till', 'till.manage', 'till', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(17, 'View Credits', 'credits.view', 'credits', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(18, 'Settle Credits', 'credits.settle', 'credits', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(19, 'View Agent Lines', 'agent-lines.view', 'agents', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(20, 'Manage Agent Lines', 'agent-lines.manage', 'agents', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(21, 'Agent Transactions', 'agent-transactions.create', 'agents', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(22, 'View Expenses', 'expenses.view', 'expenses', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(23, 'Create Expenses', 'expenses.create', 'expenses', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(24, 'Reverse Expenses', 'expenses.reverse', 'expenses', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(25, 'Manage Expense Categories', 'expense-categories.manage', 'expenses', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(26, 'View Reports', 'reports.view', 'reports', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(27, 'View Commissions', 'commissions.view', 'reports', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(28, 'Manage Commissions', 'commissions.manage', 'reports', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(29, 'Manage Users', 'users.manage', 'system', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(30, 'Manage Roles', 'roles.manage', 'system', '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `slug`, `description`, `is_system`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Admin', 'admin', 'Full system access', 1, '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(2, 'Teller', 'teller', 'Day-to-day transaction processing', 1, '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL),
(3, 'Agent', 'agent', 'Agent line portal access only', 1, '2026-06-24 09:06:21', '2026-06-24 09:06:21', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `role_permission`
--

CREATE TABLE `role_permission` (
  `role_id` bigint(20) UNSIGNED NOT NULL,
  `permission_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permission`
--

INSERT INTO `role_permission` (`role_id`, `permission_id`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, NULL),
(1, 2, NULL, NULL),
(1, 3, NULL, NULL),
(1, 4, NULL, NULL),
(1, 5, NULL, NULL),
(1, 6, NULL, NULL),
(1, 7, NULL, NULL),
(1, 8, NULL, NULL),
(1, 9, NULL, NULL),
(1, 10, NULL, NULL),
(1, 11, NULL, NULL),
(1, 12, NULL, NULL),
(1, 13, NULL, NULL),
(1, 14, NULL, NULL),
(1, 15, NULL, NULL),
(1, 16, NULL, NULL),
(1, 17, NULL, NULL),
(1, 18, NULL, NULL),
(1, 19, NULL, NULL),
(1, 20, NULL, NULL),
(1, 21, NULL, NULL),
(1, 22, NULL, NULL),
(1, 23, NULL, NULL),
(1, 24, NULL, NULL),
(1, 25, NULL, NULL),
(1, 26, NULL, NULL),
(1, 27, NULL, NULL),
(1, 28, NULL, NULL),
(1, 29, NULL, NULL),
(1, 30, NULL, NULL),
(2, 1, NULL, NULL),
(2, 2, NULL, NULL),
(2, 3, NULL, NULL),
(2, 4, NULL, NULL),
(2, 6, NULL, NULL),
(2, 7, NULL, NULL),
(2, 8, NULL, NULL),
(2, 9, NULL, NULL),
(2, 11, NULL, NULL),
(2, 12, NULL, NULL),
(2, 15, NULL, NULL),
(2, 16, NULL, NULL),
(2, 17, NULL, NULL),
(2, 18, NULL, NULL),
(2, 19, NULL, NULL),
(2, 21, NULL, NULL),
(2, 22, NULL, NULL),
(2, 23, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('1SDOJSVtwLuzwD2tfW13RfCVd21o2QcQW1GGU7FN', 1, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoiblZOMVl1ZzQ3WVBYZHI3OTI4aWZkb3lOZ29nemNzUVhzOTNtTWVWTiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mzc6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9jbGllbnRzL3dhbGxldHMiO3M6NToicm91dGUiO3M6MTU6ImNsaWVudHMud2FsbGV0cyI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fXM6NTA6ImxvZ2luX3dlYl81OWJhMzZhZGRjMmIyZjk0MDE1ODBmMDE0YzdmNThlYTRlMzA5ODlkIjtpOjE7fQ==', 1792059697),
('Z8vyjESeyNeNPJjneXhWf3VpWbJQOBtmU8YRPSR6', 1, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoiME5zUjRQVktjeDVwUUJ1YmZ2aTIzYnVKSXE5M0l3cEM2VGUxUW41MyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDY6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC90cmFuc2FjdGlvbnMvMTU3L3JlY2VpcHQiO3M6NToicm91dGUiO3M6MjA6InRyYW5zYWN0aW9ucy5yZWNlaXB0Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo1MDoibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO2k6MTt9', 1792414936);

-- --------------------------------------------------------

--
-- Table structure for table `settlement_payments`
--

CREATE TABLE `settlement_payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `pending_settlement_id` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(20,4) NOT NULL,
  `currency_id` bigint(20) UNSIGNED NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `teller_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `settlement_payments`
--

INSERT INTO `settlement_payments` (`id`, `pending_settlement_id`, `amount`, `currency_id`, `notes`, `teller_id`, `created_at`, `updated_at`) VALUES
(1, 3, 10000.0000, 4, 'Paid via cash', 1, '2026-06-04 05:07:53', '2026-06-04 05:07:53'),
(2, 6, 100000.0000, 4, NULL, 1, '2026-06-09 04:26:29', '2026-06-09 04:26:29'),
(3, 3, 2000.0000, 4, NULL, 1, '2026-06-16 12:47:13', '2026-06-16 12:47:13'),
(4, 8, 5000.0000, 4, NULL, 1, '2026-06-19 04:27:24', '2026-06-19 04:27:24'),
(5, 8, 13500.0000, 4, NULL, 1, '2026-06-19 04:28:00', '2026-06-19 04:28:00'),
(6, 7, 50.0000, 3, NULL, 1, '2026-06-23 05:16:53', '2026-06-23 05:16:53'),
(7, 3, 3000.0000, 4, NULL, 1, '2026-06-23 09:40:13', '2026-06-23 09:40:13'),
(8, 9, 150.0000, 3, NULL, 1, '2026-06-23 09:42:43', '2026-06-23 09:42:43'),
(9, 10, 1000000.0000, 1, NULL, 1, '2026-06-23 10:19:25', '2026-06-23 10:19:25'),
(10, 11, 100.0000, 3, NULL, 1, '2026-06-23 10:26:27', '2026-06-23 10:26:27'),
(11, 12, 150000.0000, 1, NULL, 1, '2026-06-23 10:30:48', '2026-06-23 10:30:48'),
(12, 12, 500000.0000, 1, NULL, 1, '2026-06-23 10:31:34', '2026-06-23 10:31:34'),
(13, 13, 150.0000, 3, NULL, 1, '2026-06-23 10:36:48', '2026-06-23 10:36:48'),
(14, 14, 100.0000, 3, NULL, 1, '2026-06-23 10:48:06', '2026-06-23 10:48:06'),
(15, 15, 200.0000, 3, NULL, 1, '2026-06-23 10:53:02', '2026-06-23 10:53:02'),
(16, 16, 500000.0000, 1, NULL, 1, '2026-06-23 11:03:10', '2026-06-23 11:03:10'),
(17, 17, 1000000.0000, 1, NULL, 1, '2026-06-23 11:12:26', '2026-06-23 11:12:26'),
(18, 18, 50.0000, 3, NULL, 1, '2026-06-26 09:25:28', '2026-06-26 09:25:28'),
(19, 18, 150.0000, 3, NULL, 1, '2026-06-26 09:33:19', '2026-06-26 09:33:19'),
(20, 19, 100.0000, 3, NULL, 1, '2026-06-26 09:52:44', '2026-06-26 09:52:44'),
(21, 20, 200.0000, 3, NULL, 1, '2026-07-09 13:03:03', '2026-07-09 13:03:03'),
(22, 22, 200.0000, 3, NULL, 1, '2026-07-09 13:19:49', '2026-07-09 13:19:49'),
(23, 24, 50.0000, 3, NULL, 1, '2026-07-14 07:38:38', '2026-07-14 07:38:38'),
(25, 23, 40.0000, 3, NULL, 1, '2026-10-19 07:55:54', '2026-10-19 07:55:54');

-- --------------------------------------------------------

--
-- Table structure for table `till_entries`
--

CREATE TABLE `till_entries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `till_session_id` bigint(20) UNSIGNED NOT NULL,
  `movement_type` enum('in','out') NOT NULL,
  `amount` decimal(20,4) NOT NULL,
  `balance_after` decimal(20,4) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `transaction_id` bigint(20) UNSIGNED DEFAULT NULL,
  `expense_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `till_entries`
--

INSERT INTO `till_entries` (`id`, `till_session_id`, `movement_type`, `amount`, `balance_after`, `note`, `created_by`, `created_at`, `updated_at`, `deleted_at`, `transaction_id`, `expense_id`) VALUES
(1, 1, 'in', 100000.0000, 5100000.0000, 'Deposit — Negus', 1, '2026-05-12 09:14:17', '2026-05-12 09:14:17', NULL, NULL, NULL),
(2, 1, 'out', 27000.0000, 5073000.0000, 'Exchange — FX-20260512-JRMA', 1, '2026-05-12 11:22:44', '2026-05-12 11:22:44', NULL, 2, NULL),
(3, 3, 'in', 50000.0000, 10050000.0000, 'Exchange — FX-20260512-JRMA', 1, '2026-05-12 11:22:44', '2026-05-12 11:22:44', NULL, 2, NULL),
(4, 1, 'out', 46440.0000, 5026560.0000, 'Exchange — FX-20260512-OMEL', 1, '2026-05-12 11:24:33', '2026-05-12 11:24:33', NULL, 3, NULL),
(5, 3, 'in', 27000.0000, 10077000.0000, 'Exchange — FX-20260512-OMEL', 1, '2026-05-12 11:24:33', '2026-05-12 11:24:33', NULL, 3, NULL),
(6, 3, 'out', 24800.0000, 10052200.0000, 'Pending send — FX-20260512-P3VE', 1, '2026-05-12 12:31:26', '2026-05-12 12:31:26', NULL, 5, NULL),
(7, 1, 'in', 20000.0000, 5046560.0000, 'Settlement — FX-20260512-P3VE', 1, '2026-05-12 12:32:07', '2026-05-12 12:32:07', NULL, 5, NULL),
(8, 5, 'out', 27000.0000, 1973000.0000, 'Exchange — FX-20260513-FIPG', 1, '2026-05-13 04:49:51', '2026-05-13 04:49:51', NULL, 7, NULL),
(9, 4, 'in', 50000.0000, 2050000.0000, 'Exchange — FX-20260513-FIPG', 1, '2026-05-13 04:49:51', '2026-05-13 04:49:51', NULL, 7, NULL),
(11, 5, 'out', 13500.0000, 1959500.0000, 'Credit send — FX-20260513-VUFD', 1, '2026-05-13 06:02:29', '2026-05-13 06:02:29', NULL, 9, NULL),
(12, 5, 'out', 6750.0000, 1952750.0000, 'Credit send — FX-20260513-BSMY', 1, '2026-05-13 06:39:26', '2026-05-13 06:39:26', NULL, 10, NULL),
(13, 4, 'in', 30000.0000, 2080000.0000, 'Credit settlement — FX-20260513-VUFD', 1, '2026-05-13 06:42:13', '2026-05-13 06:42:13', NULL, 9, NULL),
(14, 4, 'in', 15000.0000, 2095000.0000, 'Credit settlement — FX-20260513-BSMY', 1, '2026-05-13 06:42:53', '2026-05-13 06:42:53', NULL, 10, NULL),
(15, 5, 'out', 27000.0000, 1925750.0000, 'Pending send — FX-20260513-OI1I', 1, '2026-05-13 07:02:33', '2026-05-13 07:02:33', NULL, 11, NULL),
(16, 5, 'out', 6750.0000, 1919000.0000, 'Credit send — FX-20260513-UP3P', 1, '2026-05-13 07:03:52', '2026-05-13 07:03:52', NULL, 12, NULL),
(17, 4, 'out', 37200.0000, 2057800.0000, 'Exchange — FX-20260513-VWUV', 1, '2026-05-13 07:06:17', '2026-05-13 07:06:17', NULL, 15, NULL),
(19, 5, 'out', 375000.0000, 1544000.0000, 'Agent buy — FX-20260513-WGMR', 1, '2026-05-13 07:44:49', '2026-05-13 07:44:49', NULL, 17, NULL),
(20, 6, 'in', 100.0000, 100.0000, 'Agent buy — FX-20260513-WGMR', 1, '2026-05-13 07:44:49', '2026-05-13 07:44:49', NULL, 17, NULL),
(21, 5, 'out', 75200.0000, 1468800.0000, 'Agent sell — FX-20260513-V2Q7', 1, '2026-05-13 08:48:43', '2026-05-13 08:48:43', NULL, 18, NULL),
(22, 6, 'in', 20.0000, 120.0000, 'Agent sell — FX-20260513-V2Q7', 1, '2026-05-13 08:48:43', '2026-05-13 08:48:43', NULL, 18, NULL),
(23, 5, 'out', 188000.0000, 1280800.0000, 'Agent sell — FX-20260513-9MZF', 1, '2026-05-13 08:51:10', '2026-05-13 08:51:10', NULL, 19, NULL),
(24, 6, 'in', 50.0000, 170.0000, 'Agent sell — FX-20260513-9MZF', 1, '2026-05-13 08:51:10', '2026-05-13 08:51:10', NULL, 19, NULL),
(25, 5, 'out', 56400.0000, 1224400.0000, 'Agent sell — FX-20260513-PRXV', 1, '2026-05-13 08:58:25', '2026-05-13 08:58:25', NULL, 20, NULL),
(26, 6, 'in', 15.0000, 185.0000, 'Agent sell — FX-20260513-PRXV', 1, '2026-05-13 08:58:25', '2026-05-13 08:58:25', NULL, 20, NULL),
(27, 6, 'out', 50.0000, 135.0000, 'Agent sell — FX-20260513-YGAZ', 1, '2026-05-13 09:30:43', '2026-05-13 09:30:43', NULL, 21, NULL),
(28, 5, 'in', 188000.0000, 1412400.0000, 'Agent sell — FX-20260513-YGAZ', 1, '2026-05-13 09:30:43', '2026-05-13 09:30:43', NULL, 21, NULL),
(29, 6, 'out', 20.0000, 115.0000, 'Agent sell — FX-20260513-VAWW', 1, '2026-05-13 09:38:45', '2026-05-13 09:38:45', NULL, 22, NULL),
(30, 5, 'in', 75200.0000, 1487600.0000, 'Agent sell — FX-20260513-VAWW', 1, '2026-05-13 09:38:45', '2026-05-13 09:38:45', NULL, 22, NULL),
(31, 5, 'out', 94500.0000, 1393100.0000, 'Exchange — FX-20260513-NJYD', 1, '2026-05-13 09:44:06', '2026-05-13 09:44:06', NULL, 23, NULL),
(32, 4, 'in', 175000.0000, 2232800.0000, 'Exchange — FX-20260513-NJYD', 1, '2026-05-13 09:44:06', '2026-05-13 09:44:06', NULL, 23, NULL),
(33, 8, 'in', 100.0000, 600.0000, 'Deposit — John Okeloo', 1, '2026-05-18 07:31:07', '2026-05-18 07:31:07', NULL, NULL, NULL),
(34, 7, 'in', 1000000.0000, 4000000.0000, 'Deposit — John Okeloo', 1, '2026-05-18 07:42:06', '2026-05-18 07:42:06', NULL, NULL, NULL),
(35, 7, 'out', 27000.0000, 3973000.0000, 'Exchange — FX-20260518-D661', 1, '2026-05-18 07:50:22', '2026-05-18 07:50:22', NULL, 24, NULL),
(36, 9, 'in', 50000.0000, 2050000.0000, 'Exchange — FX-20260518-D661', 1, '2026-05-18 07:50:22', '2026-05-18 07:50:22', NULL, 24, NULL),
(37, 7, 'out', 86000.0000, 3887000.0000, 'Pending send — FX-20260518-KDWR', 1, '2026-05-18 07:54:27', '2026-05-18 07:54:27', NULL, 25, NULL),
(38, 9, 'in', 50000.0000, 2100000.0000, 'Settlement — FX-20260518-KDWR', 1, '2026-05-18 07:55:00', '2026-05-18 07:55:00', NULL, 25, NULL),
(39, 7, 'out', 45000.0000, 3842000.0000, 'Credit send — FX-20260518-QANK', 1, '2026-05-18 08:00:07', '2026-05-18 08:00:07', NULL, 26, NULL),
(40, 9, 'in', 100000.0000, 2200000.0000, 'Credit settlement — FX-20260518-QANK', 1, '2026-05-18 08:02:41', '2026-05-18 08:02:41', NULL, 26, NULL),
(42, 7, 'out', 300000.0000, 3542000.0000, 'Agent buy — FX-20260518-FDXD', 1, '2026-05-18 08:14:41', '2026-05-18 08:14:41', NULL, 28, NULL),
(43, 9, 'in', 100000.0000, 2300000.0000, 'Agent buy — FX-20260518-FDXD', 1, '2026-05-18 08:14:41', '2026-05-18 08:14:41', NULL, 28, NULL),
(44, 12, 'out', 376800.0000, -375800.0000, 'Exchange — FX-20260519-NB4T', 1, '2026-05-19 04:14:29', '2026-05-19 04:14:29', NULL, 29, NULL),
(45, 10, 'in', 100.0000, 5000100.0000, 'Exchange — FX-20260519-NB4T', 1, '2026-05-19 04:14:29', '2026-05-19 04:14:29', NULL, 29, NULL),
(46, 14, 'out', 265.3900, 734.6100, 'Exchange — FX-20260520-XRF9', 1, '2026-05-20 04:41:39', '2026-05-20 04:41:39', NULL, 30, NULL),
(47, 13, 'in', 1000000.0000, 1000000.0000, 'Exchange — FX-20260520-XRF9', 1, '2026-05-20 04:41:39', '2026-05-20 04:41:39', NULL, 30, NULL),
(48, 15, 'out', 18500.0000, 981500.0000, 'Exchange — FX-20260521-L1LN', 1, '2026-05-21 03:30:28', '2026-05-21 03:30:28', NULL, 31, NULL),
(49, 17, 'in', 10000.0000, 1010000.0000, 'Exchange — FX-20260521-L1LN', 1, '2026-05-21 03:30:28', '2026-05-21 03:30:28', NULL, 31, NULL),
(50, 16, 'out', 99.3600, 400.6400, 'Exchange — FX-20260521-XFIO', 1, '2026-05-21 04:09:25', '2026-05-21 04:09:25', NULL, 32, NULL),
(51, 15, 'in', 368000.0000, 1349500.0000, 'Exchange — FX-20260521-XFIO', 1, '2026-05-21 04:09:25', '2026-05-21 04:09:25', NULL, 32, NULL),
(52, 15, 'out', 9990.0000, 1339510.0000, 'Exchange — FX-20260521-LK1A', 1, '2026-05-21 04:13:12', '2026-05-21 04:13:12', NULL, 33, NULL),
(53, 17, 'in', 18500.0000, 1028500.0000, 'Exchange — FX-20260521-LK1A', 1, '2026-05-21 04:13:12', '2026-05-21 04:13:12', NULL, 33, NULL),
(54, 15, 'out', 185000.0000, 1154510.0000, 'Exchange — FX-20260521-EKT7', 1, '2026-05-21 04:15:41', '2026-05-21 04:15:41', NULL, 34, NULL),
(55, 17, 'in', 100000.0000, 1128500.0000, 'Exchange — FX-20260521-EKT7', 1, '2026-05-21 04:15:41', '2026-05-21 04:15:41', NULL, 34, NULL),
(56, 15, 'out', 185000.0000, 969510.0000, 'Exchange — FX-20260521-WS3X', 1, '2026-05-21 04:24:59', '2026-05-21 04:24:59', NULL, 35, NULL),
(57, 15, 'in', 100000.0000, 1069510.0000, 'Exchange — FX-20260521-WS3X', 1, '2026-05-21 04:24:59', '2026-05-21 04:24:59', NULL, 35, NULL),
(58, 17, 'out', 185000.0000, 943500.0000, 'Exchange — FX-20260521-XRAI', 1, '2026-05-21 04:51:22', '2026-05-21 04:51:22', NULL, 36, NULL),
(59, 15, 'in', 100000.0000, 1169510.0000, 'Exchange — FX-20260521-XRAI', 1, '2026-05-21 04:51:22', '2026-05-21 04:51:22', NULL, 36, NULL),
(60, 15, 'out', 368000.0000, 801510.0000, 'Exchange — FX-20260521-W1O7', 1, '2026-05-21 05:04:27', '2026-05-21 05:04:27', NULL, 37, NULL),
(61, 16, 'in', 100.0000, 500.6400, 'Exchange — FX-20260521-W1O7', 1, '2026-05-21 05:04:27', '2026-05-21 05:04:27', NULL, 37, NULL),
(62, 15, 'out', 99900.0000, 701610.0000, 'Exchange — FX-20260521-G7YC', 1, '2026-05-21 06:47:57', '2026-05-21 06:47:57', NULL, 38, NULL),
(63, 17, 'in', 185000.0000, 1128500.0000, 'Exchange — FX-20260521-G7YC', 1, '2026-05-21 06:47:57', '2026-05-21 06:47:57', NULL, 38, NULL),
(64, 17, 'out', 370000.0000, 758500.0000, 'Exchange — FX-20260521-LH1D', 1, '2026-05-21 06:50:15', '2026-05-21 06:50:15', NULL, 39, NULL),
(65, 15, 'in', 200000.0000, 901610.0000, 'Exchange — FX-20260521-LH1D', 1, '2026-05-21 06:50:15', '2026-05-21 06:50:15', NULL, 39, NULL),
(66, 15, 'out', 184000.0000, 717610.0000, 'Exchange — FX-20260521-S0SW', 1, '2026-05-21 06:51:41', '2026-05-21 06:51:41', NULL, 40, NULL),
(67, 16, 'in', 50.0000, 550.6400, 'Exchange — FX-20260521-S0SW', 1, '2026-05-21 06:51:41', '2026-05-21 06:51:41', NULL, 40, NULL),
(68, 16, 'out', 49.6800, 500.9600, 'Exchange — FX-20260521-2ALD', 1, '2026-05-21 06:52:32', '2026-05-21 06:52:32', NULL, 41, NULL),
(69, 15, 'in', 184000.0000, 901610.0000, 'Exchange — FX-20260521-2ALD', 1, '2026-05-21 06:52:32', '2026-05-21 06:52:32', NULL, 41, NULL),
(70, 19, 'out', 99.7900, 401.1700, 'Exchange — FX-20260522-VUNV', 1, '2026-05-22 05:07:31', '2026-05-22 05:07:31', NULL, 42, NULL),
(71, 18, 'in', 378000.0000, 1279610.0000, 'Exchange — FX-20260522-VUNV', 1, '2026-05-22 05:07:31', '2026-05-22 05:07:31', NULL, 42, NULL),
(72, 18, 'out', 368000.0000, 911610.0000, 'Exchange — FX-20260522-KDWY', 1, '2026-05-22 05:19:09', '2026-05-22 05:19:09', NULL, 43, NULL),
(73, 19, 'in', 100.0000, 501.1700, 'Exchange — FX-20260522-KDWY', 1, '2026-05-22 05:19:09', '2026-05-22 05:19:09', NULL, 43, NULL),
(74, 19, 'out', 100.0000, 401.1700, 'Exchange — FX-20260522-LD7L', 1, '2026-05-22 05:47:49', '2026-05-22 05:47:49', NULL, 44, NULL),
(75, 18, 'in', 378000.0000, 1289610.0000, 'Exchange — FX-20260522-LD7L', 1, '2026-05-22 05:47:49', '2026-05-22 05:47:49', NULL, 44, NULL),
(76, 18, 'out', 100000.0000, 1189610.0000, 'Exchange — FX-20260522-HKGQ', 1, '2026-05-22 06:02:09', '2026-05-22 06:02:09', NULL, 45, NULL),
(77, 20, 'in', 185000.0000, 943500.0000, 'Exchange — FX-20260522-HKGQ', 1, '2026-05-22 06:02:09', '2026-05-22 06:02:09', NULL, 45, NULL),
(78, 20, 'out', 178000.0000, 765500.0000, 'Exchange — FX-20260522-CQQQ', 1, '2026-05-22 06:05:38', '2026-05-22 06:05:38', NULL, 46, NULL),
(79, 18, 'in', 100000.0000, 1289610.0000, 'Exchange — FX-20260522-CQQQ', 1, '2026-05-22 06:05:38', '2026-05-22 06:05:38', NULL, 46, NULL),
(80, 18, 'out', 552000.0000, 737610.0000, 'Exchange — FX-20260522-QVPD', 1, '2026-05-22 06:08:42', '2026-05-22 06:08:42', NULL, 47, NULL),
(81, 19, 'in', 150.0000, 551.1700, 'Exchange — FX-20260522-QVPD', 1, '2026-05-22 06:08:42', '2026-05-22 06:08:42', NULL, 47, NULL),
(82, 19, 'out', 120.0000, 431.1700, 'Exchange — FX-20260522-3MSD', 1, '2026-05-22 06:27:37', '2026-05-22 06:27:37', NULL, 48, NULL),
(83, 18, 'in', 450000.0000, 1187610.0000, 'Exchange — FX-20260522-3MSD', 1, '2026-05-22 06:27:37', '2026-05-22 06:27:37', NULL, 48, NULL),
(84, 18, 'out', 375000.0000, 812610.0000, 'Agent buy — FX-20260522-KFDA', 1, '2026-05-22 12:19:55', '2026-05-22 12:19:55', NULL, 49, NULL),
(85, 19, 'in', 100.0000, 531.1700, 'Agent buy — FX-20260522-KFDA', 1, '2026-05-22 12:19:55', '2026-05-22 12:19:55', NULL, 49, NULL),
(86, 18, 'out', 550000.0000, 262610.0000, 'Agent sell — FX-20260522-J9Q3', 1, '2026-05-22 12:22:41', '2026-05-22 12:22:41', NULL, 50, NULL),
(87, 19, 'in', 150.0000, 681.1700, 'Agent sell — FX-20260522-J9Q3', 1, '2026-05-22 12:22:41', '2026-05-22 12:22:41', NULL, 50, NULL),
(88, 19, 'out', 550000.0000, -549318.8300, 'Agent sell — FX-20260522-7Z7X', 1, '2026-05-22 12:54:10', '2026-05-22 12:54:10', NULL, 51, NULL),
(89, 18, 'in', 146.0000, 262756.0000, 'Agent sell — FX-20260522-7Z7X', 1, '2026-05-22 12:54:10', '2026-05-22 12:54:10', NULL, 51, NULL),
(90, 18, 'out', 188000.0000, 74756.0000, 'Agent buy — FX-20260522-MSOZ', 1, '2026-05-22 13:04:23', '2026-05-22 13:04:23', NULL, 52, NULL),
(91, 19, 'in', 50.0000, -549268.8300, 'Agent buy — FX-20260522-MSOZ', 1, '2026-05-22 13:04:23', '2026-05-22 13:04:23', NULL, 52, NULL),
(92, 20, 'out', 356000.0000, 409500.0000, 'Exchange — FX-20260522-WUYK', 1, '2026-05-22 13:05:09', '2026-05-22 13:05:09', NULL, 53, NULL),
(93, 18, 'in', 200000.0000, 274756.0000, 'Exchange — FX-20260522-WUYK', 1, '2026-05-22 13:05:09', '2026-05-22 13:05:09', NULL, 53, NULL),
(94, 21, 'out', 552000.0000, 1448000.0000, 'Agent buy — FX-20260523-7THM', 1, '2026-05-23 10:10:59', '2026-05-23 10:10:59', NULL, 54, NULL),
(95, 22, 'in', 150.0000, 1150.0000, 'Agent buy — FX-20260523-7THM', 1, '2026-05-23 10:10:59', '2026-05-23 10:10:59', NULL, 54, NULL),
(96, 21, 'out', 1472000.0000, -24000.0000, 'Agent sell — FX-20260523-VZYV', 1, '2026-05-23 10:53:58', '2026-05-23 10:53:58', NULL, 55, NULL),
(97, 22, 'in', 390.0000, 1540.0000, 'Agent sell — FX-20260523-VZYV', 1, '2026-05-23 10:53:58', '2026-05-23 10:53:58', NULL, 55, NULL),
(98, 21, 'out', 1472000.0000, -1496000.0000, 'Agent sell — FX-20260523-IT9N', 1, '2026-05-23 11:38:56', '2026-05-23 11:38:56', NULL, 56, NULL),
(99, 22, 'in', 390.0000, 1930.0000, 'Agent sell — FX-20260523-IT9N', 1, '2026-05-23 11:38:56', '2026-05-23 11:38:56', NULL, 56, NULL),
(100, 22, 'out', 390.0000, 1540.0000, 'Exchange — FX-20260523-BRMU', 1, '2026-05-23 12:21:16', '2026-05-23 12:21:16', NULL, 57, NULL),
(101, 21, 'in', 1472000.0000, -24000.0000, 'Exchange — FX-20260523-BRMU', 1, '2026-05-23 12:21:16', '2026-05-23 12:21:16', NULL, 57, NULL),
(102, 22, 'out', 390.0000, 1150.0000, 'Exchange — FX-20260523-FDNH', 1, '2026-05-23 12:21:42', '2026-05-23 12:21:42', NULL, 58, NULL),
(103, 21, 'in', 1472000.0000, 1448000.0000, 'Exchange — FX-20260523-FDNH', 1, '2026-05-23 12:21:42', '2026-05-23 12:21:42', NULL, 58, NULL),
(104, 21, 'out', 150.0000, 1447850.0000, 'Agent sell — FX-20260523-IFPA', 1, '2026-05-23 12:58:10', '2026-05-23 12:58:10', NULL, 59, NULL),
(105, 22, 'in', 550000.0000, 551150.0000, 'Agent sell — FX-20260523-IFPA', 1, '2026-05-23 12:58:10', '2026-05-23 12:58:10', NULL, 59, NULL),
(106, 21, 'in', 1300.0000, 1449150.0000, 'Agent sell — FX-20260523-OGJ0', 1, '2026-05-23 13:02:41', '2026-05-23 13:02:41', NULL, 60, NULL),
(107, 22, 'out', 200.0000, 1300.0000, 'Agent sell — FX-20260523-OGJ0', 1, '2026-05-23 13:02:41', '2026-05-23 13:02:41', NULL, 60, NULL),
(108, 21, 'in', 5000000.0000, 6449150.0000, 'Agent sell — FX-20260523-AL9F', 1, '2026-05-23 13:08:56', '2026-05-23 13:08:56', NULL, 61, NULL),
(109, 22, 'out', 1300.0000, 549650.0000, 'Agent sell — FX-20260523-AL9F', 1, '2026-05-23 13:08:56', '2026-05-23 13:08:56', NULL, 61, NULL),
(110, 22, 'in', 1000.0000, 550650.0000, 'Agent buy — FX-20260523-PAEZ', 1, '2026-05-23 13:10:33', '2026-05-23 13:10:33', NULL, 62, NULL),
(111, 21, 'out', 3680000.0000, 2769150.0000, 'Agent buy — FX-20260523-PAEZ', 1, '2026-05-23 13:10:33', '2026-05-23 13:10:33', NULL, 62, NULL),
(112, 21, 'in', 550000.0000, 3319150.0000, 'Agent sell — FX-20260523-USM0', 1, '2026-05-23 13:52:05', '2026-05-23 13:52:05', NULL, 63, NULL),
(113, 22, 'out', 150.0000, 550500.0000, 'Agent sell — FX-20260523-USM0', 1, '2026-05-23 13:52:05', '2026-05-23 13:52:05', NULL, 63, NULL),
(114, 22, 'in', 500.0000, 551000.0000, 'Agent buy — FX-20260523-KKBX', 1, '2026-05-23 13:53:44', '2026-05-23 13:53:44', NULL, 64, NULL),
(115, 21, 'out', 1870000.0000, 1449150.0000, 'Agent buy — FX-20260523-KKBX', 1, '2026-05-23 13:53:44', '2026-05-23 13:53:44', NULL, 64, NULL),
(116, 24, 'out', 20000.0000, 1980000.0000, 'Exchange — FX-20260526-Y4I1', 1, '2026-05-26 03:18:15', '2026-05-26 03:18:15', NULL, 65, NULL),
(117, 26, 'in', 37000.0000, 2037000.0000, 'Exchange — FX-20260526-Y4I1', 1, '2026-05-26 03:18:15', '2026-05-26 03:18:15', NULL, 65, NULL),
(118, 24, 'out', 3680000.0000, -1700000.0000, 'Exchange — FX-20260526-WA7M', 1, '2026-05-26 03:18:50', '2026-05-26 03:18:50', NULL, 66, NULL),
(119, 25, 'in', 1000.0000, 2000.0000, 'Exchange — FX-20260526-WA7M', 1, '2026-05-26 03:18:50', '2026-05-26 03:18:50', NULL, 66, NULL),
(120, 29, 'out', 178000.0000, 4822000.0000, 'Exchange — FX-20260528-VRI5', 1, '2026-05-28 05:07:43', '2026-05-28 05:07:43', NULL, 67, NULL),
(121, 27, 'in', 100000.0000, 30100000.0000, 'Exchange — FX-20260528-VRI5', 1, '2026-05-28 05:07:43', '2026-05-28 05:07:43', NULL, 67, NULL),
(122, 27, 'out', 100000.0000, 30000000.0000, 'Exchange — FX-20260528-3HRL', 1, '2026-05-28 05:10:28', '2026-05-28 05:10:28', NULL, 68, NULL),
(123, 29, 'in', 185000.0000, 5007000.0000, 'Exchange — FX-20260528-3HRL', 1, '2026-05-28 05:10:28', '2026-05-28 05:10:28', NULL, 68, NULL),
(124, 30, 'out', 108000.0000, 2892000.0000, 'Exchange — FX-20260601-KXHW', 1, '2026-06-01 09:40:22', '2026-06-01 09:40:22', NULL, 69, NULL),
(125, 32, 'in', 200000.0000, 3200000.0000, 'Exchange — FX-20260601-KXHW', 1, '2026-06-01 09:40:22', '2026-06-01 09:40:22', NULL, 69, NULL),
(126, 32, 'out', 178000.0000, 3022000.0000, 'Exchange — FX-20260601-AZEX', 1, '2026-06-01 09:41:44', '2026-06-01 09:41:44', NULL, 70, NULL),
(127, 30, 'in', 100000.0000, 2992000.0000, 'Exchange — FX-20260601-AZEX', 1, '2026-06-01 09:41:44', '2026-06-01 09:41:44', NULL, 70, NULL),
(128, 31, 'out', 99.0000, 901.0000, 'Exchange — FX-20260601-ZU5Q', 1, '2026-06-01 09:59:34', '2026-06-01 09:59:34', NULL, 71, NULL),
(129, 30, 'in', 368000.0000, 3360000.0000, 'Exchange — FX-20260601-ZU5Q', 1, '2026-06-01 09:59:34', '2026-06-01 09:59:34', NULL, 71, NULL),
(130, 33, 'in', 99.0000, 1000099.0000, 'Reversal — FX-20260601-ZU5Q', 1, '2026-06-03 13:22:52', '2026-06-03 13:22:52', NULL, 74, NULL),
(131, 34, 'out', 368000.0000, -366000.0000, 'Reversal — FX-20260601-ZU5Q', 1, '2026-06-03 13:22:52', '2026-06-03 13:22:52', NULL, 74, NULL),
(132, 33, 'in', 178000.0000, 1178099.0000, 'Reversal — FX-20260601-AZEX', 1, '2026-06-03 13:28:26', '2026-06-03 13:28:26', NULL, 75, NULL),
(133, 33, 'out', 100000.0000, 1078099.0000, 'Reversal — FX-20260601-AZEX', 1, '2026-06-03 13:28:26', '2026-06-03 13:28:26', NULL, 75, NULL),
(134, 35, 'out', 356000.0000, 1644000.0000, 'Exchange — FX-20260603-HOYZ', 1, '2026-06-03 13:34:15', '2026-06-03 13:34:15', NULL, 76, NULL),
(135, 33, 'in', 200000.0000, 1278099.0000, 'Exchange — FX-20260603-HOYZ', 1, '2026-06-03 13:34:15', '2026-06-03 13:34:15', NULL, 76, NULL),
(136, 35, 'in', 356000.0000, 2000000.0000, 'Reversal — FX-20260603-HOYZ', 1, '2026-06-03 13:34:53', '2026-06-03 13:34:53', NULL, 77, NULL),
(137, 35, 'out', 200000.0000, 1800000.0000, 'Reversal — FX-20260603-HOYZ', 1, '2026-06-03 13:34:53', '2026-06-03 13:34:53', NULL, 77, NULL),
(138, 33, 'out', 100000.0000, 1178099.0000, 'Exchange — FX-20260603-7CJ0', 1, '2026-06-03 13:39:32', '2026-06-03 13:39:32', NULL, 78, NULL),
(139, 35, 'in', 185000.0000, 1985000.0000, 'Exchange — FX-20260603-7CJ0', 1, '2026-06-03 13:39:32', '2026-06-03 13:39:32', NULL, 78, NULL),
(140, 33, 'in', 100000.0000, 1278099.0000, 'Reversal — FX-20260603-7CJ0', 1, '2026-06-03 13:42:36', '2026-06-03 13:42:36', NULL, 79, NULL),
(141, 35, 'out', 185000.0000, 1800000.0000, 'Reversal — FX-20260603-7CJ0', 1, '2026-06-03 13:42:36', '2026-06-03 13:42:36', NULL, 79, NULL),
(142, 37, 'in', 10000.0000, 1810000.0000, 'Partial payment — FX-20260513-UP3P', 1, '2026-06-04 05:07:53', '2026-06-04 05:07:53', NULL, 12, NULL),
(143, 37, 'out', 35600.0000, 1774400.0000, 'Pending send — FX-20260604-H33N', 1, '2026-06-04 05:24:52', '2026-06-04 05:24:52', NULL, 80, NULL),
(144, 36, 'out', 10000.0000, 1268099.0000, 'Exchange — FX-20260604-GGSP', 1, '2026-06-04 06:01:22', '2026-06-04 06:01:22', NULL, 81, NULL),
(145, 37, 'in', 18500.0000, 1792900.0000, 'Exchange — FX-20260604-GGSP', 1, '2026-06-04 06:01:22', '2026-06-04 06:01:22', NULL, 81, NULL),
(146, 36, 'out', 184000.0000, 1084099.0000, 'Exchange — FX-20260604-QUHF', 1, '2026-06-04 06:03:04', '2026-06-04 06:03:04', NULL, 82, NULL),
(147, 38, 'in', 50.0000, 1050.0000, 'Exchange — FX-20260604-QUHF', 1, '2026-06-04 06:03:04', '2026-06-04 06:03:04', NULL, 82, NULL),
(148, 36, 'out', 184000.0000, 900099.0000, 'Exchange — FX-20260604-SWHQ', 1, '2026-06-04 06:08:14', '2026-06-04 06:08:14', NULL, 83, NULL),
(149, 38, 'in', 50.0000, 1100.0000, 'Exchange — FX-20260604-SWHQ', 1, '2026-06-04 06:08:14', '2026-06-04 06:08:14', NULL, 83, NULL),
(150, 36, 'out', 184000.0000, 716099.0000, 'Exchange — FX-20260604-2L17', 1, '2026-06-04 06:11:25', '2026-06-04 06:11:25', NULL, 84, NULL),
(151, 38, 'in', 50.0000, 1150.0000, 'Exchange — FX-20260604-2L17', 1, '2026-06-04 06:11:25', '2026-06-04 06:11:25', NULL, 84, NULL),
(152, 36, 'out', 184000.0000, 532099.0000, 'Exchange — FX-20260604-X0RB', 1, '2026-06-04 06:13:36', '2026-06-04 06:13:36', NULL, 85, NULL),
(153, 38, 'in', 50.0000, 1200.0000, 'Exchange — FX-20260604-X0RB', 1, '2026-06-04 06:13:36', '2026-06-04 06:13:36', NULL, 85, NULL),
(154, 37, 'out', 17800.0000, 1775100.0000, 'Exchange — FX-20260604-XXQH', 1, '2026-06-04 06:14:25', '2026-06-04 06:14:25', NULL, 86, NULL),
(155, 36, 'in', 10000.0000, 542099.0000, 'Exchange — FX-20260604-XXQH', 1, '2026-06-04 06:14:25', '2026-06-04 06:14:25', NULL, 86, NULL),
(156, 39, 'out', 100000.0000, 442099.0000, 'Exchange — FX-20260605-CXWB', 1, '2026-06-05 11:46:55', '2026-06-05 11:46:55', NULL, 88, NULL),
(157, 41, 'in', 185000.0000, 1960100.0000, 'Exchange — FX-20260605-CXWB', 1, '2026-06-05 11:46:55', '2026-06-05 11:46:55', NULL, 88, NULL),
(158, 39, 'out', 112000.0000, 330099.0000, 'Exchange — FX-20260605-RJMC', 1, '2026-06-05 11:48:33', '2026-06-05 11:48:33', NULL, 89, NULL),
(159, 41, 'in', 200000.0000, 2160100.0000, 'Exchange — FX-20260605-RJMC', 1, '2026-06-05 11:48:33', '2026-06-05 11:48:33', NULL, 89, NULL),
(160, 42, 'in', 500000.0000, 1500000.0000, 'Deposit — Karen', 1, '2026-06-08 07:27:08', '2026-06-08 07:27:08', NULL, NULL, NULL),
(161, 43, 'in', 200.0000, 700.0000, 'Deposit — Karen', 1, '2026-06-08 07:27:26', '2026-06-08 07:27:26', NULL, NULL, NULL),
(162, 45, 'out', 45000.0000, 1455000.0000, 'Credit send — FX-20260609-IHBP', 1, '2026-06-09 04:04:37', '2026-06-09 04:04:37', NULL, 90, NULL),
(163, 45, 'out', 83000.0000, 1372000.0000, 'Credit send — FX-20260609-FROF', 1, '2026-06-09 04:18:39', '2026-06-09 04:18:39', NULL, 91, NULL),
(164, 46, 'in', 100000.0000, 3100000.0000, 'Partial payment — FX-20260609-FROF', 1, '2026-06-09 04:26:29', '2026-06-09 04:26:29', NULL, 91, NULL),
(165, 48, 'out', 100000.0000, 400000.0000, 'Pending send — FX-20260616-4OV9', 1, '2026-06-16 04:37:06', '2026-06-16 04:37:06', NULL, 93, NULL),
(166, 48, 'in', 100000.0000, 500000.0000, 'Cancellation — FX-20260616-4OV9 — wrong information', 1, '2026-06-16 06:10:29', '2026-06-16 06:10:29', NULL, 93, NULL),
(167, 48, 'out', 100000.0000, 400000.0000, 'Agent buy (pending) — FX-20260616-VD11', 1, '2026-06-16 07:19:15', '2026-06-16 07:19:15', NULL, 94, NULL),
(168, 48, 'in', 100000.0000, 500000.0000, 'Cancellation — FX-20260616-VD11 — cancelled', 1, '2026-06-16 07:23:46', '2026-06-16 07:23:46', NULL, 94, NULL),
(169, 48, 'in', 83000.0000, 583000.0000, 'Reversal — FX-20260609-FROF', 1, '2026-06-16 09:12:38', '2026-06-16 09:12:38', NULL, 95, NULL),
(170, 49, 'out', 100000.0000, 900000.0000, 'Reversal — FX-20260609-FROF', 1, '2026-06-16 09:12:38', '2026-06-16 09:12:38', NULL, 95, NULL),
(171, 50, 'out', 100.0000, 900.0000, 'Agent buy (pending) — FX-20260616-MMNE', 1, '2026-06-16 09:56:55', '2026-06-16 09:56:55', NULL, 96, NULL),
(172, 48, 'in', 374000.0000, 957000.0000, 'Agent sell settlement — FX-20260616-MMNE', 1, '2026-06-16 10:32:33', '2026-06-16 10:32:33', NULL, 96, NULL),
(173, 48, 'out', 374000.0000, 583000.0000, 'Agent buy (pending) — FX-20260616-UKHP', 1, '2026-06-16 10:42:45', '2026-06-16 10:42:45', NULL, 97, NULL),
(174, 50, 'in', 100.0000, 1000.0000, 'Agent buy settlement — FX-20260616-UKHP', 1, '2026-06-16 10:50:54', '2026-06-16 10:50:54', NULL, 97, NULL),
(175, 50, 'out', 50.0000, 950.0000, 'Agent sell (pending) — FX-20260616-8KXS', 1, '2026-06-16 11:12:34', '2026-06-16 11:12:34', NULL, 98, NULL),
(176, 48, 'in', 187000.0000, 770000.0000, 'Agent buy settlement — FX-20260616-8KXS', 1, '2026-06-16 11:13:06', '2026-06-16 11:13:06', NULL, 98, NULL),
(177, 48, 'out', 182500.0000, 587500.0000, 'Credit send — FX-20260616-69SX', 1, '2026-06-16 12:46:22', '2026-06-16 12:46:22', NULL, 99, NULL),
(178, 49, 'in', 2000.0000, 902000.0000, 'Partial payment — FX-20260513-UP3P', 1, '2026-06-16 12:47:13', '2026-06-16 12:47:13', NULL, 12, NULL),
(179, 48, 'in', 200000.0000, 787500.0000, 'Deposit — Ms Teayy', 1, '2026-06-16 13:18:44', '2026-06-16 13:18:44', NULL, 100, NULL),
(180, 48, 'out', 300000.0000, 487500.0000, 'Withdrawal — John Okeloo', 1, '2026-06-16 13:23:46', '2026-06-16 13:23:46', NULL, 101, NULL),
(181, 51, 'out', 8000.0000, 2992000.0000, 'Credit send — FX-20260619-4XXP', 1, '2026-06-19 04:21:02', '2026-06-19 04:21:02', NULL, 102, NULL),
(182, 51, 'in', 20000.0000, 3012000.0000, 'Settlement — FX-20260604-H33N', 1, '2026-06-19 04:22:52', '2026-06-19 04:22:52', NULL, 80, NULL),
(183, 51, 'out', 184500.0000, 2827500.0000, 'Pending send — FX-20260619-2U8N', 1, '2026-06-19 04:24:39', '2026-06-19 04:24:39', NULL, 103, NULL),
(184, 52, 'in', 50.0000, 1050.0000, 'Settlement — FX-20260619-2U8N', 1, '2026-06-19 04:25:03', '2026-06-19 04:25:03', NULL, 103, NULL),
(185, 53, 'in', 5000.0000, 3005000.0000, 'Partial payment — FX-20260619-4XXP', 1, '2026-06-19 04:27:24', '2026-06-19 04:27:24', NULL, 102, NULL),
(186, 53, 'in', 13500.0000, 3018500.0000, 'Full payment — FX-20260619-4XXP', 1, '2026-06-19 04:28:00', '2026-06-19 04:28:00', NULL, 102, NULL),
(187, 51, 'out', 16000.0000, 2811500.0000, 'Pending send — FX-20260619-BVKZ', 1, '2026-06-19 04:44:53', '2026-06-19 04:44:53', NULL, 106, NULL),
(188, 53, 'in', 30000.0000, 3048500.0000, 'Settlement — FX-20260619-BVKZ', 1, '2026-06-19 04:46:34', '2026-06-19 04:46:34', NULL, 106, NULL),
(189, 51, 'out', 27000.0000, 2784500.0000, 'Pending send — FX-20260619-X1EJ', 1, '2026-06-19 04:53:04', '2026-06-19 04:53:04', NULL, 107, NULL),
(190, 53, 'in', 50000.0000, 3098500.0000, 'Settlement — FX-20260619-X1EJ', 1, '2026-06-19 04:53:25', '2026-06-19 04:53:25', NULL, 107, NULL),
(191, 51, 'out', 258300.0000, 2526200.0000, 'Pending send — FX-20260619-VBKN', 1, '2026-06-19 04:56:07', '2026-06-19 04:56:07', NULL, 108, NULL),
(192, 52, 'in', 70.0000, 1120.0000, 'Settlement — FX-20260619-VBKN', 1, '2026-06-19 04:56:17', '2026-06-19 04:56:17', NULL, 108, NULL),
(193, 51, 'out', 200000.0000, 2326200.0000, 'Expense — EXP-20260619-EDQR — Office rent for june', 1, '2026-06-19 06:05:46', '2026-06-19 06:05:46', NULL, NULL, 1),
(194, 51, 'in', 200000.0000, 2526200.0000, 'Reversal — EXP-20260619-EDQR — recorded error', 1, '2026-06-19 06:09:02', '2026-06-19 06:09:02', NULL, NULL, 1),
(195, 54, 'in', 50000.0000, 2576200.0000, 'Deposit — Karen', 1, '2026-06-20 05:02:20', '2026-06-20 05:02:20', NULL, 110, NULL),
(196, 54, 'out', 10000.0000, 2566200.0000, 'Withdrawal — Karen', 1, '2026-06-20 05:02:33', '2026-06-20 05:02:33', NULL, 111, NULL),
(197, 58, 'in', 50.0000, 1050.0000, 'Full payment — FX-20260616-69SX', 1, '2026-06-23 05:16:53', '2026-06-23 05:16:53', NULL, 99, NULL),
(198, 59, 'in', 3000.0000, 1003000.0000, 'Full payment — FX-20260513-UP3P', 1, '2026-06-23 09:40:16', '2026-06-23 09:40:16', NULL, 12, NULL),
(199, 57, 'out', 547500.0000, 452500.0000, 'Credit send — FX-20260623-TKN3', 1, '2026-06-23 09:42:03', '2026-06-23 09:42:03', NULL, 112, NULL),
(200, 58, 'in', 150.0000, 1200.0000, 'Full payment — FX-20260623-TKN3', 1, '2026-06-23 09:42:43', '2026-06-23 09:42:43', NULL, 112, NULL),
(201, 58, 'out', 170.0000, 1030.0000, 'Credit send — FX-20260623-WWAV', 1, '2026-06-23 10:14:48', '2026-06-23 10:14:48', NULL, 113, NULL),
(202, 57, 'in', 1000000.0000, 1452500.0000, 'Full payment — FX-20260623-WWAV', 1, '2026-06-23 10:19:26', '2026-06-23 10:19:26', NULL, 113, NULL),
(203, 57, 'out', 182500.0000, 1270000.0000, 'Credit send — FX-20260623-FFQD', 1, '2026-06-23 10:25:48', '2026-06-23 10:25:48', NULL, 114, NULL),
(204, 58, 'in', 100.0000, 1130.0000, 'Full payment — FX-20260623-FFQD', 1, '2026-06-23 10:26:27', '2026-06-23 10:26:27', NULL, 114, NULL),
(205, 58, 'out', 100.0000, 1030.0000, 'Credit send — FX-20260623-Y1KO', 1, '2026-06-23 10:29:45', '2026-06-23 10:29:45', NULL, 115, NULL),
(206, 57, 'in', 150000.0000, 1420000.0000, 'Partial payment — FX-20260623-Y1KO', 1, '2026-06-23 10:30:48', '2026-06-23 10:30:48', NULL, 115, NULL),
(207, 57, 'in', 500000.0000, 1920000.0000, 'Full payment — FX-20260623-Y1KO', 1, '2026-06-23 10:31:34', '2026-06-23 10:31:34', NULL, 115, NULL),
(208, 57, 'out', 255500.0000, 1664500.0000, 'Credit send — FX-20260623-L64R', 1, '2026-06-23 10:36:20', '2026-06-23 10:36:20', NULL, 116, NULL),
(209, 58, 'in', 150.0000, 1180.0000, 'Full payment — FX-20260623-L64R', 1, '2026-06-23 10:36:48', '2026-06-23 10:36:48', NULL, 116, NULL),
(210, 57, 'out', 182500.0000, 1482000.0000, 'Credit send — FX-20260623-BJEB', 1, '2026-06-23 10:47:45', '2026-06-23 10:47:45', NULL, 117, NULL),
(211, 58, 'in', 100.0000, 1280.0000, 'Full payment — FX-20260623-BJEB', 1, '2026-06-23 10:48:06', '2026-06-23 10:48:06', NULL, 117, NULL),
(212, 57, 'out', 365000.0000, 1117000.0000, 'Credit send — FX-20260623-LMDO', 1, '2026-06-23 10:52:46', '2026-06-23 10:52:46', NULL, 118, NULL),
(213, 58, 'in', 200.0000, 1480.0000, 'Full payment — FX-20260623-LMDO', 1, '2026-06-23 10:53:02', '2026-06-23 10:53:02', NULL, 118, NULL),
(214, 58, 'out', 69.0000, 1411.0000, 'Credit send — FX-20260623-XZNI', 1, '2026-06-23 11:00:45', '2026-06-23 11:00:45', NULL, 120, NULL),
(215, 57, 'in', 500000.0000, 1617000.0000, 'Full payment — FX-20260623-XZNI', 1, '2026-06-23 11:03:10', '2026-06-23 11:03:10', NULL, 120, NULL),
(216, 58, 'out', 92.0000, 1319.0000, 'Credit send — FX-20260623-QI7L', 1, '2026-06-23 11:09:11', '2026-06-23 11:09:11', NULL, 122, NULL),
(217, 57, 'in', 1000000.0000, 2617000.0000, 'Full payment — FX-20260623-QI7L', 1, '2026-06-23 11:12:26', '2026-06-23 11:12:26', NULL, 122, NULL),
(218, 60, 'out', 182500.0000, 817500.0000, 'Exchange — FX-20260625-C8AM', 1, '2026-06-25 11:02:29', '2026-06-25 11:02:29', NULL, 128, NULL),
(219, 61, 'in', 50.0000, 550.0000, 'Exchange — FX-20260625-C8AM', 1, '2026-06-25 11:02:29', '2026-06-25 11:02:29', NULL, 128, NULL),
(220, 60, 'out', 27000.0000, 790500.0000, 'Exchange — FX-20260625-TJPW', 1, '2026-06-25 11:07:04', '2026-06-25 11:07:04', NULL, 129, NULL),
(221, 63, 'in', 50000.0000, 3050000.0000, 'Exchange — FX-20260625-TJPW', 1, '2026-06-25 11:07:04', '2026-06-25 11:07:04', NULL, 129, NULL),
(222, 64, 'out', 670000.0000, 1330000.0000, 'Exchange — FX-20260625-6QEG', 1, '2026-06-25 11:08:06', '2026-06-25 11:08:06', NULL, 130, NULL),
(223, 61, 'in', 100.0000, 650.0000, 'Exchange — FX-20260625-6QEG', 1, '2026-06-25 11:08:06', '2026-06-25 11:08:06', NULL, 130, NULL),
(224, 65, 'out', 365000.0000, 635000.0000, 'Pending send — FX-20260626-A9OE', 1, '2026-06-26 09:10:14', '2026-06-26 09:10:14', NULL, 131, NULL),
(225, 66, 'in', 50.0000, 700.0000, 'Partial payment — FX-20260626-A9OE', 1, '2026-06-26 09:25:28', '2026-06-26 09:25:28', NULL, 131, NULL),
(226, 66, 'in', 150.0000, 850.0000, 'Full payment — FX-20260626-A9OE', 1, '2026-06-26 09:33:19', '2026-06-26 09:33:19', NULL, 131, NULL),
(227, 65, 'out', 182500.0000, 452500.0000, 'Pending send — FX-20260626-JZ8H', 1, '2026-06-26 09:51:46', '2026-06-26 09:51:46', NULL, 133, NULL),
(228, 66, 'in', 100.0000, 950.0000, 'Full payment — FX-20260626-JZ8H', 1, '2026-06-26 09:52:44', '2026-06-26 09:52:44', NULL, 133, NULL),
(229, 68, 'out', 1825000.0000, 175000.0000, 'Pending send — FX-20260707-KOXW', 1, '2026-07-07 05:00:35', '2026-07-07 05:00:35', NULL, 135, NULL),
(230, 72, 'in', 200.0000, 3200.0000, 'Full payment — FX-20260707-KOXW', 1, '2026-07-09 13:03:03', '2026-07-09 13:03:03', NULL, 135, NULL),
(231, 72, 'out', 270.0000, 2930.0000, 'Pending send — FX-20260709-9XPF', 1, '2026-07-09 13:14:04', '2026-07-09 13:14:04', NULL, 136, NULL),
(232, 71, 'out', 1095000.0000, 905000.0000, 'Pending send — FX-20260709-UCV1', 1, '2026-07-09 13:18:09', '2026-07-09 13:18:09', NULL, 137, NULL),
(233, 72, 'in', 200.0000, 3130.0000, 'Full payment — FX-20260709-UCV1', 1, '2026-07-09 13:19:49', '2026-07-09 13:19:49', NULL, 137, NULL),
(234, 74, 'out', 182500.0000, 1817500.0000, 'Exchange — FX-20260713-AWC6', 1, '2026-07-13 09:54:25', '2026-07-13 09:54:25', NULL, 139, NULL),
(235, 75, 'in', 50.0000, 1050.0000, 'Exchange — FX-20260713-AWC6', 1, '2026-07-13 09:54:25', '2026-07-13 09:54:25', NULL, 139, NULL),
(236, 75, 'in', 50.0000, 1100.0000, 'Exchange — FX-20260713-AWC6', 1, '2026-07-13 09:54:25', '2026-07-13 09:54:25', NULL, 139, NULL),
(237, 74, 'out', 182500.0000, 1635000.0000, 'Exchange — FX-20260713-GKSY', 1, '2026-07-13 10:05:11', '2026-07-13 10:05:11', NULL, 140, NULL),
(238, 75, 'in', 50.0000, 1150.0000, 'Exchange — FX-20260713-GKSY', 1, '2026-07-13 10:05:11', '2026-07-13 10:05:11', NULL, 140, NULL),
(239, 74, 'out', 182500.0000, 1452500.0000, 'Pending send — FX-20260713-TDPC', 1, '2026-07-13 10:18:07', '2026-07-13 10:18:07', NULL, 141, NULL),
(240, 74, 'out', 216000.0000, 1236500.0000, 'Exchange — FX-20260713-G9GW', 1, '2026-07-13 10:48:29', '2026-07-13 10:48:29', NULL, 142, NULL),
(241, 76, 'in', 400000.0000, 2400000.0000, 'Exchange — FX-20260713-G9GW', 1, '2026-07-13 10:48:29', '2026-07-13 10:48:29', NULL, 142, NULL),
(242, 76, 'in', 400000.0000, 2800000.0000, 'Exchange — FX-20260713-G9GW', 1, '2026-07-13 10:48:29', '2026-07-13 10:48:29', NULL, 142, NULL),
(243, 77, 'in', 100000.0000, 1336500.0000, 'Deposit — Kaleb', 1, '2026-07-14 05:44:46', '2026-07-14 05:44:46', NULL, 143, NULL),
(244, 78, 'in', 100.0000, 1250.0000, 'Deposit — Karen', 1, '2026-07-14 05:45:12', '2026-07-14 05:45:12', NULL, 144, NULL),
(245, 78, 'in', 100.0000, 1350.0000, 'Deposit — Kaleb', 1, '2026-07-14 05:46:15', '2026-07-14 05:46:15', NULL, 145, NULL),
(246, 78, 'in', 50.0000, 1400.0000, 'Deposit — Karen', 1, '2026-07-14 05:52:16', '2026-07-14 05:52:16', NULL, 146, NULL),
(247, 78, 'in', 100.0000, 1500.0000, 'Deposit — Ms Teayy', 1, '2026-07-14 06:09:57', '2026-07-14 06:09:57', NULL, 147, NULL),
(248, 77, 'out', 365000.0000, 971500.0000, 'Exchange — FX-20260714-TI03', 1, '2026-07-14 06:17:57', '2026-07-14 06:17:57', NULL, 148, NULL),
(249, 78, 'in', 100.0000, 1600.0000, 'Exchange — FX-20260714-TI03', 1, '2026-07-14 06:17:57', '2026-07-14 06:17:57', NULL, 148, NULL),
(250, 78, 'in', 100.0000, 1700.0000, 'Exchange — FX-20260714-TI03', 1, '2026-07-14 06:17:57', '2026-07-14 06:17:57', NULL, 148, NULL),
(251, 77, 'out', 182500.0000, 789000.0000, 'Exchange — FX-20260714-YDGB', 1, '2026-07-14 07:21:15', '2026-07-14 07:21:15', NULL, 149, NULL),
(252, 78, 'in', 50.0000, 1750.0000, 'Exchange — FX-20260714-YDGB', 1, '2026-07-14 07:21:15', '2026-07-14 07:21:15', NULL, 149, NULL),
(253, 78, 'in', 50.0000, 1800.0000, 'Exchange — FX-20260714-YDGB', 1, '2026-07-14 07:21:15', '2026-07-14 07:21:15', NULL, 149, NULL),
(254, 77, 'out', 182500.0000, 606500.0000, 'Exchange — FX-20260714-PW00', 1, '2026-07-14 07:36:58', '2026-07-14 07:36:58', NULL, 150, NULL),
(255, 78, 'in', 50.0000, 1850.0000, 'Exchange — FX-20260714-PW00', 1, '2026-07-14 07:36:58', '2026-07-14 07:36:58', NULL, 150, NULL),
(256, 77, 'out', 547500.0000, 59000.0000, 'Pending send — FX-20260714-TJVG', 1, '2026-07-14 07:37:59', '2026-07-14 07:37:59', NULL, 151, NULL),
(257, 78, 'in', 50.0000, 1900.0000, 'Full payment — FX-20260714-TJVG', 1, '2026-07-14 07:38:38', '2026-07-14 07:38:38', NULL, 151, NULL),
(258, 82, 'out', 534000.0000, 4466000.0000, 'Exchange — FX-20261015-FYWT', 1, '2026-10-15 05:42:11', '2026-10-15 05:42:11', NULL, 152, NULL),
(259, 80, 'in', 300000.0000, 3300000.0000, 'Exchange — FX-20261015-FYWT', 1, '2026-10-15 05:42:11', '2026-10-15 05:42:11', NULL, 152, NULL),
(260, 80, 'out', 291892.0000, 3008108.0000, 'Exchange — FX-20261015-OKQR', 1, '2026-10-15 05:49:21', '2026-10-15 05:49:21', NULL, 153, NULL),
(261, 82, 'in', 540000.0000, 5006000.0000, 'Exchange — FX-20261015-OKQR', 1, '2026-10-15 05:49:21', '2026-10-15 05:49:21', NULL, 153, NULL),
(262, 80, 'in', 500000.0000, 3508108.0000, 'Deposit — Kaleb', 1, '2026-10-15 05:54:20', '2026-10-15 05:54:20', NULL, 154, NULL),
(263, 80, 'out', 27027.0000, 3481081.0000, 'Exchange — FX-20261015-B3VQ', 1, '2026-10-15 05:55:50', '2026-10-15 05:55:50', NULL, 155, NULL),
(264, 82, 'in', 50000.0000, 5056000.0000, 'Exchange — FX-20261015-B3VQ', 1, '2026-10-15 05:55:50', '2026-10-15 05:55:50', NULL, 155, NULL),
(265, 82, 'out', 53400.0000, 5002600.0000, 'Exchange — FX-20261015-6PMS', 1, '2026-10-15 05:57:49', '2026-10-15 05:57:49', NULL, 156, NULL),
(266, 80, 'in', 30000.0000, 3511081.0000, 'Exchange — FX-20261015-6PMS', 1, '2026-10-15 05:57:49', '2026-10-15 05:57:49', NULL, 156, NULL),
(267, 80, 'out', 27027.0000, 3484054.0000, 'Exchange — FX-20261015-RDGQ', 1, '2026-10-15 06:05:44', '2026-10-15 06:05:44', NULL, 157, NULL),
(268, 82, 'in', 50000.0000, 5052600.0000, 'Exchange — FX-20261015-RDGQ', 1, '2026-10-15 06:05:44', '2026-10-15 06:05:44', NULL, 157, NULL),
(269, 80, 'out', 27027.0000, 3457027.0000, 'Exchange — FX-20261015-7LII', 1, '2026-10-15 06:35:30', '2026-10-15 06:35:30', NULL, 158, NULL),
(270, 82, 'in', 50000.0000, 5102600.0000, 'Exchange — FX-20261015-7LII', 1, '2026-10-15 06:35:30', '2026-10-15 06:35:30', NULL, 158, NULL),
(271, 80, 'out', 182500.0000, 3274527.0000, 'Credit send — FX-20261015-Y63C', 1, '2026-10-15 06:43:32', '2026-10-15 06:43:32', NULL, 159, NULL),
(272, 80, 'out', 365000.0000, 2909527.0000, 'Credit send — FX-20261015-ET25', 1, '2026-10-15 06:54:24', '2026-10-15 06:54:24', NULL, 160, NULL),
(273, 80, 'out', 45045.0000, 2864482.0000, 'Credit send — FX-20261015-PRG1', 1, '2026-10-15 07:21:32', '2026-10-15 07:21:32', NULL, 161, NULL),
(274, 84, 'in', 40.0000, 540.0000, 'Partial payment — FX-20260713-TDPC', 1, '2026-10-19 07:55:54', '2026-10-19 07:55:54', NULL, 141, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `till_sessions`
--

CREATE TABLE `till_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `currency_id` bigint(20) UNSIGNED NOT NULL,
  `session_number` tinyint(3) UNSIGNED NOT NULL DEFAULT 1,
  `session_date` date NOT NULL,
  `opening_balance` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `opening_balance_locked` tinyint(1) NOT NULL DEFAULT 0,
  `closing_balance` decimal(20,4) DEFAULT NULL,
  `opened_by` bigint(20) UNSIGNED NOT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `till_sessions`
--

INSERT INTO `till_sessions` (`id`, `currency_id`, `session_number`, `session_date`, `opening_balance`, `opening_balance_locked`, `closing_balance`, `opened_by`, `closed_at`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, '2026-05-12', 5000000.0000, 0, NULL, 1, NULL, '2026-05-12 09:09:34', '2026-05-12 09:09:34', NULL),
(2, 3, 1, '2026-05-12', 2000.0000, 0, 2000.0000, 1, '2026-05-12 09:30:54', '2026-05-12 09:09:51', '2026-05-12 09:30:54', NULL),
(3, 4, 1, '2026-05-12', 10000000.0000, 0, NULL, 1, NULL, '2026-05-12 09:10:09', '2026-05-12 09:10:09', NULL),
(4, 4, 1, '2026-05-13', 2000000.0000, 0, NULL, 1, NULL, '2026-05-13 04:48:43', '2026-05-13 04:48:43', NULL),
(5, 1, 1, '2026-05-13', 2000000.0000, 0, NULL, 1, NULL, '2026-05-13 04:48:56', '2026-05-13 04:48:56', NULL),
(6, 3, 1, '2026-05-13', 0.0000, 0, 115.0000, 1, '2026-05-13 14:15:04', '2026-05-13 07:44:07', '2026-05-13 14:15:04', NULL),
(7, 1, 1, '2026-05-18', 3000000.0000, 0, NULL, 1, NULL, '2026-05-18 07:30:06', '2026-05-18 07:30:06', NULL),
(8, 3, 1, '2026-05-18', 500.0000, 0, 600.0000, 1, '2026-05-18 07:39:50', '2026-05-18 07:30:21', '2026-05-18 07:39:50', NULL),
(9, 4, 1, '2026-05-18', 2000000.0000, 0, NULL, 1, NULL, '2026-05-18 07:30:39', '2026-05-18 07:30:39', NULL),
(10, 1, 1, '2026-05-19', 5000000.0000, 0, NULL, 1, NULL, '2026-05-19 03:59:32', '2026-05-19 03:59:32', NULL),
(11, 4, 1, '2026-05-19', 10000000.0000, 0, NULL, 1, NULL, '2026-05-19 03:59:44', '2026-05-19 03:59:44', NULL),
(12, 3, 1, '2026-05-19', 1000.0000, 0, NULL, 1, NULL, '2026-05-19 04:00:33', '2026-05-19 04:00:33', NULL),
(13, 1, 1, '2026-05-20', 0.0000, 0, NULL, 1, NULL, '2026-05-20 04:38:59', '2026-05-20 04:38:59', NULL),
(14, 3, 1, '2026-05-20', 1000.0000, 0, NULL, 1, NULL, '2026-05-20 04:39:21', '2026-05-20 04:39:21', NULL),
(15, 1, 1, '2026-05-21', 1000000.0000, 0, NULL, 1, NULL, '2026-05-21 03:29:30', '2026-05-21 03:29:30', NULL),
(16, 3, 1, '2026-05-21', 500.0000, 0, NULL, 1, NULL, '2026-05-21 03:29:38', '2026-05-21 03:29:38', NULL),
(17, 4, 1, '2026-05-21', 1000000.0000, 0, NULL, 1, NULL, '2026-05-21 03:29:47', '2026-05-21 03:29:47', NULL),
(18, 1, 1, '2026-05-22', 901610.0000, 0, NULL, 1, NULL, '2026-05-22 05:00:55', '2026-05-22 05:00:55', NULL),
(19, 3, 1, '2026-05-22', 500.9600, 0, NULL, 1, NULL, '2026-05-22 05:01:03', '2026-05-22 05:01:03', NULL),
(20, 4, 1, '2026-05-22', 758500.0000, 0, NULL, 1, NULL, '2026-05-22 05:01:10', '2026-05-22 05:01:10', NULL),
(21, 1, 1, '2026-05-23', 2000000.0000, 0, NULL, 1, NULL, '2026-05-23 10:02:44', '2026-05-23 10:02:44', NULL),
(22, 3, 1, '2026-05-23', 1000.0000, 0, NULL, 1, NULL, '2026-05-23 10:02:54', '2026-05-23 10:02:54', NULL),
(23, 4, 1, '2026-05-23', 3000000.0000, 0, NULL, 1, NULL, '2026-05-23 10:03:09', '2026-05-23 10:03:09', NULL),
(24, 1, 1, '2026-05-24', 2000000.0000, 0, NULL, 1, NULL, '2026-05-26 03:16:25', '2026-05-24 03:16:25', NULL),
(25, 3, 1, '2026-05-25', 1000.0000, 0, NULL, 1, NULL, '2026-05-26 03:16:34', '2026-05-25 03:16:34', NULL),
(26, 4, 1, '2026-05-26', 2000000.0000, 0, NULL, 1, NULL, '2026-05-26 03:16:48', '2026-05-26 03:16:48', NULL),
(27, 1, 1, '2026-05-28', 30000000.0000, 0, NULL, 1, NULL, '2026-05-28 05:06:28', '2026-05-28 05:06:28', NULL),
(28, 3, 1, '2026-05-28', 2000.0000, 0, NULL, 1, NULL, '2026-05-28 05:06:38', '2026-05-28 05:06:38', NULL),
(29, 4, 1, '2026-05-28', 5000000.0000, 0, NULL, 1, NULL, '2026-05-28 05:06:47', '2026-05-28 05:06:47', NULL),
(30, 1, 1, '2026-06-01', 3000000.0000, 0, NULL, 1, NULL, '2026-06-01 09:31:41', '2026-06-01 09:31:41', NULL),
(31, 3, 1, '2026-06-01', 1000.0000, 0, NULL, 1, NULL, '2026-06-01 09:31:58', '2026-06-01 09:31:58', NULL),
(32, 4, 1, '2026-06-01', 3000000.0000, 0, NULL, 1, NULL, '2026-06-01 09:32:14', '2026-06-01 09:32:14', NULL),
(33, 1, 1, '2026-06-03', 1000000.0000, 0, NULL, 1, NULL, '2026-06-03 13:20:56', '2026-06-03 13:20:56', NULL),
(34, 3, 1, '2026-06-03', 2000.0000, 0, NULL, 1, NULL, '2026-06-03 13:21:04', '2026-06-03 13:21:04', NULL),
(35, 4, 1, '2026-06-03', 2000000.0000, 0, NULL, 1, NULL, '2026-06-03 13:21:15', '2026-06-03 13:21:15', NULL),
(36, 1, 1, '2026-06-04', 1278099.0000, 0, NULL, 1, NULL, '2026-06-04 05:06:18', '2026-06-04 05:06:18', NULL),
(37, 4, 1, '2026-06-04', 1800000.0000, 0, NULL, 1, NULL, '2026-06-04 05:06:22', '2026-06-04 05:06:22', NULL),
(38, 3, 1, '2026-06-04', 1000.0000, 0, NULL, 1, NULL, '2026-06-04 05:06:35', '2026-06-04 05:06:35', NULL),
(39, 1, 1, '2026-06-05', 542099.0000, 0, NULL, 1, NULL, '2026-06-05 11:46:03', '2026-06-05 11:46:03', NULL),
(40, 3, 1, '2026-06-05', 1200.0000, 0, NULL, 1, NULL, '2026-06-05 11:46:08', '2026-06-05 11:46:08', NULL),
(41, 4, 1, '2026-06-05', 1775100.0000, 0, NULL, 1, NULL, '2026-06-05 11:46:25', '2026-06-05 11:46:25', NULL),
(42, 1, 1, '2026-06-08', 1000000.0000, 0, NULL, 1, NULL, '2026-06-08 07:26:24', '2026-06-08 07:26:24', NULL),
(43, 3, 1, '2026-06-08', 500.0000, 0, NULL, 1, NULL, '2026-06-08 07:26:31', '2026-06-08 07:26:31', NULL),
(44, 4, 1, '2026-06-08', 3000000.0000, 0, NULL, 1, NULL, '2026-06-08 07:26:37', '2026-06-08 07:26:37', NULL),
(45, 1, 1, '2026-06-09', 1500000.0000, 0, NULL, 1, NULL, '2026-06-09 04:02:54', '2026-06-09 04:02:54', NULL),
(46, 4, 1, '2026-06-09', 3000000.0000, 0, NULL, 1, NULL, '2026-06-09 04:02:59', '2026-06-09 04:02:59', NULL),
(47, 3, 1, '2026-06-09', 700.0000, 0, NULL, 1, NULL, '2026-06-09 04:03:03', '2026-06-09 04:03:03', NULL),
(48, 1, 1, '2026-06-16', 500000.0000, 0, NULL, 1, NULL, '2026-06-16 04:35:28', '2026-06-16 04:35:28', NULL),
(49, 4, 1, '2026-06-16', 1000000.0000, 0, NULL, 1, NULL, '2026-06-16 04:36:01', '2026-06-16 04:36:01', NULL),
(50, 3, 1, '2026-06-16', 1000.0000, 0, NULL, 1, NULL, '2026-06-16 04:36:30', '2026-06-16 04:36:30', NULL),
(51, 1, 1, '2026-06-19', 3000000.0000, 0, NULL, 1, NULL, '2026-06-19 04:17:01', '2026-06-19 04:17:01', NULL),
(52, 3, 1, '2026-06-19', 1000.0000, 0, NULL, 1, NULL, '2026-06-19 04:17:11', '2026-06-19 04:17:11', NULL),
(53, 4, 1, '2026-06-19', 3000000.0000, 0, NULL, 1, NULL, '2026-06-19 04:17:19', '2026-06-19 04:17:19', NULL),
(54, 1, 1, '2026-06-20', 2526200.0000, 0, NULL, 1, NULL, '2026-06-20 05:01:40', '2026-06-20 05:01:40', NULL),
(55, 3, 1, '2026-06-20', 1120.0000, 0, NULL, 1, NULL, '2026-06-20 05:01:44', '2026-06-20 05:01:44', NULL),
(56, 4, 1, '2026-06-20', 3098500.0000, 0, NULL, 1, NULL, '2026-06-20 05:01:48', '2026-06-20 05:01:48', NULL),
(57, 1, 1, '2026-06-23', 1000000.0000, 0, NULL, 1, NULL, '2026-06-23 05:16:26', '2026-06-23 05:16:26', NULL),
(58, 3, 1, '2026-06-23', 1000.0000, 0, NULL, 1, NULL, '2026-06-23 05:16:34', '2026-06-23 05:16:34', NULL),
(59, 4, 1, '2026-06-23', 1000000.0000, 0, NULL, 1, NULL, '2026-06-23 05:16:39', '2026-06-23 05:16:39', NULL),
(60, 1, 1, '2026-06-25', 1000000.0000, 1, 1000000.0000, 1, NULL, '2026-06-25 10:15:41', '2026-06-25 11:07:04', NULL),
(61, 3, 1, '2026-06-25', 500.0000, 1, NULL, 1, NULL, '2026-06-25 10:35:34', '2026-06-25 11:08:06', NULL),
(62, 1, 1, '2026-06-24', 500000.0000, 0, NULL, 1, NULL, '2026-06-25 10:42:00', '2026-06-25 10:42:00', NULL),
(63, 4, 1, '2026-06-25', 3000000.0000, 1, 3050000.0000, 1, '2026-06-25 11:07:23', '2026-06-25 11:05:29', '2026-06-25 11:07:23', NULL),
(64, 4, 2, '2026-06-25', 2000000.0000, 1, NULL, 1, NULL, '2026-06-25 11:07:36', '2026-06-25 11:08:06', NULL),
(65, 1, 1, '2026-06-26', 1000000.0000, 1, NULL, 1, NULL, '2026-06-26 08:56:27', '2026-06-26 09:10:14', NULL),
(66, 3, 1, '2026-06-26', 650.0000, 1, NULL, 1, NULL, '2026-06-26 08:56:36', '2026-06-26 09:25:28', NULL),
(67, 4, 1, '2026-06-26', 3050000.0000, 0, NULL, 1, NULL, '2026-06-26 08:56:43', '2026-06-26 08:56:43', NULL),
(68, 1, 1, '2026-07-07', 2000000.0000, 1, NULL, 1, NULL, '2026-07-07 03:56:43', '2026-07-07 05:00:35', NULL),
(69, 3, 1, '2026-07-07', 1000.0000, 0, NULL, 1, NULL, '2026-07-07 03:56:53', '2026-07-07 03:56:53', NULL),
(70, 4, 1, '2026-07-07', 3000000.0000, 0, NULL, 1, NULL, '2026-07-07 03:57:03', '2026-07-07 03:57:03', NULL),
(71, 1, 1, '2026-07-09', 2000000.0000, 1, NULL, 1, NULL, '2026-07-09 13:01:35', '2026-07-09 13:18:09', NULL),
(72, 3, 1, '2026-07-09', 3000.0000, 1, NULL, 1, NULL, '2026-07-09 13:01:58', '2026-07-09 13:03:03', NULL),
(73, 4, 1, '2026-07-09', 2000000.0000, 0, NULL, 1, NULL, '2026-07-09 13:02:11', '2026-07-09 13:02:11', NULL),
(74, 1, 1, '2026-07-13', 2000000.0000, 1, NULL, 1, NULL, '2026-07-13 09:52:15', '2026-07-13 09:54:24', NULL),
(75, 3, 1, '2026-07-13', 1000.0000, 1, NULL, 1, NULL, '2026-07-13 09:52:25', '2026-07-13 09:54:25', NULL),
(76, 4, 1, '2026-07-13', 2000000.0000, 1, NULL, 1, NULL, '2026-07-13 09:53:04', '2026-07-13 10:48:29', NULL),
(77, 1, 1, '2026-07-14', 1236500.0000, 1, NULL, 1, NULL, '2026-07-14 05:43:38', '2026-07-14 05:44:46', NULL),
(78, 3, 1, '2026-07-14', 1150.0000, 1, NULL, 1, NULL, '2026-07-14 05:43:43', '2026-07-14 05:45:12', NULL),
(79, 4, 1, '2026-07-14', 2800000.0000, 0, NULL, 1, NULL, '2026-07-14 05:43:48', '2026-07-14 05:43:48', NULL),
(80, 1, 1, '2026-10-15', 3000000.0000, 1, NULL, 1, NULL, '2026-10-15 05:23:54', '2026-10-15 05:42:11', NULL),
(81, 3, 1, '2026-10-15', 2000.0000, 0, NULL, 1, NULL, '2026-10-15 05:24:14', '2026-10-15 05:24:14', NULL),
(82, 4, 1, '2026-10-15', 5000000.0000, 1, NULL, 1, NULL, '2026-10-15 05:25:04', '2026-10-15 05:42:11', NULL),
(83, 1, 1, '2026-10-19', 1000000.0000, 0, NULL, 1, NULL, '2026-10-19 07:55:22', '2026-10-19 07:55:22', NULL),
(84, 3, 1, '2026-10-19', 500.0000, 1, NULL, 1, NULL, '2026-10-19 07:55:32', '2026-10-19 07:55:54', NULL),
(85, 4, 1, '2026-10-19', 3000000.0000, 0, NULL, 1, NULL, '2026-10-19 07:55:46', '2026-10-19 07:55:46', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ref_no` varchar(255) NOT NULL,
  `type` enum('exchange','agent','deposit','withdraw') NOT NULL,
  `client_id` bigint(20) UNSIGNED DEFAULT NULL,
  `agent_line_id` bigint(20) UNSIGNED DEFAULT NULL,
  `currency_pair_id` bigint(20) UNSIGNED DEFAULT NULL,
  `from_currency_id` bigint(20) UNSIGNED NOT NULL,
  `to_currency_id` bigint(20) UNSIGNED NOT NULL,
  `from_amount` decimal(20,4) NOT NULL,
  `to_amount` decimal(20,4) NOT NULL,
  `rate_snapshot` decimal(20,6) NOT NULL,
  `profit_amount` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `profit_currency_id` bigint(20) UNSIGNED DEFAULT NULL,
  `client_rate_id` bigint(20) UNSIGNED DEFAULT NULL,
  `payment_status` enum('cash','pending') NOT NULL DEFAULT 'cash',
  `is_credit` tinyint(1) NOT NULL DEFAULT 0,
  `use_wallet` tinyint(1) NOT NULL DEFAULT 0,
  `teller_id` bigint(20) UNSIGNED NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `is_reversed` tinyint(1) NOT NULL DEFAULT 0,
  `reversed_at` timestamp NULL DEFAULT NULL,
  `reversed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `reversal_reason` varchar(255) DEFAULT NULL,
  `reversal_of_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `ref_no`, `type`, `client_id`, `agent_line_id`, `currency_pair_id`, `from_currency_id`, `to_currency_id`, `from_amount`, `to_amount`, `rate_snapshot`, `profit_amount`, `profit_currency_id`, `client_rate_id`, `payment_status`, `is_credit`, `use_wallet`, `teller_id`, `notes`, `is_reversed`, `reversed_at`, `reversed_by`, `reversal_reason`, `reversal_of_id`, `created_at`, `updated_at`, `deleted_at`) VALUES
(2, 'FX-20260512-JRMA', 'exchange', NULL, NULL, 1, 4, 1, 50000.0000, 27000.0000, 0.540000, 0.0000, NULL, 4, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-12 11:22:44', '2026-05-12 11:22:44', NULL),
(3, 'FX-20260512-OMEL', 'exchange', NULL, NULL, 1, 4, 1, 27000.0000, 46440.0000, 1.720000, 0.0000, NULL, 5, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-12 11:24:33', '2026-05-12 11:24:33', NULL),
(5, 'FX-20260512-P3VE', 'exchange', NULL, NULL, 3, 1, 4, 20000.0000, 24800.0000, 1.240000, 0.0000, NULL, 1, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-12 12:31:26', '2026-05-12 12:32:07', NULL),
(7, 'FX-20260513-FIPG', 'exchange', 7, 1, 1, 4, 1, 50000.0000, 27000.0000, 0.540000, 0.0000, NULL, 4, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-13 04:49:51', '2026-05-13 04:49:51', NULL),
(9, 'FX-20260513-VUFD', 'exchange', NULL, 1, 1, 4, 1, 30000.0000, 13500.0000, 0.450000, 0.0000, NULL, 6, 'cash', 1, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-13 06:02:29', '2026-05-13 06:02:29', NULL),
(10, 'FX-20260513-BSMY', 'exchange', 1, 1, 1, 4, 1, 15000.0000, 6750.0000, 0.450000, 0.0000, NULL, 6, 'cash', 1, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-13 06:39:26', '2026-05-13 06:39:26', NULL),
(11, 'FX-20260513-OI1I', 'exchange', 2, 1, 1, 4, 1, 50000.0000, 27000.0000, 0.540000, 0.0000, NULL, 4, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-13 07:02:33', '2026-05-13 07:02:33', NULL),
(12, 'FX-20260513-UP3P', 'exchange', 1, 1, 1, 4, 1, 15000.0000, 6750.0000, 0.450000, 0.0000, NULL, 6, 'cash', 1, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-13 07:03:52', '2026-05-13 07:03:52', NULL),
(15, 'FX-20260513-VWUV', 'exchange', 5, 1, 3, 1, 4, 30000.0000, 37200.0000, 1.240000, 0.0000, NULL, 1, 'cash', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-13 07:06:17', '2026-05-13 07:06:17', NULL),
(17, 'FX-20260513-WGMR', 'agent', NULL, 1, 2, 3, 1, 100.0000, 375000.0000, 3750.000000, 0.0000, NULL, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-13 07:44:49', '2026-05-13 07:44:49', NULL),
(18, 'FX-20260513-V2Q7', 'agent', NULL, 1, 2, 3, 1, 20.0000, 75200.0000, 3760.000000, 0.0000, NULL, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-13 08:48:43', '2026-05-13 08:48:43', NULL),
(19, 'FX-20260513-9MZF', 'agent', NULL, 1, 2, 3, 1, 50.0000, 188000.0000, 3760.000000, 0.0000, NULL, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-13 08:51:10', '2026-05-13 08:51:10', NULL),
(20, 'FX-20260513-PRXV', 'agent', NULL, 1, 2, 3, 1, 15.0000, 56400.0000, 3760.000000, 0.0000, NULL, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-13 08:58:25', '2026-05-13 08:58:25', NULL),
(21, 'FX-20260513-YGAZ', 'agent', NULL, 1, 2, 3, 1, 50.0000, 188000.0000, 3760.000000, 0.0000, NULL, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-13 09:30:43', '2026-05-13 09:30:43', NULL),
(22, 'FX-20260513-VAWW', 'agent', NULL, 1, 2, 3, 1, 20.0000, 75200.0000, 3760.000000, 0.0000, NULL, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-13 09:38:45', '2026-05-13 09:38:45', NULL),
(23, 'FX-20260513-NJYD', 'exchange', 2, 1, 1, 4, 1, 175000.0000, 94500.0000, 0.540000, 0.0000, NULL, 4, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-13 09:44:06', '2026-05-13 09:44:06', NULL),
(24, 'FX-20260518-D661', 'exchange', 1, 1, 1, 4, 1, 50000.0000, 27000.0000, 0.540000, 0.0000, NULL, 4, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-18 07:50:22', '2026-05-18 07:50:22', NULL),
(25, 'FX-20260518-KDWR', 'exchange', 2, 1, 1, 4, 1, 50000.0000, 86000.0000, 1.720000, 0.0000, NULL, 5, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-18 07:54:27', '2026-05-18 07:55:00', NULL),
(26, 'FX-20260518-QANK', 'exchange', 2, 1, 1, 4, 1, 100000.0000, 45000.0000, 0.450000, 0.0000, NULL, 6, 'cash', 1, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-18 08:00:07', '2026-05-18 08:00:07', NULL),
(28, 'FX-20260518-FDXD', 'agent', NULL, 1, 1, 4, 1, 100000.0000, 300000.0000, 3.000000, 0.0000, NULL, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-18 08:14:41', '2026-05-18 08:14:41', NULL),
(29, 'FX-20260519-NB4T', 'exchange', NULL, 1, 7, 1, 3, 100.0000, 376800.0000, 3768.000000, 0.0000, NULL, 8, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-19 04:14:29', '2026-05-19 04:14:29', NULL),
(30, 'FX-20260520-XRF9', 'exchange', 1, 1, 7, 1, 3, 1000000.0000, 265.3900, 3768.000000, 0.0000, NULL, 8, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-20 04:41:38', '2026-05-20 04:41:38', NULL),
(31, 'FX-20260521-L1LN', 'exchange', NULL, 1, 1, 4, 1, 10000.0000, 18500.0000, 1.850000, 0.0000, NULL, 12, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-21 03:30:28', '2026-05-21 03:30:28', NULL),
(32, 'FX-20260521-XFIO', 'exchange', NULL, 1, 7, 1, 3, 368000.0000, 99.3600, 0.000270, 0.0000, NULL, 17, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-21 04:09:25', '2026-05-21 04:09:25', NULL),
(33, 'FX-20260521-LK1A', 'exchange', NULL, 1, 1, 4, 1, 18500.0000, 9990.0000, 0.540000, 0.0000, NULL, 12, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-21 04:13:12', '2026-05-21 04:13:12', NULL),
(34, 'FX-20260521-EKT7', 'exchange', NULL, NULL, 1, 4, 1, 100000.0000, 185000.0000, 1.850000, 0.0000, NULL, 10, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-21 04:15:41', '2026-05-21 04:15:41', NULL),
(35, 'FX-20260521-WS3X', 'exchange', NULL, NULL, 1, 1, 1, 100000.0000, 185000.0000, 1.850000, 0.0000, NULL, 10, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-21 04:24:59', '2026-05-21 04:24:59', NULL),
(36, 'FX-20260521-XRAI', 'exchange', NULL, NULL, 1, 1, 4, 100000.0000, 185000.0000, 1.850000, 0.0000, NULL, 10, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-21 04:51:22', '2026-05-21 04:51:22', NULL),
(37, 'FX-20260521-W1O7', 'exchange', NULL, 1, 7, 3, 1, 100.0000, 368000.0000, 3680.000000, 0.0000, NULL, 8, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-21 05:04:27', '2026-05-21 05:04:27', NULL),
(38, 'FX-20260521-G7YC', 'exchange', NULL, NULL, 1, 4, 1, 185000.0000, 99900.0000, 0.540000, 0.0000, NULL, 10, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-21 06:47:57', '2026-05-21 06:47:57', NULL),
(39, 'FX-20260521-LH1D', 'exchange', NULL, NULL, 1, 1, 4, 200000.0000, 370000.0000, 1.850000, 0.0000, NULL, 12, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-21 06:50:15', '2026-05-21 06:50:15', NULL),
(40, 'FX-20260521-S0SW', 'exchange', NULL, NULL, 7, 3, 1, 50.0000, 184000.0000, 3680.000000, 0.0000, NULL, 17, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-21 06:51:41', '2026-05-21 06:51:41', NULL),
(41, 'FX-20260521-2ALD', 'exchange', NULL, NULL, 7, 1, 3, 184000.0000, 49.6800, 0.000270, 0.0000, NULL, 8, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-21 06:52:32', '2026-05-21 06:52:32', NULL),
(42, 'FX-20260522-VUNV', 'exchange', NULL, NULL, 7, 1, 3, 378000.0000, 99.7920, 0.000264, 0.0000, NULL, 8, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-22 05:07:31', '2026-05-22 05:07:31', NULL),
(43, 'FX-20260522-KDWY', 'exchange', NULL, NULL, 7, 3, 1, 100.0000, 368000.0000, 3680.000000, 0.0000, NULL, 17, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-22 05:19:09', '2026-05-22 05:19:09', NULL),
(44, 'FX-20260522-LD7L', 'exchange', NULL, NULL, 7, 1, 3, 378000.0000, 100.0000, 0.000264, 0.0000, NULL, 8, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-22 05:47:49', '2026-05-22 05:47:49', NULL),
(45, 'FX-20260522-HKGQ', 'exchange', NULL, NULL, 1, 4, 1, 185000.0000, 100000.0000, 0.540540, 0.0000, NULL, 12, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-22 06:02:09', '2026-05-22 06:02:09', NULL),
(46, 'FX-20260522-CQQQ', 'exchange', NULL, NULL, 1, 1, 4, 100000.0000, 178000.0000, 1.780000, 0.0000, NULL, 10, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-22 06:05:38', '2026-05-22 06:05:38', NULL),
(47, 'FX-20260522-QVPD', 'exchange', 2, 1, 7, 3, 1, 150.0000, 552000.0000, 3680.000000, 0.0000, NULL, 17, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-22 06:08:42', '2026-05-22 06:08:42', NULL),
(48, 'FX-20260522-3MSD', 'exchange', 2, 1, 7, 1, 3, 450000.0000, 120.0000, 0.000264, 0.0000, NULL, 8, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-22 06:27:37', '2026-05-22 06:27:37', NULL),
(49, 'FX-20260522-KFDA', 'agent', NULL, 1, 7, 3, 1, 100.0000, 375000.0000, 3750.000000, 0.0000, NULL, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-22 12:19:55', '2026-05-22 12:19:55', NULL),
(50, 'FX-20260522-J9Q3', 'agent', NULL, 1, 7, 1, 3, 550000.0000, 150.0000, 0.000266, 0.0000, NULL, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-22 12:22:41', '2026-05-22 12:22:41', NULL),
(51, 'FX-20260522-7Z7X', 'agent', NULL, 1, 7, 3, 1, 550000.0000, 146.0000, 0.000266, 0.0000, NULL, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-22 12:54:09', '2026-05-22 12:54:09', NULL),
(52, 'FX-20260522-MSOZ', 'agent', NULL, 1, 7, 3, 1, 50.0000, 188000.0000, 3750.000000, 0.0000, NULL, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-22 13:04:23', '2026-05-22 13:04:23', NULL),
(53, 'FX-20260522-WUYK', 'exchange', NULL, NULL, 1, 1, 4, 200000.0000, 356000.0000, 1.780000, 0.0000, NULL, 10, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-22 13:05:08', '2026-05-22 13:05:08', NULL),
(54, 'FX-20260523-7THM', 'agent', NULL, 1, 7, 3, 1, 150.0000, 552000.0000, 3680.000000, 0.0000, NULL, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-23 10:10:59', '2026-05-23 10:10:59', NULL),
(55, 'FX-20260523-VZYV', 'agent', NULL, 1, 7, 1, 3, 1472000.0000, 390.0000, 0.000266, 0.0000, NULL, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-23 10:53:58', '2026-05-23 10:53:58', NULL),
(56, 'FX-20260523-IT9N', 'agent', NULL, 1, 7, 1, 3, 1472000.0000, 390.0000, 0.000266, 0.0000, NULL, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-23 11:38:56', '2026-05-23 11:38:56', NULL),
(57, 'FX-20260523-BRMU', 'exchange', NULL, NULL, 7, 1, 3, 1472000.0000, 390.0000, 0.000264, 0.0000, NULL, 8, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-23 12:21:16', '2026-05-23 12:21:16', NULL),
(58, 'FX-20260523-FDNH', 'exchange', NULL, NULL, 7, 1, 3, 1472000.0000, 390.0000, 0.000264, 0.0000, NULL, 8, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-23 12:21:42', '2026-05-23 12:21:42', NULL),
(59, 'FX-20260523-IFPA', 'agent', NULL, 1, 7, 1, 3, 550000.0000, 150.0000, 0.000266, 0.0000, NULL, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-23 12:58:10', '2026-05-23 12:58:10', NULL),
(60, 'FX-20260523-OGJ0', 'agent', NULL, 1, 7, 1, 3, 5000000.0000, 1300.0000, 0.000266, 0.0000, NULL, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-23 13:02:41', '2026-05-23 13:02:41', NULL),
(61, 'FX-20260523-AL9F', 'agent', NULL, 1, 7, 1, 3, 5000000.0000, 1300.0000, 0.000266, 0.0000, NULL, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-23 13:08:56', '2026-05-23 13:08:56', NULL),
(62, 'FX-20260523-PAEZ', 'agent', NULL, 1, 7, 3, 1, 1000.0000, 3680000.0000, 3680.000000, 0.0000, NULL, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-23 13:10:33', '2026-05-23 13:10:33', NULL),
(63, 'FX-20260523-USM0', 'agent', NULL, 1, 7, 1, 3, 550000.0000, 150.0000, 3740.000000, 0.0000, NULL, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-23 13:52:05', '2026-05-23 13:52:05', NULL),
(64, 'FX-20260523-KKBX', 'agent', NULL, 1, 7, 3, 1, 500.0000, 1870000.0000, 3740.000000, 0.0000, NULL, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-23 13:53:43', '2026-05-23 13:53:43', NULL),
(65, 'FX-20260526-Y4I1', 'exchange', 2, NULL, 1, 4, 1, 37000.0000, 20000.0000, 0.540540, 0.0000, NULL, 12, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-26 03:18:15', '2026-05-26 03:18:15', NULL),
(66, 'FX-20260526-WA7M', 'exchange', NULL, NULL, 7, 3, 1, 1000.0000, 3680000.0000, 3680.000000, 0.0000, NULL, 17, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-26 03:18:50', '2026-05-26 03:18:50', NULL),
(67, 'FX-20260528-VRI5', 'exchange', NULL, NULL, 1, 1, 4, 100000.0000, 178000.0000, 1.780000, 0.0000, 4, 10, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-28 05:07:43', '2026-05-28 05:07:43', NULL),
(68, 'FX-20260528-3HRL', 'exchange', NULL, 1, 1, 4, 1, 185000.0000, 100000.0000, 0.540540, 0.0000, 4, 12, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-05-28 05:10:28', '2026-05-28 05:10:28', NULL),
(69, 'FX-20260601-KXHW', 'exchange', NULL, 1, 1, 4, 1, 200000.0000, 108000.0000, 0.540540, 0.0000, 4, 12, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-01 09:40:22', '2026-06-01 09:40:22', NULL),
(70, 'FX-20260601-AZEX', 'exchange', NULL, 1, 1, 1, 4, 100000.0000, 178000.0000, 1.780000, 3783.8800, 1, 10, 'cash', 0, 0, 1, NULL, 1, '2026-06-03 13:28:26', 1, 'wrong rates applied', NULL, '2026-06-01 09:41:44', '2026-06-03 13:28:26', NULL),
(71, 'FX-20260601-ZU5Q', 'exchange', NULL, 1, 7, 1, 3, 368000.0000, 99.0000, 0.000270, 3680.0000, 1, 8, 'cash', 0, 0, 1, NULL, 1, '2026-06-03 13:22:52', 1, 'wrong rate applied', NULL, '2026-06-01 09:59:34', '2026-06-03 13:22:52', NULL),
(74, 'FX-20260603-3PUR', 'exchange', NULL, 1, 7, 3, 1, 99.0000, 368000.0000, 0.000270, 0.0000, 1, 8, 'cash', 0, 0, 1, 'Reversal of FX-20260601-ZU5Q — wrong rate applied', 0, NULL, NULL, NULL, 71, '2026-06-03 13:22:52', '2026-06-03 13:22:52', NULL),
(75, 'FX-20260603-DYA5', 'exchange', NULL, 1, 1, 4, 1, 178000.0000, 100000.0000, 1.780000, 0.0000, 1, 10, 'cash', 0, 0, 1, 'Reversal of FX-20260601-AZEX — wrong rates applied', 0, NULL, NULL, NULL, 70, '2026-06-03 13:28:25', '2026-06-03 13:28:25', NULL),
(76, 'FX-20260603-HOYZ', 'exchange', NULL, 1, 1, 1, 4, 200000.0000, 356000.0000, 1.780000, 7567.7600, 1, 10, 'cash', 0, 0, 1, NULL, 1, '2026-06-03 13:34:53', 1, 'wrong rates', NULL, '2026-06-03 13:34:15', '2026-06-03 13:34:53', NULL),
(77, 'FX-20260603-LJPU', 'exchange', NULL, 1, 1, 4, 1, 356000.0000, 200000.0000, 1.780000, 0.0000, 1, 10, 'cash', 0, 0, 1, 'Reversal of FX-20260603-HOYZ — wrong rates', 0, NULL, NULL, NULL, 76, '2026-06-03 13:34:53', '2026-06-03 13:34:53', NULL),
(78, 'FX-20260603-7CJ0', 'exchange', NULL, 1, 1, 4, 1, 185000.0000, 100000.0000, 0.540540, 0.0000, 4, 12, 'cash', 0, 0, 1, NULL, 1, '2026-06-03 13:42:36', 1, 'wrong rates', NULL, '2026-06-03 13:39:32', '2026-06-03 13:42:36', NULL),
(79, 'FX-20260603-UJ2I', 'exchange', NULL, 1, 1, 1, 4, 100000.0000, 185000.0000, 0.540540, 0.0000, 4, 12, 'cash', 0, 0, 1, 'Reversal of FX-20260603-7CJ0 — wrong rates', 0, NULL, NULL, NULL, 78, '2026-06-03 13:42:36', '2026-06-03 13:42:36', NULL),
(80, 'FX-20260604-H33N', 'exchange', NULL, 1, 1, 1, 4, 20000.0000, 35600.0000, 1.780000, 756.7760, 1, 10, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-04 05:24:52', '2026-06-19 04:22:52', NULL),
(81, 'FX-20260604-GGSP', 'exchange', NULL, 1, 1, 4, 1, 18500.0000, 10000.0000, 0.540540, 0.0000, 4, 12, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-04 06:01:22', '2026-06-04 06:01:22', NULL),
(82, 'FX-20260604-QUHF', 'exchange', NULL, 1, 7, 3, 1, 50.0000, 184000.0000, 3680.000000, 0.0000, 3, 17, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-04 06:03:04', '2026-06-04 06:03:04', NULL),
(83, 'FX-20260604-SWHQ', 'exchange', NULL, 1, 7, 3, 1, 50.0000, 184000.0000, 3680.000000, 0.0000, 3, 17, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-04 06:08:13', '2026-06-04 06:08:13', NULL),
(84, 'FX-20260604-2L17', 'exchange', NULL, NULL, 7, 3, 1, 50.0000, 184000.0000, 3680.000000, 0.0000, 3, 17, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-04 06:11:25', '2026-06-04 06:11:25', NULL),
(85, 'FX-20260604-X0RB', 'exchange', 12, NULL, 7, 3, 1, 50.0000, 184000.0000, 3680.000000, 0.0000, 3, 17, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-04 06:13:36', '2026-06-04 06:13:36', NULL),
(86, 'FX-20260604-XXQH', 'exchange', 13, 1, 1, 1, 4, 10000.0000, 17800.0000, 1.780000, 378.3880, 1, 10, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-04 06:14:25', '2026-06-04 06:14:25', NULL),
(88, 'FX-20260605-CXWB', 'exchange', 2, NULL, 1, 4, 1, 185000.0000, 100000.0000, 0.540540, 0.0000, 4, 12, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-05 11:46:55', '2026-06-05 11:46:55', NULL),
(89, 'FX-20260605-RJMC', 'exchange', NULL, NULL, 1, 4, 1, 200000.0000, 112000.0000, 0.560560, 0.0000, 4, 12, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-05 11:48:33', '2026-06-05 11:48:33', NULL),
(90, 'FX-20260609-IHBP', 'exchange', 2, 1, 1, 4, 1, 100000.0000, 45000.0000, 0.450450, 0.0000, 4, 11, 'cash', 1, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-09 04:04:36', '2026-06-09 04:04:36', NULL),
(91, 'FX-20260609-FROF', 'exchange', 1, 1, 1, 4, 1, 185000.0000, 83000.0000, 0.450450, 0.0000, NULL, 11, 'cash', 1, 0, 1, NULL, 1, '2026-06-16 09:12:38', 1, 'wrong number', NULL, '2026-06-09 04:18:39', '2026-06-16 09:12:38', NULL),
(93, 'FX-20260616-4OV9', 'exchange', 2, 1, 1, 4, 1, 185000.0000, 100000.0000, 0.540540, 0.0000, 4, 12, 'pending', 0, 0, 1, NULL, 1, '2026-06-16 06:10:29', 1, 'wrong information', NULL, '2026-06-16 04:37:06', '2026-06-16 06:10:29', NULL),
(94, 'FX-20260616-VD11', 'agent', NULL, 1, 1, 1, 4, 100000.0000, 300000.0000, 3.000000, 0.0000, 1, NULL, 'pending', 0, 0, 1, NULL, 1, '2026-06-16 07:23:46', 1, 'cancelled', NULL, '2026-06-16 07:19:15', '2026-06-16 07:23:46', NULL),
(95, 'FX-20260616-T4Q1', 'exchange', 1, 1, 1, 1, 4, 83000.0000, 185000.0000, 0.450450, 0.0000, 4, 11, 'cash', 0, 0, 1, 'Reversal of FX-20260609-FROF — wrong number', 0, NULL, NULL, NULL, 91, '2026-06-16 09:12:38', '2026-06-16 09:12:38', NULL),
(96, 'FX-20260616-MMNE', 'agent', NULL, 1, 7, 3, 1, 100.0000, 374000.0000, 3740.000000, 0.0000, 3, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-16 09:56:55', '2026-06-16 10:32:33', NULL),
(97, 'FX-20260616-UKHP', 'agent', NULL, 1, 7, 3, 1, 100.0000, 374000.0000, 3740.000000, 0.0000, 3, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-16 10:42:45', '2026-06-16 10:50:55', NULL),
(98, 'FX-20260616-8KXS', 'agent', NULL, 1, 7, 1, 3, 187000.0000, 50.0000, 3740.000000, 0.0000, 1, NULL, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-16 11:12:34', '2026-06-16 11:13:06', NULL),
(99, 'FX-20260616-69SX', 'exchange', 1, 1, 7, 3, 1, 50.0000, 182500.0000, 3650.000000, 0.0000, 3, 21, 'cash', 1, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-16 12:46:22', '2026-06-16 12:46:22', NULL),
(100, 'FX-20260616-EGYZ', 'deposit', 13, NULL, NULL, 1, 1, 200000.0000, 200000.0000, 1.000000, 0.0000, NULL, NULL, 'cash', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-16 13:18:44', '2026-06-16 13:18:44', NULL),
(101, 'FX-20260616-FEIH', 'withdraw', 8, NULL, NULL, 1, 1, 300000.0000, 300000.0000, 1.000000, 0.0000, NULL, NULL, 'cash', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-16 13:23:46', '2026-06-16 13:23:46', NULL),
(102, 'FX-20260619-4XXP', 'exchange', 4, 1, 1, 4, 1, 18500.0000, 8000.0000, 0.450450, 0.0000, 4, 11, 'cash', 1, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-19 04:21:02', '2026-06-19 04:21:02', NULL),
(103, 'FX-20260619-2U8N', 'exchange', 4, 1, 7, 3, 1, 50.0000, 184500.0000, 3690.000000, 0.0000, 3, 20, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-19 04:24:39', '2026-06-19 04:25:03', NULL),
(106, 'FX-20260619-BVKZ', 'exchange', 12, 1, 1, 4, 1, 30000.0000, 16000.0000, 0.540540, 0.0000, 4, 12, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-19 04:44:53', '2026-06-19 04:46:34', NULL),
(107, 'FX-20260619-X1EJ', 'exchange', 9, 1, 1, 4, 1, 50000.0000, 27000.0000, 0.540540, 0.0000, 4, 12, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-19 04:53:04', '2026-06-19 04:53:25', NULL),
(108, 'FX-20260619-VBKN', 'exchange', 1, 1, 7, 3, 1, 70.0000, 258300.0000, 3690.000000, 0.0000, 3, 20, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-19 04:56:06', '2026-06-19 04:56:17', NULL),
(110, 'FX-20260620-3VK7', 'deposit', 11, NULL, NULL, 1, 1, 50000.0000, 50000.0000, 1.000000, 0.0000, NULL, NULL, 'cash', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-20 05:02:20', '2026-06-20 05:02:20', NULL),
(111, 'FX-20260620-P1OP', 'withdraw', 11, NULL, NULL, 1, 1, 10000.0000, 10000.0000, 1.000000, 0.0000, NULL, NULL, 'cash', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-20 05:02:33', '2026-06-20 05:02:33', NULL),
(112, 'FX-20260623-TKN3', 'exchange', 1, 1, 7, 3, 1, 150.0000, 547500.0000, 3650.000000, 0.0000, 3, 21, 'cash', 1, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-23 09:42:03', '2026-06-23 09:42:03', NULL),
(113, 'FX-20260623-WWAV', 'exchange', 1, NULL, 7, 1, 3, 730000.0000, 170.0000, 0.000230, 109500.0000, 1, 7, 'cash', 1, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-23 10:14:48', '2026-06-23 10:14:48', NULL),
(114, 'FX-20260623-FFQD', 'exchange', 2, 1, 7, 3, 1, 50.0000, 182500.0000, 3650.000000, 0.0000, 3, 21, 'cash', 1, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-23 10:25:48', '2026-06-23 10:25:48', NULL),
(115, 'FX-20260623-Y1KO', 'exchange', 2, NULL, 7, 1, 3, 450000.0000, 100.0000, 0.000230, 85000.0000, 1, 7, 'cash', 1, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-23 10:29:44', '2026-06-23 10:29:44', NULL),
(116, 'FX-20260623-L64R', 'exchange', 4, NULL, 7, 3, 1, 70.0000, 255500.0000, 3650.000000, 0.0000, 3, 21, 'cash', 1, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-23 10:36:20', '2026-06-23 10:36:20', NULL),
(117, 'FX-20260623-BJEB', 'exchange', 4, 1, 7, 3, 1, 50.0000, 182500.0000, 3650.000000, 0.0000, 3, 21, 'cash', 1, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-23 10:47:45', '2026-06-23 10:47:45', NULL),
(118, 'FX-20260623-LMDO', 'exchange', 8, 1, 7, 3, 1, 100.0000, 365000.0000, 3650.000000, 0.0000, 3, 21, 'cash', 1, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-23 10:52:46', '2026-06-23 10:52:46', NULL),
(119, 'FX-20260623-UNBV', 'deposit', 8, NULL, NULL, 3, 3, 100.0000, 100.0000, 1.000000, 0.0000, NULL, NULL, 'cash', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-23 10:53:06', '2026-06-23 10:53:06', NULL),
(120, 'FX-20260623-XZNI', 'exchange', 9, NULL, 7, 1, 3, 300000.0000, 69.0000, 0.000230, 48150.0000, 1, 7, 'cash', 1, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-23 11:00:45', '2026-06-23 11:00:45', NULL),
(121, 'FX-20260623-5AQQ', 'deposit', 9, NULL, NULL, 1, 1, 200000.0000, 200000.0000, 1.000000, 0.0000, NULL, NULL, 'cash', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-23 11:03:10', '2026-06-23 11:03:10', NULL),
(122, 'FX-20260623-QI7L', 'exchange', 9, 1, 7, 1, 3, 400000.0000, 92.0000, 0.000230, 64200.0000, 1, 7, 'cash', 1, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-23 11:09:11', '2026-06-23 11:09:11', NULL),
(123, 'FX-20260623-Z9VU', 'deposit', 9, NULL, NULL, 1, 1, 600000.0000, 600000.0000, 1.000000, 0.0000, NULL, NULL, 'cash', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-23 11:12:26', '2026-06-23 11:12:26', NULL),
(128, 'FX-20260625-C8AM', 'exchange', NULL, NULL, 7, 3, 1, 50.0000, 182500.0000, 3650.000000, 0.0000, 3, 20, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-25 11:02:29', '2026-06-25 11:02:29', NULL),
(129, 'FX-20260625-TJPW', 'exchange', NULL, NULL, 1, 4, 1, 50000.0000, 27000.0000, 0.540540, 0.0000, 4, 12, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-25 11:07:04', '2026-06-25 11:07:04', NULL),
(130, 'FX-20260625-6QEG', 'exchange', NULL, NULL, 8, 3, 4, 100.0000, 670000.0000, 6700.000000, 0.0000, 3, 18, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-25 11:08:06', '2026-06-25 11:08:06', NULL),
(131, 'FX-20260626-A9OE', 'exchange', 10, NULL, 7, 3, 1, 100.0000, 365000.0000, 3650.000000, 0.0000, 3, 20, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-26 09:10:14', '2026-06-26 09:33:19', NULL),
(132, 'FX-20260626-WP3D', 'deposit', 10, NULL, NULL, 3, 3, 100.0000, 100.0000, 1.000000, 0.0000, NULL, NULL, 'cash', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-26 09:33:20', '2026-06-26 09:33:20', NULL),
(133, 'FX-20260626-JZ8H', 'exchange', 9, NULL, 7, 3, 1, 50.0000, 182500.0000, 3650.000000, 0.0000, 3, 20, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-26 09:51:46', '2026-06-26 09:52:44', NULL),
(134, 'FX-20260626-JKDL', 'deposit', 9, NULL, NULL, 3, 3, 50.0000, 50.0000, 1.000000, 0.0000, NULL, NULL, 'cash', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-26 09:52:44', '2026-06-26 09:52:44', NULL),
(135, 'FX-20260707-KOXW', 'exchange', 10, NULL, 7, 3, 1, 500.0000, 1825000.0000, 3650.000000, 0.0000, 3, 20, 'cash', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-07-07 05:00:35', '2026-07-09 13:03:03', NULL),
(136, 'FX-20260709-9XPF', 'exchange', 10, NULL, 7, 1, 3, 1000000.0000, 270.0000, 0.000270, 14500.0000, 1, 8, 'pending', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-07-09 13:14:04', '2026-07-09 13:14:04', NULL),
(137, 'FX-20260709-UCV1', 'exchange', 9, NULL, 7, 3, 1, 300.0000, 1095000.0000, 3650.000000, 0.0000, 3, 20, 'cash', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-07-09 13:18:09', '2026-07-09 13:19:49', NULL),
(138, 'FX-20260709-HXSI', 'deposit', 9, NULL, NULL, 3, 3, 88.0000, 88.0000, 1.000000, 0.0000, NULL, NULL, 'cash', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-07-09 13:19:49', '2026-07-09 13:19:49', NULL),
(139, 'FX-20260713-AWC6', 'exchange', NULL, 1, 7, 3, 1, 50.0000, 182500.0000, 3650.000000, 0.0000, 3, 20, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-07-13 09:54:24', '2026-07-13 09:54:24', NULL),
(140, 'FX-20260713-GKSY', 'exchange', 10, NULL, 7, 3, 1, 50.0000, 182500.0000, 3650.000000, 0.0000, 3, 20, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-07-13 10:05:11', '2026-07-13 10:05:11', NULL),
(141, 'FX-20260713-TDPC', 'exchange', 12, NULL, 7, 3, 1, 50.0000, 182500.0000, 3650.000000, 0.0000, 3, 20, 'pending', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-07-13 10:18:07', '2026-07-13 10:18:07', NULL),
(142, 'FX-20260713-G9GW', 'exchange', 1, NULL, 1, 4, 1, 400000.0000, 216000.0000, 0.540540, 0.0000, 4, 12, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-07-13 10:48:29', '2026-07-13 10:48:29', NULL),
(143, 'FX-20260714-MAI9', 'deposit', 12, NULL, NULL, 1, 1, 100000.0000, 100000.0000, 1.000000, 0.0000, NULL, NULL, 'cash', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-07-14 05:44:46', '2026-07-14 05:44:46', NULL),
(144, 'FX-20260714-IFBX', 'deposit', 11, NULL, NULL, 3, 3, 100.0000, 100.0000, 1.000000, 0.0000, NULL, NULL, 'cash', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-07-14 05:45:12', '2026-07-14 05:45:12', NULL),
(145, 'FX-20260714-JPMF', 'deposit', 12, NULL, NULL, 3, 3, 100.0000, 100.0000, 1.000000, 0.0000, NULL, NULL, 'cash', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-07-14 05:46:15', '2026-07-14 05:46:15', NULL),
(146, 'FX-20260714-TILF', 'deposit', 11, NULL, NULL, 3, 3, 50.0000, 50.0000, 1.000000, 0.0000, NULL, NULL, 'cash', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-07-14 05:52:17', '2026-07-14 05:52:17', NULL),
(147, 'FX-20260714-59QN', 'deposit', 13, NULL, NULL, 3, 3, 100.0000, 100.0000, 1.000000, 0.0000, NULL, NULL, 'cash', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-07-14 06:09:57', '2026-07-14 06:09:57', NULL),
(148, 'FX-20260714-TI03', 'exchange', NULL, 1, 7, 3, 1, 100.0000, 365000.0000, 3650.000000, 0.0000, 3, 20, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-07-14 06:17:57', '2026-07-14 06:17:57', NULL),
(149, 'FX-20260714-YDGB', 'exchange', NULL, NULL, 7, 3, 1, 50.0000, 182500.0000, 3650.000000, 0.0000, 3, 20, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-07-14 07:21:15', '2026-07-14 07:21:15', NULL),
(150, 'FX-20260714-PW00', 'exchange', NULL, NULL, 7, 3, 1, 50.0000, 182500.0000, 3650.000000, 0.0000, 3, 20, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-07-14 07:36:58', '2026-07-14 07:36:58', NULL),
(151, 'FX-20260714-TJVG', 'exchange', 13, NULL, 7, 3, 1, 150.0000, 547500.0000, 3650.000000, 0.0000, 3, 20, 'cash', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-07-14 07:37:59', '2026-07-14 07:38:38', NULL),
(152, 'FX-20261015-FYWT', 'exchange', 2, 1, 1, 1, 4, 300000.0000, 534000.0000, 1.780000, 11351.6400, 1, 10, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-10-15 05:42:11', '2026-10-15 05:42:11', NULL),
(153, 'FX-20261015-OKQR', 'exchange', 2, 1, 1, 4, 1, 540000.0000, 291892.0000, 0.540540, 0.0000, 4, 12, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-10-15 05:49:21', '2026-10-15 05:49:21', NULL),
(154, 'FX-20261015-Q5H3', 'deposit', 12, NULL, NULL, 1, 1, 500000.0000, 500000.0000, 1.000000, 0.0000, NULL, NULL, 'cash', 0, 1, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-10-15 05:54:20', '2026-10-15 05:54:20', NULL),
(155, 'FX-20261015-B3VQ', 'exchange', 10, 1, 1, 4, 1, 50000.0000, 27027.0000, 0.540540, 0.0000, 4, 12, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-10-15 05:55:50', '2026-10-15 05:55:50', NULL),
(156, 'FX-20261015-6PMS', 'exchange', 10, NULL, 1, 1, 4, 30000.0000, 53400.0000, 1.780000, 1135.1640, 1, 10, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-10-15 05:57:49', '2026-10-15 05:57:49', NULL),
(157, 'FX-20261015-RDGQ', 'exchange', 11, 1, 1, 4, 1, 50000.0000, 27027.0000, 0.540540, 0.0000, 4, 12, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-10-15 06:05:44', '2026-10-15 06:05:44', NULL),
(158, 'FX-20261015-7LII', 'exchange', 9, NULL, 1, 4, 1, 50000.0000, 27027.0000, 0.540540, 0.0000, 4, 12, 'cash', 0, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-10-15 06:35:30', '2026-10-15 06:35:30', NULL),
(159, 'FX-20261015-Y63C', 'exchange', 9, NULL, 7, 3, 1, 50.0000, 182500.0000, 3650.000000, 0.0000, 3, 21, 'cash', 1, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-10-15 06:43:32', '2026-10-15 06:43:32', NULL),
(160, 'FX-20261015-ET25', 'exchange', 5, 1, 7, 3, 1, 100.0000, 365000.0000, 3650.000000, 0.0000, 3, 21, 'cash', 1, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-10-15 06:54:24', '2026-10-15 06:54:24', NULL),
(161, 'FX-20261015-PRG1', 'exchange', 5, NULL, 1, 4, 1, 100000.0000, 45045.0000, 0.450450, 0.0000, 4, 11, 'cash', 1, 0, 1, NULL, 0, NULL, NULL, NULL, NULL, '2026-10-15 07:21:32', '2026-10-15 07:21:32', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role_id` bigint(20) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `role_id`, `is_active`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'demo', 'enochnegus@gmail.com', 1, 1, NULL, '$2y$12$yIuhSu4TsHzOZO4M3mtZLOHJmhAeOBuAqnyCkqunmDi1xt4vtsW4K', 'Q1gV8h0Tt6ZH0u0E9cnROQPzP0ytEXlZGyYLIrnM5vGI9OuFWNadvHLBEdfq', '2026-05-06 09:56:35', '2026-06-24 09:37:24'),
(2, 'admin', 'admin@forexio.local', 1, 1, NULL, '$2y$12$5qF0xLWg1dz36ebNDUKQ/.gr85a4HR0gk6MVNA5LQvxeEH/bwuZqW', NULL, '2026-06-24 09:06:22', '2026-06-24 12:11:47'),
(3, 'test', 'test@gmail.com', 1, 1, NULL, '$2y$12$rL1ZHtczR4FolsO.z6Wd.urTbi3R97dYZ1nOtBBJBgjGH6je5fweq', NULL, '2026-06-24 09:44:29', '2026-06-24 09:44:29');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `agent_commissions`
--
ALTER TABLE `agent_commissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `agent_commissions_agent_line_id_period_month_unique` (`agent_line_id`,`period_month`),
  ADD KEY `agent_commissions_currency_id_foreign` (`currency_id`),
  ADD KEY `agent_commissions_entered_by_foreign` (`entered_by`);

--
-- Indexes for table `agent_lines`
--
ALTER TABLE `agent_lines`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `agent_lines_phone_unique` (`phone`),
  ADD KEY `agent_lines_user_id_foreign` (`user_id`);

--
-- Indexes for table `agent_rates`
--
ALTER TABLE `agent_rates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `agent_rates_currency_pair_id_foreign` (`currency_pair_id`),
  ADD KEY `agent_rates_set_by_foreign` (`set_by`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `clients_phone_unique` (`phone`),
  ADD KEY `clients_created_by_foreign` (`created_by`);

--
-- Indexes for table `client_rates`
--
ALTER TABLE `client_rates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_rates_currency_pair_id_foreign` (`currency_pair_id`),
  ADD KEY `client_rates_set_by_foreign` (`set_by`);

--
-- Indexes for table `client_wallets`
--
ALTER TABLE `client_wallets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `client_wallets_client_id_currency_id_unique` (`client_id`,`currency_id`),
  ADD KEY `client_wallets_currency_id_foreign` (`currency_id`);

--
-- Indexes for table `currencies`
--
ALTER TABLE `currencies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `currency_pairs`
--
ALTER TABLE `currency_pairs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `currency_pairs_base_currency_foreign` (`base_currency`),
  ADD KEY `currency_pairs_quote_currency_foreign` (`quote_currency`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `expenses_ref_no_unique` (`ref_no`),
  ADD KEY `expenses_expense_category_id_foreign` (`expense_category_id`),
  ADD KEY `expenses_currency_id_foreign` (`currency_id`),
  ADD KEY `expenses_recorded_by_foreign` (`recorded_by`),
  ADD KEY `expenses_reversed_by_foreign` (`reversed_by`);

--
-- Indexes for table `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `expense_categories_name_unique` (`name`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `pending_settlements`
--
ALTER TABLE `pending_settlements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pending_settlements_transaction_id_foreign` (`transaction_id`),
  ADD KEY `pending_settlements_currency_id_foreign` (`currency_id`),
  ADD KEY `pending_settlements_settled_by_foreign` (`settled_by`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_slug_unique` (`slug`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_name_unique` (`name`),
  ADD UNIQUE KEY `roles_slug_unique` (`slug`);

--
-- Indexes for table `role_permission`
--
ALTER TABLE `role_permission`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `role_permission_permission_id_foreign` (`permission_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `settlement_payments`
--
ALTER TABLE `settlement_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `settlement_payments_pending_settlement_id_foreign` (`pending_settlement_id`),
  ADD KEY `settlement_payments_currency_id_foreign` (`currency_id`),
  ADD KEY `settlement_payments_teller_id_foreign` (`teller_id`);

--
-- Indexes for table `till_entries`
--
ALTER TABLE `till_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `till_entries_till_session_id_foreign` (`till_session_id`),
  ADD KEY `till_entries_created_by_foreign` (`created_by`),
  ADD KEY `till_entries_transaction_id_foreign` (`transaction_id`),
  ADD KEY `till_entries_expense_id_foreign` (`expense_id`);

--
-- Indexes for table `till_sessions`
--
ALTER TABLE `till_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `till_sessions_currency_id_foreign` (`currency_id`),
  ADD KEY `till_sessions_opened_by_foreign` (`opened_by`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transactions_ref_no_unique` (`ref_no`),
  ADD KEY `transactions_client_id_foreign` (`client_id`),
  ADD KEY `transactions_agent_line_id_foreign` (`agent_line_id`),
  ADD KEY `transactions_currency_pair_id_foreign` (`currency_pair_id`),
  ADD KEY `transactions_from_currency_id_foreign` (`from_currency_id`),
  ADD KEY `transactions_to_currency_id_foreign` (`to_currency_id`),
  ADD KEY `transactions_client_rate_id_foreign` (`client_rate_id`),
  ADD KEY `transactions_teller_id_foreign` (`teller_id`),
  ADD KEY `transactions_profit_currency_id_foreign` (`profit_currency_id`),
  ADD KEY `transactions_reversed_by_foreign` (`reversed_by`),
  ADD KEY `transactions_reversal_of_id_foreign` (`reversal_of_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_role_id_foreign` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `agent_commissions`
--
ALTER TABLE `agent_commissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `agent_lines`
--
ALTER TABLE `agent_lines`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `agent_rates`
--
ALTER TABLE `agent_rates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `client_rates`
--
ALTER TABLE `client_rates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `client_wallets`
--
ALTER TABLE `client_wallets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `currencies`
--
ALTER TABLE `currencies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `currency_pairs`
--
ALTER TABLE `currency_pairs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `expense_categories`
--
ALTER TABLE `expense_categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `pending_settlements`
--
ALTER TABLE `pending_settlements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `settlement_payments`
--
ALTER TABLE `settlement_payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `till_entries`
--
ALTER TABLE `till_entries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=275;

--
-- AUTO_INCREMENT for table `till_sessions`
--
ALTER TABLE `till_sessions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=86;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=162;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `agent_commissions`
--
ALTER TABLE `agent_commissions`
  ADD CONSTRAINT `agent_commissions_agent_line_id_foreign` FOREIGN KEY (`agent_line_id`) REFERENCES `agent_lines` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `agent_commissions_currency_id_foreign` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`),
  ADD CONSTRAINT `agent_commissions_entered_by_foreign` FOREIGN KEY (`entered_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `agent_lines`
--
ALTER TABLE `agent_lines`
  ADD CONSTRAINT `agent_lines_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `agent_rates`
--
ALTER TABLE `agent_rates`
  ADD CONSTRAINT `agent_rates_currency_pair_id_foreign` FOREIGN KEY (`currency_pair_id`) REFERENCES `currency_pairs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `agent_rates_set_by_foreign` FOREIGN KEY (`set_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `clients`
--
ALTER TABLE `clients`
  ADD CONSTRAINT `clients_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `client_rates`
--
ALTER TABLE `client_rates`
  ADD CONSTRAINT `client_rates_currency_pair_id_foreign` FOREIGN KEY (`currency_pair_id`) REFERENCES `currency_pairs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `client_rates_set_by_foreign` FOREIGN KEY (`set_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `client_wallets`
--
ALTER TABLE `client_wallets`
  ADD CONSTRAINT `client_wallets_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `client_wallets_currency_id_foreign` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`);

--
-- Constraints for table `currency_pairs`
--
ALTER TABLE `currency_pairs`
  ADD CONSTRAINT `currency_pairs_base_currency_foreign` FOREIGN KEY (`base_currency`) REFERENCES `currencies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `currency_pairs_quote_currency_foreign` FOREIGN KEY (`quote_currency`) REFERENCES `currencies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_currency_id_foreign` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`),
  ADD CONSTRAINT `expenses_expense_category_id_foreign` FOREIGN KEY (`expense_category_id`) REFERENCES `expense_categories` (`id`),
  ADD CONSTRAINT `expenses_recorded_by_foreign` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `expenses_reversed_by_foreign` FOREIGN KEY (`reversed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `pending_settlements`
--
ALTER TABLE `pending_settlements`
  ADD CONSTRAINT `pending_settlements_currency_id_foreign` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`),
  ADD CONSTRAINT `pending_settlements_settled_by_foreign` FOREIGN KEY (`settled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `pending_settlements_transaction_id_foreign` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `role_permission`
--
ALTER TABLE `role_permission`
  ADD CONSTRAINT `role_permission_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_permission_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `settlement_payments`
--
ALTER TABLE `settlement_payments`
  ADD CONSTRAINT `settlement_payments_currency_id_foreign` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`),
  ADD CONSTRAINT `settlement_payments_pending_settlement_id_foreign` FOREIGN KEY (`pending_settlement_id`) REFERENCES `pending_settlements` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `settlement_payments_teller_id_foreign` FOREIGN KEY (`teller_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `till_entries`
--
ALTER TABLE `till_entries`
  ADD CONSTRAINT `till_entries_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `till_entries_expense_id_foreign` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `till_entries_till_session_id_foreign` FOREIGN KEY (`till_session_id`) REFERENCES `till_sessions` (`id`),
  ADD CONSTRAINT `till_entries_transaction_id_foreign` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `till_sessions`
--
ALTER TABLE `till_sessions`
  ADD CONSTRAINT `till_sessions_currency_id_foreign` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`),
  ADD CONSTRAINT `till_sessions_opened_by_foreign` FOREIGN KEY (`opened_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_agent_line_id_foreign` FOREIGN KEY (`agent_line_id`) REFERENCES `agent_lines` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `transactions_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `transactions_client_rate_id_foreign` FOREIGN KEY (`client_rate_id`) REFERENCES `client_rates` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `transactions_currency_pair_id_foreign` FOREIGN KEY (`currency_pair_id`) REFERENCES `currency_pairs` (`id`),
  ADD CONSTRAINT `transactions_from_currency_id_foreign` FOREIGN KEY (`from_currency_id`) REFERENCES `currencies` (`id`),
  ADD CONSTRAINT `transactions_profit_currency_id_foreign` FOREIGN KEY (`profit_currency_id`) REFERENCES `currencies` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `transactions_reversal_of_id_foreign` FOREIGN KEY (`reversal_of_id`) REFERENCES `transactions` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `transactions_reversed_by_foreign` FOREIGN KEY (`reversed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `transactions_teller_id_foreign` FOREIGN KEY (`teller_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `transactions_to_currency_id_foreign` FOREIGN KEY (`to_currency_id`) REFERENCES `currencies` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
