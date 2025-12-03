-- ===========================================
-- Usage Analysis SQL Queries for PDF Tool
-- ===========================================
-- These queries can be run in Supabase SQL Editor
-- to analyze user engagement and tool usage.
-- ===========================================

-- 1. ユニークユーザー数（総数）
-- Total unique users
SELECT COUNT(DISTINCT user_email) AS total_unique_users
FROM usage_logs
WHERE user_email IS NOT NULL;

-- 2. 月別ユニークユーザー数
-- Monthly unique users
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(DISTINCT user_email) AS unique_users
FROM usage_logs
WHERE user_email IS NOT NULL
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- 3. 週別ユニークユーザー数
-- Weekly unique users
SELECT
  DATE_TRUNC('week', created_at) AS week,
  COUNT(DISTINCT user_email) AS unique_users
FROM usage_logs
WHERE user_email IS NOT NULL
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week DESC;

-- 4. 日別アクティブユーザー数（DAU）
-- Daily Active Users
SELECT
  DATE(created_at) AS date,
  COUNT(DISTINCT user_email) AS daily_active_users
FROM usage_logs
WHERE user_email IS NOT NULL
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 5. 操作種別ごとの利用回数
-- Usage count by action type
SELECT
  action_type,
  COUNT(*) AS total_operations,
  COUNT(DISTINCT user_email) AS unique_users
FROM usage_logs
GROUP BY action_type
ORDER BY total_operations DESC;

-- 6. ユーザー別利用回数ランキング
-- Top users by usage count
SELECT
  user_email,
  user_name,
  COUNT(*) AS total_operations,
  COUNT(CASE WHEN action_type = 'extract' THEN 1 END) AS extractions,
  COUNT(CASE WHEN action_type = 'merge' THEN 1 END) AS merges,
  SUM(pages_extracted) AS total_pages_processed
FROM usage_logs
WHERE user_email IS NOT NULL
GROUP BY user_email, user_name
ORDER BY total_operations DESC
LIMIT 50;

-- 7. 直近7日間のユーザーアクティビティ
-- User activity in the last 7 days
SELECT
  user_email,
  user_name,
  COUNT(*) AS operations_last_7_days,
  MAX(created_at) AS last_activity
FROM usage_logs
WHERE user_email IS NOT NULL
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY user_email, user_name
ORDER BY operations_last_7_days DESC;

-- 8. 時間帯別利用状況
-- Usage by hour of day
SELECT
  EXTRACT(HOUR FROM created_at) AS hour_of_day,
  COUNT(*) AS total_operations,
  COUNT(DISTINCT user_email) AS unique_users
FROM usage_logs
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour_of_day;

-- 9. 曜日別利用状況
-- Usage by day of week
SELECT
  TO_CHAR(created_at, 'Day') AS day_of_week,
  EXTRACT(DOW FROM created_at) AS day_number,
  COUNT(*) AS total_operations,
  COUNT(DISTINCT user_email) AS unique_users
FROM usage_logs
GROUP BY TO_CHAR(created_at, 'Day'), EXTRACT(DOW FROM created_at)
ORDER BY day_number;

-- 10. 月別利用統計サマリー
-- Monthly usage summary
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS total_operations,
  COUNT(DISTINCT user_email) AS unique_users,
  COUNT(CASE WHEN action_type = 'extract' THEN 1 END) AS extractions,
  COUNT(CASE WHEN action_type = 'merge' THEN 1 END) AS merges,
  SUM(pages_extracted) AS total_pages_processed,
  ROUND(AVG(pages_extracted), 2) AS avg_pages_per_operation
FROM usage_logs
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- 11. 新規ユーザー数（初回利用日別）
-- New users by first usage date
SELECT
  first_usage_date,
  COUNT(*) AS new_users
FROM (
  SELECT
    user_email,
    DATE(MIN(created_at)) AS first_usage_date
  FROM usage_logs
  WHERE user_email IS NOT NULL
  GROUP BY user_email
) AS first_usage
GROUP BY first_usage_date
ORDER BY first_usage_date DESC;

