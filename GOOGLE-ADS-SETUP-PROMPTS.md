# Google Ads Campaign Setup — Prompts cho Claude in Chrome Extension

> **Cách dùng:** Copy từng PROMPT bên dưới → Paste vào Claude in Chrome Extension → Để Claude thao tác trên browser.
> **Quan trọng:** Đảm bảo bạn đã đăng nhập sẵn vào Google Tag Manager và Google Ads trước khi paste prompt.

---

## PROMPT A: Verify & Complete GTM Tags Setup

> Paste prompt này khi bạn đã mở tab https://tagmanager.google.com/ và đang ở đúng container GTM-TPQWV864

```
Tôi cần bạn kiểm tra và setup đầy đủ các tags trong Google Tag Manager container GTM-TPQWV864 cho website escape.myvivatour.com.

Hãy vào trang Tags trong GTM workspace hiện tại và kiểm tra xem đã có những tags nào. Sau đó đảm bảo TẤT CẢ các tags sau đây tồn tại và cấu hình đúng. Nếu tag nào chưa có, hãy tạo mới.

=== TAG 1: GA4 Configuration ===
- Tag type: Google Analytics: GA4 Configuration
- Measurement ID: G-LKDCCNJMP3
- Trigger: All Pages (built-in)
- Tag name: "GA4 - Configuration"

=== TAG 2: Google Ads Conversion Tracking ===
- Tag type: Google Ads Conversion Tracking
- Conversion ID: AW-17709107883
- Conversion Label: Wq0ECKXBmfsbEKuVrvxB
- Conversion Value: 50 (currency AUD)
- Trigger: Custom Event trigger, event name = "form_success"
- Tag name: "Google Ads - Form Conversion"

Cách tạo trigger "form_success":
1. Vào Triggers > New
2. Trigger type: Custom Event
3. Event name: form_success (chính xác, phân biệt hoa thường)
4. Trigger name: "CE - Form Success"

=== TAG 3: Google Ads Remarketing ===
- Tag type: Google Ads Remarketing
- Conversion ID: AW-17709107883
- Trigger: All Pages (built-in)
- Tag name: "Google Ads - Remarketing"

=== TAG 4: GA4 Event - Generate Lead ===
- Tag type: Google Analytics: GA4 Event
- Configuration Tag: chọn "GA4 - Configuration" (tag 1)
- Event Name: generate_lead
- Trigger: "CE - Form Success" (trigger đã tạo ở tag 2)
- Tag name: "GA4 - Event - Generate Lead"

=== TAG 5: GA4 Event - CTA Click ===
- Tag type: Google Analytics: GA4 Event
- Configuration Tag: chọn "GA4 - Configuration"
- Event Name: cta_click
- Trigger: Custom Event trigger, event name = "cta_click"
- Tag name: "GA4 - Event - CTA Click"

Tạo trigger:
1. Triggers > New > Custom Event
2. Event name: cta_click
3. Trigger name: "CE - CTA Click"

=== TAG 6: GA4 Event - WhatsApp Click ===
- Tag type: Google Analytics: GA4 Event
- Configuration Tag: chọn "GA4 - Configuration"
- Event Name: whatsapp_click
- Trigger: Custom Event trigger, event name = "whatsapp_click"
- Tag name: "GA4 - Event - WhatsApp Click"

Tạo trigger:
1. Triggers > New > Custom Event
2. Event name: whatsapp_click
3. Trigger name: "CE - WhatsApp Click"

=== SAU KHI TẠO XONG TẤT CẢ ===
1. Vào Overview/Workspace để xem tổng số tags đã tạo
2. Click "Preview" để test với URL https://escape.myvivatour.com/
3. QUAN TRỌNG: Click "Submit" ở góc phải trên để publish workspace
   - Version Name: "Setup tracking tags for Google Ads campaign"
   - Click "Publish"

Hãy thực hiện từng bước một, kiểm tra kỹ từng tag trước khi chuyển sang tag tiếp theo.
```

---

## PROMPT B: Verify Google Ads Conversion Action

> Paste prompt này khi bạn đã mở tab https://ads.google.com/ và đang ở account 572-470-7852

