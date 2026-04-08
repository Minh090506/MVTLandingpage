# PROMPT: Setup Google Ads Script (Auto Dashboard Data)

> Paste vào Claude in Chrome sidebar khi đang ở trang Google Ads Scripts
> (ads.google.com → Tools & Settings → Bulk actions → Scripts)
> Account: My Viva Tour 806-163-1566

```
Tôi cần bạn tạo một Google Ads Script mới. Hãy làm theo từng bước:

LƯU Ý:
- Nếu gặp lỗi screenshot quá lớn, thu nhỏ cửa sổ trước
- Trang có thể hiện bằng tiếng Việt
- Nếu chưa ở trang Scripts, hãy navigate: click menu Tools & Settings (hoặc Công cụ) → Bulk actions (Thao tác hàng loạt) → Scripts (Tập lệnh)

=== BƯỚC 1: TẠO SCRIPT MỚI ===
1. Tìm nút "+" hoặc "New script" hoặc "Tập lệnh mới" → click vào
2. Đợi trang editor mở ra

=== BƯỚC 2: ĐẶT TÊN SCRIPT ===
1. Tìm ô tên script ở trên cùng (mặc định là "Untitled script")
2. Click vào đó → xóa text cũ → gõ: MVT Dashboard Export

=== BƯỚC 3: XÓA CODE MẪU ===
1. Trong editor code, select all (Cmd+A) → xóa hết code mẫu

=== BƯỚC 4: PASTE CODE ===
Paste TOÀN BỘ code dưới đây vào editor:

var CONFIG = {
  SPREADSHEET_ID: '1n-sXenl1sTZooMLJKDqj2xSkiJwde6B8vxqfHV8cFLY',
  DAILY_SHEET_NAME: 'DailyData',
  SUMMARY_SHEET_NAME: 'Summary',
  DATE_RANGE: 'LAST_30_DAYS',
  TIMEZONE: 'Asia/Ho_Chi_Minh'
};

function main() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var dailySheet = getOrCreateSheet(ss, CONFIG.DAILY_SHEET_NAME);
  exportDailyData(dailySheet);
  var summarySheet = getOrCreateSheet(ss, CONFIG.SUMMARY_SHEET_NAME);
  exportSummary(summarySheet);
  Logger.log('MVT Dashboard data exported successfully at ' + new Date());
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) { sheet = ss.insertSheet(name); }
  return sheet;
}

function exportDailyData(sheet) {
  var headers = ['Date', 'CampaignName', 'CampaignId', 'Status', 'Impressions', 'Clicks', 'Cost', 'Conversions', 'ConversionValue', 'CTR', 'AvgCPC', 'ConvRate', 'CostPerConv', 'SearchImprShare', 'SearchLostISBudget', 'SearchLostISRank', 'AvgPosition', 'UpdatedAt'];
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#1a73e8');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');
  var query = AdsApp.report('SELECT segments.date, campaign.name, campaign.id, campaign.status, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value, metrics.ctr, metrics.average_cpc, metrics.cost_per_conversion, metrics.search_impression_share, metrics.search_budget_lost_impression_share, metrics.search_rank_lost_impression_share FROM campaign WHERE segments.date DURING ' + CONFIG.DATE_RANGE + ' AND campaign.status != "REMOVED" ORDER BY segments.date DESC, campaign.name ASC');
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
    var ctr = impressions > 0 ? (clicks / impressions * 100) : 0;
    var avgCpc = clicks > 0 ? (cost / clicks) : 0;
    var convRate = clicks > 0 ? (conversions / clicks * 100) : 0;
    var costPerConv = conversions > 0 ? (cost / conversions) : 0;
    data.push([row['segments.date'], row['campaign.name'], row['campaign.id'], row['campaign.status'], impressions, clicks, Math.round(cost), conversions, convValue, parseFloat(ctr.toFixed(2)), Math.round(avgCpc), parseFloat(convRate.toFixed(2)), Math.round(costPerConv), row['metrics.search_impression_share'] || '', row['metrics.search_budget_lost_impression_share'] || '', row['metrics.search_rank_lost_impression_share'] || '', '', now]);
  }
  if (data.length > 0) { sheet.getRange(2, 1, data.length, data[0].length).setValues(data); }
  sheet.autoResizeColumns(1, headers.length);
  Logger.log('Exported ' + data.length + ' daily rows');
}

function exportSummary(sheet) {
  sheet.clear();
  var headers = ['CampaignName', 'Status', 'Budget', 'BiddingStrategy', 'TotalImpressions', 'TotalClicks', 'TotalCost', 'TotalConversions', 'AvgCTR', 'AvgCPC', 'AvgConvRate', 'AvgCPA', 'SearchImprShare', 'Days', 'UpdatedAt'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#1a73e8');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');
  var campaigns = AdsApp.campaigns().withCondition('campaign.status != "REMOVED"').forDateRange(CONFIG.DATE_RANGE).get();
  var data = [];
  var now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  while (campaigns.hasNext()) {
    var campaign = campaigns.next();
    var stats = campaign.getStatsFor(CONFIG.DATE_RANGE);
    var impressions = stats.getImpressions();
    var clicks = stats.getClicks();
    var cost = stats.getCost();
    var conversions = stats.getConversions();
    var ctr = impressions > 0 ? (clicks / impressions * 100) : 0;
    var avgCpc = clicks > 0 ? (cost / clicks) : 0;
    var convRate = clicks > 0 ? (conversions / clicks * 100) : 0;
    var cpa = conversions > 0 ? (cost / conversions) : 0;
    var budget = campaign.getBudget().getAmount();
    var biddingType = campaign.getBiddingStrategyType();
    data.push([campaign.getName(), campaign.isEnabled() ? 'ENABLED' : 'PAUSED', budget, biddingType, impressions, clicks, Math.round(cost), conversions, parseFloat(ctr.toFixed(2)), Math.round(avgCpc), parseFloat(convRate.toFixed(2)), Math.round(cpa), '', 30, now]);
  }
  if (data.length > 0) { sheet.getRange(2, 1, data.length, data[0].length).setValues(data); }
  sheet.autoResizeColumns(1, headers.length);
  Logger.log('Exported ' + data.length + ' campaign summaries');
}

=== BƯỚC 5: LƯU SCRIPT ===
1. Click nút "Save" hoặc "Lưu" (hoặc Ctrl+S / Cmd+S)

=== BƯỚC 6: AUTHORIZE ===
1. Click nút "Run" hoặc "Chạy" hoặc "Preview"
2. Sẽ có popup yêu cầu quyền truy cập Google Sheets → Click "Authorize" / "Cho phép"
3. Chọn tài khoản Google → Allow / Cho phép tất cả quyền
4. Script sẽ chạy → đợi cho đến khi hiện "Completed" hoặc "Hoàn tất"

=== BƯỚC 7: BẬT SCHEDULE ===
1. Sau khi chạy thành công, tìm nút "Schedule" hoặc "Lên lịch" hoặc biểu tượng đồng hồ
2. Bật schedule: Frequency = "Daily" / "Hàng ngày"
3. Time = khoảng 8:00 AM
4. Save schedule

QUAN TRỌNG: Sau khi xong tất cả, báo cho tôi biết kết quả (thành công hay lỗi gì).
```

---

# PROMPT: Publish Google Sheet to Web

> Paste vào Claude in Chrome sidebar, sau khi script đã chạy thành công
> Chuyển sang tab Google Sheet "Untitled spreadsheet"

```
Tôi cần bạn publish Google Sheet này ra web dạng CSV. Làm theo các bước:

1. Đổi tên sheet: click vào "Untitled spreadsheet" ở góc trên trái → đổi thành "MVT Campaign Data"
2. Publish to web: click menu File → "Chia sẻ" (Share) → "Xuất bản lên web" (Publish to web)
3. Trong popup:
   - Chọn "Toàn bộ tài liệu" (Entire document)
   - Format: chọn "Giá trị được phân tách bằng dấu phẩy (.csv)" hoặc "Comma-separated values (.csv)"
   - Click "Xuất bản" (Publish)
   - Xác nhận OK nếu có popup hỏi
4. Báo cho tôi biết đã xong.

LƯU Ý: Nếu menu hiện bằng tiếng Việt, tìm "Tệp" → "Chia sẻ" → "Xuất bản lên web"
```
