# Generates Android launcher icons for CiviSense AI from public/icon-512.png
# - Legacy ic_launcher.png / ic_launcher_round.png (48..192 px, full icon)
# - Adaptive ic_launcher_foreground.png (108..432 px canvas, icon at 72%, centered)
# - Updates values/ic_launcher_background.xml to the icon's background color
Add-Type -AssemblyName System.Drawing

$root = "c:\Users\DELL\Downloads\CiviSense-AI-Website-Requirements\civisense-ai"
$srcPath = Join-Path $root "public\icon-512.png"
$resDir = Join-Path $root "android\app\src\main\res"

$src = [System.Drawing.Image]::FromFile($srcPath)
$bmp = New-Object System.Drawing.Bitmap($src)

# Sample the icon background color near the top edge center (inside the rounded square)
$bg = $bmp.GetPixel([int]($bmp.Width / 2), [int]($bmp.Height * 0.08))
$bgHex = "#{0:X2}{1:X2}{2:X2}" -f $bg.R, $bg.G, $bg.B
Write-Host "Sampled icon background color: $bgHex"

function New-Graphics($image) {
    $g = [System.Drawing.Graphics]::FromImage($image)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    return $g
}

# Legacy launcher icons: full icon edge-to-edge (used on Android 7 and below)
$legacy = @{ 'mdpi' = 48; 'hdpi' = 72; 'xhdpi' = 96; 'xxhdpi' = 144; 'xxxhdpi' = 192 }
foreach ($d in $legacy.Keys) {
    $size = $legacy[$d]
    $dest = New-Object System.Drawing.Bitmap($size, $size)
    $g = New-Graphics $dest
    $g.DrawImage($bmp, 0, 0, $size, $size)
    foreach ($name in @('ic_launcher.png', 'ic_launcher_round.png')) {
        $target = Join-Path $resDir "mipmap-$d\$name"
        $dest.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host "Wrote $target ($size x $size)"
    }
    $g.Dispose(); $dest.Dispose()
}

# Adaptive icon foregrounds: icon at 72% of canvas, centered.
# The icon's own rounded corners (same blue as background) may be clipped by the
# launcher mask; the white glyph stays well inside the 66dp safe zone.
$adaptive = @{ 'mdpi' = 108; 'hdpi' = 162; 'xhdpi' = 216; 'xxhdpi' = 324; 'xxxhdpi' = 432 }
foreach ($d in $adaptive.Keys) {
    $canvas = $adaptive[$d]
    $iconSize = [int][Math]::Round($canvas * 0.72)
    $offset = [int](($canvas - $iconSize) / 2)
    $dest = New-Object System.Drawing.Bitmap($canvas, $canvas)
    $g = New-Graphics $dest
    $g.DrawImage($bmp, $offset, $offset, $iconSize, $iconSize)
    $target = Join-Path $resDir "mipmap-$d\ic_launcher_foreground.png"
    $dest.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Wrote $target ($canvas x $canvas canvas, icon $iconSize px)"
    $g.Dispose(); $dest.Dispose()
}

$bmp.Dispose(); $src.Dispose()

# Update the adaptive icon background color to match the icon
$bgFile = Join-Path $resDir "values\ic_launcher_background.xml"
$bgXml = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">$bgHex</color>
</resources>
"@
Set-Content -Path $bgFile -Value $bgXml -Encoding UTF8
Write-Host "Updated $bgFile with $bgHex"
Write-Host "DONE"