```
Tôi cần bạn kiểm tra và cấu hình conversion action trong Google Ads account 572-470-7852 cho website escape.myvivatour.com.

=== BƯỚC 1: Kiểm tra Conversion Action ===
1. Click vào menu "Goals" (hoặc "Tools & Settings" > "Conversions") ở thanh bên trái hoặc menu trên
2. Click "Conversions" > "Summary"
3. Kiểm tra xem đã có conversion action nào chưa
4. Nếu đã có, click vào nó và verify các settings bên dưới
5. Nếu chưa có, click "+ New conversion action" để tạo mới

=== CẤU HÌNH CONVERSION ACTION ===
- Category: Lead > Submit lead form
- Conversion name: "Booking Inquiry - Escape Tour"
- Value: Use different values for each conversion, default = 50 AUD
- Count: Every (để build remarketing audience tốt hơn)
- Click-through conversion window: 30 days
- Engaged-view conversion window: 3 days
- View-through conversion window: 1 day
- Attribution model: Data-driven (recommended) hoặc Last click
- Enhanced conversions: Turn ON if available

=== BƯỚC 2: Verify Conversion Tag ===
Sau khi save conversion action, kiểm tra:
- Conversion ID phải là: AW-17709107883
- Conversion Label phải là: Wq0ECKXBmfsbEKuVrvxB
- Status nên hiện "Recording conversions" hoặc "No recent conversions" (bình thường nếu chưa có traffic)

Nếu conversion ID/label khác với trên, cho tôi biết giá trị hiện tại.

=== BƯỚC 3: Check Remarketing Audience ===
1. Vào "Tools" > "Audience manager" (hoặc Shared library > Audience manager)
2. Kiểm tra xem đã có audience "All visitors" hay "Website visitors" chưa
3. Nếu chưa có, tạo audience mới:
   - Click "+ " > "Website visitors"
   - Name: "All Website Visitors - 90 days"
   - Visited: escape.myvivatour.com
   - Membership duration: 90 days
   - Save

Hãy thực hiện từng bước và cho tôi biết kết quả.
```

---

## PROMPT C: Tạo Campaign 1 — High Intent Keywords

> Paste prompt này khi bạn đã ở Google Ads account 572-470-7852