-- 12. ユーザーリテンション（継続利用）
-- User retention: Users who used the tool multiple times
SELECT
  CASE
    WHEN usage_count = 1 THEN '1回のみ'
    WHEN usage_count BETWEEN 2 AND 5 THEN '2-5回'
    WHEN usage_count BETWEEN 6 AND 10 THEN '6-10回'
    WHEN usage_count BETWEEN 11 AND 20 THEN '11-20回'
    ELSE '21回以上'
  END AS usage_frequency,
  COUNT(*) AS user_count
FROM (
  SELECT
    user_email,
    COUNT(*) AS usage_count
  FROM usage_logs
  WHERE user_email IS NOT NULL
  GROUP BY user_email
) AS user_usage
GROUP BY
  CASE
    WHEN usage_count = 1 THEN '1回のみ'
    WHEN usage_count BETWEEN 2 AND 5 THEN '2-5回'
    WHEN usage_count BETWEEN 6 AND 10 THEN '6-10回'
    WHEN usage_count BETWEEN 11 AND 20 THEN '11-20回'
    ELSE '21回以上'
  END
ORDER BY user_count DESC;

-- 13. 直近のアクセス履歴（最新50件）
-- Recent access history (last 50)
SELECT
  created_at,
  action_type,
  file_name,
  total_pages,
  pages_extracted,
  user_email,
  user_name
FROM usage_logs
ORDER BY created_at DESC
LIMIT 50;

-- 14. ファイルサイズ（ページ数）の分布
-- Distribution of file sizes (page counts)
SELECT
  CASE
    WHEN total_pages <= 5 THEN '1-5ページ'
    WHEN total_pages <= 10 THEN '6-10ページ'
    WHEN total_pages <= 20 THEN '11-20ページ'
    WHEN total_pages <= 50 THEN '21-50ページ'
    WHEN total_pages <= 100 THEN '51-100ページ'
    ELSE '100ページ以上'
  END AS page_range,
  COUNT(*) AS file_count
FROM usage_logs
WHERE action_type = 'extract'
GROUP BY
  CASE
    WHEN total_pages <= 5 THEN '1-5ページ'
    WHEN total_pages <= 10 THEN '6-10ページ'
    WHEN total_pages <= 20 THEN '11-20ページ'
    WHEN total_pages <= 50 THEN '21-50ページ'
    WHEN total_pages <= 100 THEN '51-100ページ'
    ELSE '100ページ以上'
  END
ORDER BY file_count DESC;

-- 15. 評価用KPIダッシュボード
-- KPI Dashboard for evaluation
SELECT
  -- 総利用回数
  COUNT(*) AS total_operations,
  -- ユニークユーザー数
  COUNT(DISTINCT user_email) AS unique_users,
  -- 今月の利用回数
  COUNT(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) THEN 1 END) AS operations_this_month,
  -- 今月のユニークユーザー数
  COUNT(DISTINCT CASE WHEN created_at >= DATE_TRUNC('month', NOW()) THEN user_email END) AS users_this_month,
  -- 今週の利用回数
  COUNT(CASE WHEN created_at >= DATE_TRUNC('week', NOW()) THEN 1 END) AS operations_this_week,
  -- 今週のユニークユーザー数
  COUNT(DISTINCT CASE WHEN created_at >= DATE_TRUNC('week', NOW()) THEN user_email END) AS users_this_week,
  -- 今日の利用回数
  COUNT(CASE WHEN created_at >= DATE_TRUNC('day', NOW()) THEN 1 END) AS operations_today,
  -- 今日のユニークユーザー数
  COUNT(DISTINCT CASE WHEN created_at >= DATE_TRUNC('day', NOW()) THEN user_email END) AS users_today,
  -- 処理された総ページ数
  SUM(pages_extracted) AS total_pages_processed
FROM usage_logs;
