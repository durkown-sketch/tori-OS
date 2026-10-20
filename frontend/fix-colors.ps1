$files = Get-ChildItem -Path 'c:\Users\beaudry\Desktop\KKLAB\Tori-OS\frontend\src' -Include '*.tsx','*.ts' -Recurse

foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    $orig = $content

    # Font replacements
    $content = $content.Replace("'Playfair Display', Georgia, serif", "'Cinzel', 'Times New Roman', serif")

    # Old navy/green/gold -> Columbia brand blues
    $content = $content.Replace('#1D2D4E', '#000D74')
    $content = $content.Replace('#141E33', '#000A5E')
    $content = $content.Replace('#5A832F', '#0038A8')
    $content = $content.Replace('#4A6E25', '#002D8A')
    $content = $content.Replace('#6B9A38', '#0046CC')
    $content = $content.Replace('#1D6FBC', '#0038A8')
    $content = $content.Replace('#D4A843', '#B9D9EB')
    $content = $content.Replace('#E8C864', '#C8E2F0')

    if ($content -ne $orig) {
        Set-Content $f.FullName $content -NoNewline
        Write-Output "Updated: $($f.Name)"
    }
}

Write-Output "Done!"