```
Tôi cần bạn tạo Search Campaign mới trong Google Ads cho website escape.myvivatour.com. Đây là campaign chính nhắm vào người tìm kiếm có intent cao.

=== TẠO CAMPAIGN ===

1. Click "+ New campaign" (nút xanh hoặc "+" icon)
2. Campaign objective: "Leads"
3. Conversion goal: chọn "Booking Inquiry - Escape Tour" (conversion đã tạo)
4. Campaign type: "Search"
5. Bỏ chọn Display Network và Search Partners (chỉ giữ Google Search)
6. Click Continue

=== CAMPAIGN SETTINGS ===
- Campaign name: "MVT - High Intent - Vietnam Tour"
- Bidding: "Maximize clicks" với Maximum CPC bid limit = $5.00 AUD
  (Sau 2 tuần có data sẽ chuyển sang Maximize Conversions)
- Budget: $40 AUD per day
- Networks: Search Network ONLY (bỏ tick Display Network, bỏ tick Search Partners)

=== LOCATION TARGETING ===
- Target: Australia
- Location options: "Presence: People in or regularly in your targeted locations"
  (KHÔNG chọn "Presence or interest" — sẽ lãng phí budget)
- Language: English

=== AD GROUP 1: Vietnam Tour Package ===
- Ad group name: "Vietnam Tour Package"
- Keywords (copy paste toàn bộ danh sách sau, mỗi keyword một dòng):

"vietnam tour from australia"
"vietnam tour package australia"
"vietnam holiday package"
"all inclusive vietnam tour"
"10 day vietnam tour"
"book vietnam tour"
"vietnam tour 2026"
"vietnam group tour australia"
"vietnam tour with flights included"
"vietnam guided tour australia"

=== RESPONSIVE SEARCH AD cho Ad Group 1 ===
- Final URL: https://escape.myvivatour.com/
- Display path: escape.myvivatour.com / vietnam-tour

Headlines (nhập đúng 15 headlines, mỗi cái tối đa 30 ký tự):
1. 10-Day Vietnam Tour $2,099 AUD  [PIN to Position 1]
2. All-Inclusive Vietnam Holiday  [PIN to Position 2]
3. Flights + Hotels + Meals Incl.
4. Book Direct & Save — No Markup
5. Daily Departures Available
6. Ha Long Bay + Hoi An + Saigon
7. Trusted by 500+ Australians
8. Vietnam Tour from Sydney
9. Free Quote in 24 Hours
10. 4.9★ Rating — 127 Reviews
11. Local Vietnam Tour Operator
12. Hanoi to Ho Chi Minh City
13. Price Guaranteed — Book Now
14. Vietnam Expert Since 2015
15. Upgrade to 5-Star from $2,779

Descriptions (nhập đúng 4 descriptions, mỗi cái tối đa 90 ký tự):
1. Escape to Vietnam! 10-day all-inclusive tour from $2,099 AUD. Flights, hotels & meals included.
2. Visit Ha Long Bay, Hoi An, Hanoi & Saigon. Book direct with local operator — no middleman fees.
3. Rated 4.9/5 by 127+ travelers. Daily departures, flexible dates. Get your free quote today!
4. All-inclusive Vietnam tour for Australians. 4-star upgrade from $2,389. WhatsApp us for details.

=== AD GROUP 2: Vietnam Holiday Deal ===
- Ad group name: "Vietnam Holiday Deal"
- Keywords:

"cheap vietnam tour from australia"
"vietnam travel deal australia"
"affordable vietnam holiday"
"vietnam flights and hotel package"
"budget vietnam tour australia"
"best value vietnam tour"
"vietnam tour deal 2026"

- Tạo Responsive Search Ad mới cho ad group này (dùng cùng Final URL), thay đổi một số headlines:

Headlines:
1. Vietnam Tour from $2,099 AUD  [PIN to Position 1]
2. Best Value All-Inclusive Deal  [PIN to Position 2]
3. Flights + Hotels + Meals Incl.
4. Save — Book Direct, No Markup
5. Daily Departures Available
6. Ha Long Bay + Hoi An + Saigon
7. Trusted by 500+ Australians
8. Best Price Guaranteed
9. Free Quote in 24 Hours
10. 4.9★ Rating — 127 Reviews
11. No Hidden Fees or Surcharges
12. All-Inclusive Vietnam Holiday
13. Compare & Save on Vietnam Tour
14. Vietnam Expert Since 2015
15. Upgrade to 5-Star from $2,779

Descriptions:
1. Best value Vietnam tour from $2,099 AUD! All-inclusive with flights, 4-star hotels & daily meals.
2. Why pay more? Book direct with local Vietnam operator. Ha Long Bay, Hoi An, Saigon — all included.
3. Rated 4.9/5 by 127+ travelers. Daily departures, flexible dates. Get your free quote today!
4. Compare our price: $2,099 all-in vs $3,000+ with big agencies. Same destinations, better value.

=== NEGATIVE KEYWORDS (Campaign level) ===
Sau khi tạo xong campaign, vào Settings > Negative keywords > thêm danh sách sau:

free
DIY
backpacker
visa
job
immigration
war
news
map
weather
embassy
volunteer
teaching english
internship
expat

=== REVIEW & PUBLISH ===
1. Review toàn bộ campaign settings
2. Kiểm tra budget = $40/day, bidding = Maximize Clicks
3. Click "Publish Campaign" hoặc "Launch Campaign"

Hãy thực hiện từng bước một. Nếu gặp lỗi hay cần chọn option khác, cho tôi biết.
```

---

## PROMPT D: Tạo Campaign 2 — Destination Keywords

> Paste prompt này sau khi Campaign 1 đã tạo xong

