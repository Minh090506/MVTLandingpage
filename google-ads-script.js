/**
 * MVT Campaign Dashboard — Google Ads Script
 * ===========================================
 * Script này chạy trong Google Ads (Tools → Scripts)
 * Tự động export data campaign hàng ngày vào Google Sheet
 *
 * SETUP:
 * 1. Tạo Google Sheet mới, copy Sheet ID từ URL
 * 2. Paste Sheet ID vào CONFIG.SPREADSHEET_ID bên dưới
 * 3. Vào Google Ads → Tools & Settings → Scripts → New Script
 * 4. Paste toàn bộ code này → Save → Run 1 lần để test
 * 5. Bật Schedule: chạy Daily lúc 8:00 AM
 * 6. Publish Sheet: File → Share → Publish to web → CSV
 *
 * Sheet sẽ có 2 tabs:
 *   - "DailyData" — data hàng ngày cho mỗi campaign
 *   - "Summary"   — tổng hợp tất cả campaigns
 */

var CONFIG = {
  // ===== THAY ĐỔI GIÁ TRỊ NÀY =====
  SPREADSHEET_ID: '1n-sXenl1sTZooMLJKDqj2xSkiJwde6B8vxqfHV8cFLY',
  // ===================================

  DAILY_SHEET_NAME: 'DailyData',
  SUMMARY_SHEET_NAME: 'Summary',
  DATE_RANGE: 'LAST_30_DAYS',
  TIMEZONE: 'Asia/Ho_Chi_Minh'
};

function main() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  // === Tab 1: Daily Data ===
  var dailySheet = getOrCreateSheet(ss, CONFIG.DAILY_SHEET_NAME);
  exportDailyData(dailySheet);

  // === Tab 2: Summary ===
  var summarySheet = getOrCreateSheet(ss, CONFIG.SUMMARY_SHEET_NAME);
  exportSummary(summarySheet);

  // === Tab 3: Landing Pages ===
  var lpSheet = getOrCreateSheet(ss, 'LandingPages');
  exportLandingPages(lpSheet);

  Logger.log('MVT Dashboard data exported successfully at ' + new Date());
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function exportDailyData(sheet) {
  // Headers
  var headers = [
    'Date', 'CampaignName', 'CampaignId', 'Status',
    'Impressions', 'Clicks', 'Cost', 'Conversions', 'ConversionValue',
    'CTR', 'AvgCPC', 'ConvRate', 'CostPerConv',
    'SearchImprShare', 'SearchLostISBudget', 'SearchLostISRank',
    'AvgPosition', 'UpdatedAt'
  ];

  // Clear và ghi headers
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#1a73e8');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');

  // Query campaign data theo ngày
  var query = AdsApp.report(
    'SELECT ' +
    'segments.date, ' +
    'campaign.name, ' +
    'campaign.id, ' +
    'campaign.status, ' +
    'metrics.impressions, ' +
    'metrics.clicks, ' +
    'metrics.cost_micros, ' +
    'metrics.conversions, ' +
    'metrics.conversions_value, ' +
    'metrics.ctr, ' +
    'metrics.average_cpc, ' +
    'metrics.cost_per_conversion, ' +
    'metrics.search_impression_share, ' +
    'metrics.search_budget_lost_impression_share, ' +
    'metrics.search_rank_lost_impression_share ' +
    'FROM campaign ' +
    'WHERE segments.date DURING ' + CONFIG.DATE_RANGE + ' ' +
    'AND campaign.status != "REMOVED" ' +
    'ORDER BY segments.date DESC, campaign.name ASC'
  );

  var rows = query.rows();
  var data = [];
  var now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');

  while (rows.hasNext()) {
    var row = rows.next();
    var costMicros = parseInt(row['metrics.cost_micros']) || 0;
    var cost = costMicros / 1000000; // Micros to VND
    var clicks = parseInt(row['metrics.clicks']) || 0;
    var impressions = parseInt(row['metrics.impressions']) || 0;
    var conversions = parseFloat(row['metrics.conversions']) || 0;
    var convValue = parseFloat(row['metrics.conversions_value']) || 0;

    var ctr = impressions > 0 ? (clicks / impressions * 100) : 0;
    var avgCpc = clicks > 0 ? (cost / clicks) : 0;
    var convRate = clicks > 0 ? (conversions / clicks * 100) : 0;
    var costPerConv = conversions > 0 ? (cost / conversions) : 0;

    data.push([
      row['segments.date'],
      row['campaign.name'],
      row['campaign.id'],
      row['campaign.status'],
      impressions,
      clicks,
      Math.round(cost),
      conversions,
      convValue,
      parseFloat(ctr.toFixed(2)),
      Math.round(avgCpc),
      parseFloat(convRate.toFixed(2)),
      Math.round(costPerConv),
      row['metrics.search_impression_share'] || '',
      row['metrics.search_budget_lost_impression_share'] || '',
      row['metrics.search_rank_lost_impression_share'] || '',
      '', // avg position deprecated
      now
    ]);
  }

  if (data.length > 0) {
    sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  }

  // Format columns
  sheet.autoResizeColumns(1, headers.length);
  Logger.log('Exported ' + data.length + ' daily rows');
}

