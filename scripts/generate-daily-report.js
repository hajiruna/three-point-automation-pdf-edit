/**
 * 日次レポート生成スクリプト
 * GitHub Actionsから毎日実行され、CSVレポートを生成します
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase クライアント初期化
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 日付フォーマット
const today = new Date();
const dateStr = today.toISOString().split('T')[0];
const monthStr = dateStr.slice(0, 7);

// レポート出力ディレクトリ
const reportsDir = path.join(__dirname, '..', 'reports');
const monthlyDir = path.join(reportsDir, monthStr);

// ディレクトリ作成
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}
if (!fs.existsSync(monthlyDir)) {
  fs.mkdirSync(monthlyDir, { recursive: true });
}

/**
 * CSVエスケープ
 */
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * 配列をCSV文字列に変換
 */
function toCSV(headers, rows) {
  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map(row =>
    headers.map(h => escapeCSV(row[h])).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
}

/**
 * 日次サマリーレポート
 */
async function generateDailySummary() {
  console.log('Generating daily summary...');

  const { data, error } = await supabase
    .from('usage_logs')
    .select('*');

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  const logs = data || [];

  // 日別集計
  const dailyMap = new Map();
  logs.forEach(log => {
    const date = new Date(log.created_at).toISOString().split('T')[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        date,
        total_operations: 0,
        extractions: 0,
        merges: 0,
        unique_users: new Set(),
        total_pages: 0,
      });
    }
    const day = dailyMap.get(date);
    day.total_operations++;
    if (log.action_type === 'extract') day.extractions++;
    if (log.action_type === 'merge') day.merges++;
    if (log.user_email) day.unique_users.add(log.user_email);
    day.total_pages += log.pages_extracted || 0;
  });

  // CSVデータ作成
  const rows = Array.from(dailyMap.values())
    .map(d => ({
      date: d.date,
      total_operations: d.total_operations,
      extractions: d.extractions,
      merges: d.merges,
      unique_users: d.unique_users.size,
      total_pages: d.total_pages,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const headers = ['date', 'total_operations', 'extractions', 'merges', 'unique_users', 'total_pages'];
  const csv = toCSV(headers, rows);

  const filename = path.join(monthlyDir, `daily-summary-${dateStr}.csv`);
  fs.writeFileSync(filename, '\ufeff' + csv, 'utf8'); // BOM for Excel
  console.log(`Created: ${filename}`);
}

/**
 * ユーザー別利用レポート
 */
async function generateUserReport() {
  console.log('Generating user report...');

  const { data, error } = await supabase
    .from('usage_logs')
    .select('*');

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  const logs = data || [];

  // ユーザー別集計
  const userMap = new Map();
  logs.forEach(log => {
    const email = log.user_email || 'unknown';
    if (!userMap.has(email)) {
      userMap.set(email, {
        user_email: email,
        user_name: log.user_name || '',
        total_operations: 0,
        extractions: 0,
        merges: 0,
        total_pages: 0,
        first_activity: log.created_at,
        last_activity: log.created_at,
      });
    }
    const user = userMap.get(email);
    user.total_operations++;
    if (log.action_type === 'extract') user.extractions++;
    if (log.action_type === 'merge') user.merges++;
    user.total_pages += log.pages_extracted || 0;
    if (log.user_name) user.user_name = log.user_name;
    if (new Date(log.created_at) < new Date(user.first_activity)) {
      user.first_activity = log.created_at;
    }
    if (new Date(log.created_at) > new Date(user.last_activity)) {
      user.last_activity = log.created_at;
    }
  });

  // CSVデータ作成
  const rows = Array.from(userMap.values())
    .sort((a, b) => b.total_operations - a.total_operations);

  const headers = ['user_email', 'user_name', 'total_operations', 'extractions', 'merges', 'total_pages', 'first_activity', 'last_activity'];
  const csv = toCSV(headers, rows);

  const filename = path.join(monthlyDir, `user-report-${dateStr}.csv`);
  fs.writeFileSync(filename, '\ufeff' + csv, 'utf8');
  console.log(`Created: ${filename}`);
}

/**
 * 詳細ログレポート（当日分）
 */
async function generateDetailedLog() {
  console.log('Generating detailed log...');

  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('usage_logs')
    .select('*')
    .gte('created_at', startOfDay.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  const logs = data || [];

  if (logs.length === 0) {
    console.log('No logs for today');
    return;
  }

  const rows = logs.map(log => ({
    id: log.id,
    created_at: log.created_at,
    action_type: log.action_type || '',
    file_name: log.file_name || '',
    total_pages: log.total_pages || 0,
    pages_extracted: log.pages_extracted || 0,
    user_email: log.user_email || '',
    user_name: log.user_name || '',
  }));

  const headers = ['id', 'created_at', 'action_type', 'file_name', 'total_pages', 'pages_extracted', 'user_email', 'user_name'];
  const csv = toCSV(headers, rows);

  const filename = path.join(monthlyDir, `detailed-log-${dateStr}.csv`);
  fs.writeFileSync(filename, '\ufeff' + csv, 'utf8');
  console.log(`Created: ${filename}`);
}

/**
 * 累計KPIレポート
 */
async function generateKPISummary() {
  console.log('Generating KPI summary...');

  const { data, error } = await supabase
    .from('usage_logs')
    .select('*');

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  const logs = data || [];

  const uniqueUsers = new Set(logs.filter(l => l.user_email).map(l => l.user_email));

  const kpi = {
    report_date: dateStr,
    total_operations: logs.length,
    unique_users: uniqueUsers.size,
    total_extractions: logs.filter(l => l.action_type === 'extract').length,
    total_merges: logs.filter(l => l.action_type === 'merge').length,
    total_pages_processed: logs.reduce((sum, l) => sum + (l.pages_extracted || 0), 0),
  };

  // 既存のKPIファイルを読み込んで追記
  const kpiFilename = path.join(reportsDir, 'kpi-history.csv');
  const headers = ['report_date', 'total_operations', 'unique_users', 'total_extractions', 'total_merges', 'total_pages_processed'];

  let existingData = [];
  if (fs.existsSync(kpiFilename)) {
    const content = fs.readFileSync(kpiFilename, 'utf8').replace(/^\ufeff/, '');
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length > 1) {
      existingData = lines.slice(1).map(line => {
        const values = line.split(',');
        return {
          report_date: values[0],
          total_operations: values[1],
          unique_users: values[2],
          total_extractions: values[3],
          total_merges: values[4],
          total_pages_processed: values[5],
        };
      }).filter(d => d.report_date !== dateStr); // 同じ日付があれば除外
    }
  }

  existingData.push(kpi);
  existingData.sort((a, b) => String(a.report_date).localeCompare(String(b.report_date)));

  const csv = toCSV(headers, existingData);
  fs.writeFileSync(kpiFilename, '\ufeff' + csv, 'utf8');
  console.log(`Updated: ${kpiFilename}`);
}

/**
 * メイン処理
 */
async function main() {
  console.log(`\n📊 Generating daily reports for ${dateStr}\n`);

  try {
    await generateKPISummary();
    await generateDailySummary();
    await generateUserReport();
    await generateDetailedLog();

    console.log('\n✅ All reports generated successfully!\n');
  } catch (err) {
    console.error('Error generating reports:', err);
    process.exit(1);
  }
}

main();