```
Tôi cần bạn tạo thêm Search Campaign thứ 2 trong Google Ads cho escape.myvivatour.com. Campaign này nhắm vào người tìm kiếm theo điểm đến cụ thể ở Việt Nam.

=== TẠO CAMPAIGN ===
1. Click "+ New campaign"
2. Objective: "Leads"
3. Conversion goal: "Booking Inquiry - Escape Tour"
4. Campaign type: "Search"
5. Bỏ chọn Display Network và Search Partners

=== CAMPAIGN SETTINGS ===
- Campaign name: "MVT - Destination - Vietnam Places"
- Bidding: "Maximize clicks" với Maximum CPC = $4.00 AUD
- Budget: $25 AUD per day
- Networks: Search Network ONLY
- Target: Australia
- Location options: "Presence: People in or regularly in your targeted locations"
- Language: English

=== AD GROUP 1: Ha Long Bay ===
- Ad group name: "Ha Long Bay Tour"
- Keywords:

"ha long bay tour from australia"
"ha long bay cruise package"
"halong bay tour australia"
"overnight ha long bay cruise"
"ha long bay holiday"

- Responsive Search Ad:
  Final URL: https://escape.myvivatour.com/
  Display path: escape.myvivatour.com / halong-bay

  Headlines:
  1. Ha Long Bay Cruise Included  [PIN Position 1]
  2. 10-Day Vietnam Tour $2,099  [PIN Position 2]
  3. Overnight Cruise on Ha Long Bay
  4. Flights from Australia Included
  5. All-Inclusive Vietnam Package
  6. Book Direct — Local Operator
  7. Ha Long Bay + Hoi An + Saigon
  8. Daily Departures Available
  9. Free Quote in 24 Hours
  10. 4.9★ Rating — 127 Reviews
  11. Trusted by 500+ Australians
  12. Hotels + Meals + Guide Incl.
  13. Vietnam Expert Since 2015
  14. Upgrade to 5-Star Cruise
  15. See Ha Long Bay Your Way

  Descriptions:
  1. Cruise Ha Long Bay on our 10-day all-inclusive Vietnam tour from $2,099 AUD. Flights & hotels included.
  2. Overnight Ha Long Bay cruise plus Hanoi, Hoi An & Saigon. Book direct with local operator, save more.
  3. Rated 4.9/5 by 127+ travelers. Upgrade to 5-star cruise available. Get your free quote today!
  4. All-inclusive from Australia: flights, hotels, meals, guides, Ha Long Bay cruise — one simple price.

=== AD GROUP 2: Hoi An & Central Vietnam ===
- Ad group name: "Hoi An Tour"
- Keywords:

"hoi an tour package"
"hoi an vietnam tour australia"
"da nang hoi an tour"
"hoi an holiday package"
"central vietnam tour"

- Responsive Search Ad:
  Final URL: https://escape.myvivatour.com/
  Display path: escape.myvivatour.com / hoi-an

  Headlines:
  1. Explore Hoi An Ancient Town  [PIN Position 1]
  2. 10-Day Vietnam from $2,099  [PIN Position 2]
  3. Hoi An + Ha Long Bay + Saigon
  4. Flights from Australia Included
  5. All-Inclusive Vietnam Package
  6. Lantern-Lit Streets of Hoi An
  7. Book Direct — Save More
  8. Daily Departures Available
  9. Free Quote in 24 Hours
  10. 4.9★ Rating — 127 Reviews

  Descriptions:
  1. Walk through Hoi An's lantern-lit streets on our 10-day Vietnam tour. All-inclusive from $2,099 AUD.
  2. Hoi An, Hanoi, Ha Long Bay & Saigon in one trip. Flights, hotels, meals included. Book direct & save.
  3. Rated 4.9/5 by 127+ travelers. Flexible dates, daily departures. Get your free quote today!
  4. Local Vietnam tour operator since 2015. No middleman fees. Hoi An + 5 more destinations included.

=== AD GROUP 3: City-Based Targeting ===
- Ad group name: "Vietnam Tour by City"
- Keywords:

"vietnam tour from sydney"
"vietnam tour from melbourne"
"vietnam holiday from brisbane"
"vietnam tour from perth"
"vietnam package from adelaide"
"vietnam tour from gold coast"

- Responsive Search Ad:
  Final URL: https://escape.myvivatour.com/
  Display path: escape.myvivatour.com / australia

  Headlines:
  1. Vietnam Tour from Australia  [PIN Position 1]
  2. All-Inclusive from $2,099 AUD  [PIN Position 2]
  3. Flights from Your City Incl.
  4. 10 Days — 6 Destinations
  5. Ha Long Bay + Hoi An + Saigon
  6. Book Direct & Save
  7. Daily Departures Available
  8. Free Quote — Response in 24h
  9. Trusted by 500+ Australians
  10. 4.9★ — 127 Verified Reviews

  Descriptions:
  1. Fly from Sydney, Melbourne or Brisbane to Vietnam! 10-day all-inclusive tour from $2,099 AUD.
  2. Ha Long Bay, Hoi An, Hanoi & Saigon. Flights, hotels, meals & guide included. No hidden fees.
  3. Rated 4.9/5 by 127+ Australian travelers. Flexible dates available. Get your free quote now!
  4. Direct from local Vietnam operator — skip the middleman. Compare our $2,099 vs $3,000+ elsewhere.

=== NEGATIVE KEYWORDS (Campaign level) ===
Thêm cùng danh sách negative keywords như Campaign 1:

free
DIY
backpacker
visa
job
immigration
war
news
map
weather
embassy
volunteer
teaching english
internship
expat

=== REVIEW & PUBLISH ===
Review toàn bộ settings rồi publish campaign.

Hãy thực hiện từng bước một.
```