function exportSummary(sheet) {
  sheet.clear();

  var headers = [
    'CampaignName', 'Status', 'Budget', 'BiddingStrategy',
    'TotalImpressions', 'TotalClicks', 'TotalCost', 'TotalConversions',
    'AvgCTR', 'AvgCPC', 'AvgConvRate', 'AvgCPA',
    'SearchImprShare', 'Days', 'UpdatedAt'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#1a73e8');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');

  // Query tổng hợp theo campaign
  var campaigns = AdsApp.campaigns()
    .withCondition('campaign.status != "REMOVED"')
    .forDateRange(CONFIG.DATE_RANGE)
    .get();

  var data = [];
  var now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');

  while (campaigns.hasNext()) {
    var campaign = campaigns.next();
    var stats = campaign.getStatsFor(CONFIG.DATE_RANGE);

    var impressions = stats.getImpressions();
    var clicks = stats.getClicks();
    var cost = stats.getCost(); // Already in account currency
    var conversions = stats.getConversions();

    var ctr = impressions > 0 ? (clicks / impressions * 100) : 0;
    var avgCpc = clicks > 0 ? (cost / clicks) : 0;
    var convRate = clicks > 0 ? (conversions / clicks * 100) : 0;
    var cpa = conversions > 0 ? (cost / conversions) : 0;

    // Get budget and bidding
    var budget = campaign.getBudget().getAmount();
    var biddingType = campaign.getBiddingStrategyType();

    data.push([
      campaign.getName(),
      campaign.isEnabled() ? 'ENABLED' : 'PAUSED',
      budget,
      biddingType,
      impressions,
      clicks,
      Math.round(cost),
      conversions,
      parseFloat(ctr.toFixed(2)),
      Math.round(avgCpc),
      parseFloat(convRate.toFixed(2)),
      Math.round(cpa),
      '', // impr share not available here
      30, // days in range
      now
    ]);
  }

  if (data.length > 0) {
    sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  }

  sheet.autoResizeColumns(1, headers.length);
  Logger.log('Exported ' + data.length + ' campaign summaries');
}

function exportLandingPages(sheet) {
  sheet.clear();

  var headers = [
    'LandingPage', 'CampaignName',
    'Impressions', 'Clicks', 'Cost', 'Conversions', 'ConversionValue',
    'CTR', 'ConvRate', 'CostPerConv', 'UpdatedAt'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#1a73e8');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');

  var query = AdsApp.report(
    'SELECT ' +
    'landing_page_view.unexpanded_final_url, ' +
    'campaign.name, ' +
    'campaign.status, ' +
    'metrics.impressions, ' +
    'metrics.clicks, ' +
    'metrics.cost_micros, ' +
    'metrics.conversions, ' +
    'metrics.conversions_value, ' +
    'metrics.ctr, ' +
    'metrics.cost_per_conversion ' +
    'FROM landing_page_view ' +
    'WHERE segments.date DURING ' + CONFIG.DATE_RANGE + ' ' +
    'AND campaign.status != "REMOVED" ' +
    'AND metrics.impressions > 0 ' +
    'ORDER BY metrics.clicks DESC'
  );

  var rows = query.rows();
  var data = [];
  var now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');

  while (rows.hasNext()) {
    var row = rows.next();
    var costMicros = parseInt(row['metrics.cost_micros']) || 0;
    var cost = costMicros / 1000000;
    var clicks = parseInt(row['metrics.clicks']) || 0;
    var impressions = parseInt(row['metrics.impressions']) || 0;
    var conversions = parseFloat(row['metrics.conversions']) || 0;
    var convValue = parseFloat(row['metrics.conversions_value']) || 0;
    var convRate = clicks > 0 ? (conversions / clicks * 100) : 0;
    var costPerConv = conversions > 0 ? (cost / conversions) : 0;

    data.push([
      row['landing_page_view.unexpanded_final_url'] || '',
      row['campaign.name'] || '',
      impressions,
      clicks,
      Math.round(cost),
      conversions,
      convValue,
      parseFloat((impressions > 0 ? clicks/impressions*100 : 0).toFixed(2)),
      parseFloat(convRate.toFixed(2)),
      Math.round(costPerConv),
      now
    ]);
  }

  if (data.length > 0) {
    sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  }

  sheet.autoResizeColumns(1, headers.length);
  Logger.log('Exported ' + data.length + ' landing page rows');
}
