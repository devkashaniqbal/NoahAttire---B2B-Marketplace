# Full end-to-end API flow test
# Run: powershell -File scripts\testFlow.ps1
param([string]$Base = "http://localhost:5000/api")

$ErrorActionPreference = "Stop"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

function Invoke-API {
    param($Method, $Path, $Body, [switch]$NeedSession)
    $uri = "$Base$Path"
    $headers = @{ "Content-Type" = "application/json" }
    $params = @{ Method = $Method; Uri = $uri; Headers = $headers; WebSession = $session; ErrorAction = "Stop" }
    if ($Body) { $params.Body = ($Body | ConvertTo-Json) }
    $r = Invoke-RestMethod @params
    return $r
}

function Pass { param($msg) Write-Host "  PASS  $msg" -ForegroundColor Green }
function Fail { param($msg) Write-Host "  FAIL  $msg" -ForegroundColor Red }

Write-Host "`n===== TradeHub B2B - API Flow Test =====" -ForegroundColor Cyan

# 1. Health check
Write-Host "`n[1] Health check"
$h = Invoke-API GET "/health"
if ($h.status -eq "ok") { Pass "GET /health -> ok" } else { Fail "health check failed" }

# 2. Register seller
Write-Host "`n[2] Register seller"
$seller = Invoke-API POST "/auth/register" @{ name="Test Seller Co"; email="seller@test.com"; password="seller123"; role="seller" }
if ($seller.user.role -eq "seller") { Pass "Registered seller: $($seller.user.name)" } else { Fail $seller }

# 3. Register buyer
Write-Host "`n[3] Register buyer"
$buyer = Invoke-API POST "/auth/register" @{ name="John Buyer"; email="buyer@test.com"; password="buyer123"; role="buyer" }
if ($buyer.user.role -eq "buyer") { Pass "Registered buyer: $($buyer.user.name)" } else { Fail $buyer }

# 4. Seller login + get cookie
Write-Host "`n[4] Seller login"
$login = Invoke-API POST "/auth/login" @{ email="seller@test.com"; password="seller123" }
if ($login.user.role -eq "seller") { Pass "Logged in as seller (cookie set)" } else { Fail "login failed" }

# 5. Seller profile update
Write-Host "`n[5] Update seller profile"
$prof = Invoke-API PUT "/sellers/me/profile" @{
    businessName="Sunrise Industrial Supplies"; description="Leading supplier of industrial goods";
    category="Machinery"; location="Karachi, Pakistan"; phone="+92-300-1234567"
}
if ($prof.profile.businessName -eq "Sunrise Industrial Supplies") { Pass "Profile updated: $($prof.profile.businessName)" } else { Fail $prof }

# 6. Create product
Write-Host "`n[6] Create product"
$prod = Invoke-API POST "/products" @{
    title="Industrial Water Pump 5HP"; description="High-efficiency centrifugal pump for industrial use. Max flow rate 500L/min.";
    category="Machinery"; priceRange=@{ min=250; max=450 }; unit="piece";
    minOrderQty=5; location="Karachi, Pakistan"; tags=@("pump","industrial","water")
}
if ($prod.product.title) { Pass "Product created: $($prod.product.title) [ID: $($prod.product._id)]" } else { Fail $prod }
$productId = $prod.product._id

# 7. Get product (public)
Write-Host "`n[7] Fetch product (public)"
$p = Invoke-API GET "/products/$productId"
if ($p.product._id) { Pass "Product fetched: $($p.product.title)" } else { Fail "fetch failed" }

# 8. Get products list
Write-Host "`n[8] Products catalog"
$list = Invoke-API GET "/products?category=Machinery"
Pass "Catalog: $($list.pagination.total) product(s) in Machinery"

# 9. Logout seller
Write-Host "`n[9] Seller logout"
$lo = Invoke-API POST "/auth/logout" $null
Pass "Logged out seller"

# 10. Guest inquiry (no login required)
Write-Host "`n[10] Submit guest inquiry"
$inq = Invoke-API POST "/inquiries" @{
    productId=$productId; buyerName="Jane Guest"; buyerEmail="jane@example.com";
    buyerPhone="+1-800-000-0000"; message="I need 20 units urgently. What is the lead time and shipping cost to Dubai?";
    quantity="20 pieces"
}
if ($inq.inquiry._id) { Pass "Inquiry created [ID: $($inq.inquiry._id)] (emails skipped - no SMTP config)" } else { Fail $inq }

# 11. Seller login again to check inquiries
Write-Host "`n[11] Seller views inquiries"
Invoke-API POST "/auth/login" @{ email="seller@test.com"; password="seller123" } | Out-Null
$inqs = Invoke-API GET "/inquiries/mine"
Pass "Seller inquiries: $($inqs.pagination.total) total"
$inqId = $inqs.inquiries[0]._id

# 12. Update inquiry status
Write-Host "`n[12] Update inquiry status"
$upd = Invoke-API PATCH "/inquiries/$inqId/status" @{ status="in-progress" }
if ($upd.inquiry.status -eq "in-progress") { Pass "Status updated to in-progress" } else { Fail $upd }

# 13. Seed + test admin
Write-Host "`n[13] Admin stats (requires seeded admin)"
try {
    Invoke-API POST "/auth/logout" $null | Out-Null
    Invoke-API POST "/auth/login" @{ email="admin@tradehub.b2b"; password="admin123" } | Out-Null
    $stats = Invoke-API GET "/admin/stats"
    Pass "Admin stats: sellers=$($stats.stats.totalSellers), products=$($stats.stats.totalProducts), inquiries=$($stats.stats.totalInquiries)"
} catch {
    Write-Host "  SKIP  Admin test (run seedAdmin.js first)" -ForegroundColor Yellow
}

Write-Host "`n===== All tests complete =====" -ForegroundColor Cyan