---

## PROMPT E: Thêm Ad Extensions (Assets) cho cả 2 Campaigns

> Paste prompt này sau khi đã tạo xong cả 2 campaigns

```
Tôi cần bạn thêm Ad Extensions (Assets) cho tất cả campaigns trong Google Ads account. Vào phần "Assets" hoặc "Ads & assets" > "Assets" trong menu bên trái.

=== 1. SITELINK EXTENSIONS ===
Click "+ " > "Sitelink" > Apply at Account level

Sitelink 1:
- Sitelink text: View Full Itinerary
- Description line 1: 10-day day-by-day plan
- Description line 2: Hanoi to Ho Chi Minh City
- Final URL: https://escape.myvivatour.com/#itinerary

Sitelink 2:
- Sitelink text: See Pricing & Packages
- Description line 1: From $2,099 AUD all-inclusive
- Description line 2: 4-star & 5-star upgrades
- Final URL: https://escape.myvivatour.com/#pricing

Sitelink 3:
- Sitelink text: Read Guest Reviews
- Description line 1: 4.9/5 average rating
- Description line 2: 127+ verified reviews
- Final URL: https://escape.myvivatour.com/#testimonials

Sitelink 4:
- Sitelink text: Get Free Quote Now
- Description line 1: Response within 24 hours
- Description line 2: No obligation inquiry
- Final URL: https://escape.myvivatour.com/#booking

=== 2. CALLOUT EXTENSIONS ===
Click "+ " > "Callout" > Apply at Account level

Thêm các callouts sau (mỗi cái là 1 callout riêng):
- All-Inclusive from $2,099
- Flights Included
- Daily Departures
- No Hidden Fees
- 24/7 WhatsApp Support
- Price Guarantee
- Local Vietnam Operator
- Free Quote in 24h

=== 3. STRUCTURED SNIPPET EXTENSIONS ===
Click "+ " > "Structured snippet" > Apply at Account level

Snippet 1:
- Header: Destinations
- Values: Hanoi, Ha Long Bay, Hoi An, Da Nang, Ho Chi Minh City, Mekong Delta

Snippet 2:
- Header: Amenities
- Values: Return Flights, Hotel Accommodation, Daily Meals, English Guide, Domestic Transfers

=== 4. PRICE EXTENSIONS ===
Click "+" > "Price" > Apply at Account level

- Type: Product
- Currency: AUD
- Price qualifier: From

Item 1:
- Header: Base Package
- Price: $2,099
- Description: 3-4 Star Hotels, Standard Cruise
- Final URL: https://escape.myvivatour.com/#pricing

Item 2:
- Header: Super 4-Star
- Price: $2,389
- Description: 4-Star Hotels, Standard Cruise
- Final URL: https://escape.myvivatour.com/#pricing

Item 3:
- Header: Luxury 5-Star
- Price: $2,779
- Description: 5-Star Hotels, 5-Star Cruise
- Final URL: https://escape.myvivatour.com/#pricing

Item 4:
- Header: Private Tour
- Price: $2,369
- Description: 3-4 Star, Private Guide
- Final URL: https://escape.myvivatour.com/#pricing

=== 5. CALL EXTENSION (optional) ===
Click "+" > "Call" > Account level
- Phone number: +84974036614
- Schedule: Chỉ hiển thị trong giờ business AEST (8am-8pm)

Sau khi thêm xong tất cả extensions, save và quay lại kiểm tra trong phần Assets xem tất cả đều hiện "Eligible" hoặc "Approved".

Hãy thực hiện từng extension một.
```

---

