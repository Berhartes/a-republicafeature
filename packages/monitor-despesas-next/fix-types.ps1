# Script para corrigir erros de tipo TypeScript

$file = "src\app\gastos\actions\data-actions.ts"
$content = Get-Content $file -Raw

# Corrigir NodeJS.ErrnoException (adicionar type assertion inline)
$content = $content -replace 'as NodeJS\.ErrnoException', 'as { code?: string }'

# Corrigir parâmetros implícitos 'any'
$content = $content -replace '\.find\(dep =>', '.find((dep: DeputyRecord) =>'
$content = $content -replace '\.filter\(dep =>', '.filter((dep: DeputyRecord) =>'
$content = $content -replace '\(acc, dep\) =>', '(acc: number, dep: DeputyRecord) =>'
$content = $content -replace '\(acc, value\) =>', '(acc: number, value: unknown) =>'
$content = $content -replace '\.map\(f =>', '.map((f: any) =>'
$content = $content -replace '\.filter\(fornecedor =>', '.filter((fornecedor: any) =>'
$content = $content -replace '\.some\(cat =>', '.some((cat: any) =>'
$content = $content -replace '\.sort\(\(a, b\) =>', '.sort((a: any, b: any) =>'
$content = $content -replace '\.filter\(f =>', '.filter((f: any) =>'
$content = $content -replace '\.reduce\(\(acc, f\) =>', '.reduce((acc: number, f: any) =>'
$content = $content -replace '\.forEach\(fornecedor =>', '.forEach((fornecedor: any) =>'
$content = $content -replace '\.forEach\(cat =>', '.forEach((cat: any) =>'
$content = $content -replace '\.forEach\(registro =>', '.forEach((registro: any) =>'
$content = $content -replace '\.find\(registro =>', '.find((registro: any) =>'

Set-Content $file $content

Write-Host "✅ Tipos corrigidos em data-actions.ts"