## PROMPT F: Thêm Observation Audiences

> Paste prompt này cuối cùng

```
Tôi cần bạn thêm Audience segments dạng "Observation" vào cả 2 campaigns trong Google Ads.

=== BƯỚC 1: Vào Campaign 1 "MVT - High Intent - Vietnam Tour" ===
1. Click vào campaign name
2. Tìm "Audiences" trong menu bên trái (hoặc Settings > Audiences)
3. Click "Edit audience segments"
4. Chọn mode: "Observation" (KHÔNG phải "Targeting" — observation chỉ thu thập data, không giới hạn reach)

=== BƯỚC 2: Thêm các audience segments ===
Tìm và thêm các segments sau:

In-market audiences:
- Trips to East & Southeast Asia
- Vacation Packages
- Travel (nếu có subcategory "Asia")
- Flights (hoặc Flights to Asia)
- Hotels & Accommodations

Affinity audiences:
- Travel Buffs
- Luxury Travelers
- Avid News Readers/Travel

Demographics (nếu có option):
- Age: 25-34, 35-44, 45-54, 55-64

Save.

=== BƯỚC 3: Lặp lại cho Campaign 2 "MVT - Destination - Vietnam Places" ===
Thêm cùng danh sách audiences trên cho campaign 2.

=== BƯỚC 4: Set Location Bid Adjustments ===
Với mỗi campaign:
1. Vào campaign > Locations
2. Tìm "Australia" > click vào xem breakdown theo state/city
3. Nếu có option, thêm bid adjustments:
   - New South Wales (Sydney): +15%
   - Victoria (Melbourne): +15%
   - Queensland (Brisbane): +10%

Nếu không thể set bid adjustments ở level city, bỏ qua bước này.

Hãy thực hiện từng bước.
```

---

## THỨ TỰ CHẠY CÁC PROMPTS

| # | Prompt | Đăng nhập sẵn vào | Thời gian ước tính |
|---|--------|-------------------|-------------------|
| 1 | **Prompt A** | tagmanager.google.com (container GTM-TPQWV864) | 15-20 phút |
| 2 | **Prompt B** | ads.google.com (account 572-470-7852) | 10 phút |
| 3 | **Prompt C** | ads.google.com | 30-40 phút |
| 4 | **Prompt D** | ads.google.com | 25-30 phút |
| 5 | **Prompt E** | ads.google.com | 15-20 phút |
| 6 | **Prompt F** | ads.google.com | 10-15 phút |

**Tổng: ~2-2.5 giờ**

## SAU KHI HOÀN THÀNH

### Verify Tracking (GTM Preview):
1. Vào tagmanager.google.com > Preview
2. Nhập URL: https://escape.myvivatour.com/
3. Check "Tags Fired" khi page load — GA4 Config + Remarketing phải fire
4. Fill form test > submit > check "Tags Fired" — Conversion + Lead tags phải fire

### Verify Google Ads:
1. Vào ads.google.com > Goals > Conversions
2. Status phải hiện "Recording" hoặc "No recent conversions" (ok nếu mới setup)
3. Kiểm tra cả 2 campaigns đều ở status "Eligible" hoặc "Active"

### Ngày hôm sau:
1. Kiểm tra impressions, clicks đã bắt đầu chưa
2. Vào Search Terms report — thêm negative keywords nếu thấy search terms không liên quan
3. Xem conversion tracking status — nên hiện "Recording conversions" sau 24-48h

---

## WEEKLY OPTIMIZATION (Copy vào calendar reminder)

**Mỗi 2 ngày (tuần đầu):**
- Kiểm tra Search Terms > thêm negative keywords
- Kiểm tra CTR từng keyword > pause keyword CTR < 1% sau 200+ impressions

**Tuần 2:**
- Pause keywords có 20+ clicks nhưng 0 conversions
- Tăng budget cho ad groups có conversions
- Test headline mới cho ads CTR thấp

**Tuần 3:**
- Nếu có 15+ conversions: đổi bidding sang "Maximize Conversions"
- Xem xét tạo thêm Campaign 3 (Competitor keywords) — xem file DOCX đã tạo

**Tuần 4+:**
- Nếu có 30+ conversions: đổi sang "Target CPA" = $20-25 AUD
- Tạo Campaign 4 (Remarketing) với display ads
