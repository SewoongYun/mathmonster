# 작품 모으기.ps1
# 각 프로젝트의 '가장 최근 차수' 폴더를 works\ 안으로 복사합니다.
# 새 차수를 만들었으면 아래 $works 표의 원본 경로만 바꾼 뒤, 이 파일을 우클릭 → 'PowerShell에서 실행' 하세요.

$ErrorActionPreference = 'Stop'
$site = $PSScriptRoot
$root = Split-Path (Split-Path $site -Parent) -Parent   # ...클로드로 개발하기 (이 폴더는 포트폴리오 사이트N차 개발)
$apps = Join-Path $root '자체 개발 앱'

# 이름(works 안 폴더) = 원본(폴더 또는 html 파일 하나)
$works = [ordered]@{
  'prob-3d-textbook' = "$apps\확통 3D교과서\6. 확률과 통계 교과서 6차 개발"
  'acorn-forest'     = "$root\경제 수학\게임\6차 개발"
  'book-concept-map' = "$apps\책 개념 지도"
  'star-shard'       = "$apps\게임\별조각이야기.html"
  'exam-analysis'    = "$apps\기출 문제 분석하기\수1-2026 수능완성-26054-0024(완성본).html"
}

# 함께 올릴 덤 파일 (원본 → works 안 위치)
$extras = [ordered]@{
  "$root\경제 수학\게임\학습지_도토리숲_학생용.pdf"   = 'acorn-forest\학습지_학생용.pdf'
  "$root\경제 수학\게임\학습지_도토리숲_교사용정답.pdf" = 'acorn-forest\학습지_교사용정답.pdf'
}

# 카드 그림 (원본 → thumbs 안 이름)
$thumbs = [ordered]@{
  "$apps\게임\확통 방탈출\블로그 자료\00_대표이미지.jpg"                 = 'zvirus.jpg'
  "$apps\동아리 웹페이지 개발하기\outputs\closet-preview.png"             = 'closet.png'
  "$apps\책 개념 지도\books\how-to-lie-with-statistics\cover.jpg"        = 'book.jpg'
  "$apps\HABIT QUEST 앱\2026-10-10_21차\보스_후.png"                      = 'habit.png'
}

# 실행에 필요 없는 개발용 파일 (GitHub 웹 업로드는 한 번에 100개까지라 줄여 둠)
$skip = @('*.zip', '.claude', '.Rhistory', 'src', 'build.js', 'build.ps1', 'serve.js', 'test.js', 'README.md', 'CHANGELOG.md', '.gitignore')

$out = Join-Path $site 'works'
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory $out | Out-Null

foreach ($name in $works.Keys) {
  $src = $works[$name]
  $dst = Join-Path $out $name
  New-Item -ItemType Directory $dst | Out-Null
  if ((Get-Item -LiteralPath $src).PSIsContainer) {
    Get-ChildItem -LiteralPath $src -Force | Where-Object {
      $n = $_.Name; -not ($skip | Where-Object { $n -like $_ })
    } | Copy-Item -Destination $dst -Recurse -Force
  } else {
    Copy-Item -LiteralPath $src -Destination (Join-Path $dst 'index.html')
  }
  Write-Host "복사함  works\$name"
}

foreach ($src in $extras.Keys) {
  Copy-Item -LiteralPath $src -Destination (Join-Path $out $extras[$src])
}

$t = Join-Path $site 'thumbs'
New-Item -ItemType Directory $t -Force | Out-Null
foreach ($src in $thumbs.Keys) {
  Copy-Item -LiteralPath $src -Destination (Join-Path $t $thumbs[$src]) -Force
}

Write-Host ''
Write-Host '끝! 이제 포트폴리오 사이트 폴더 안의 내용을 GitHub 저장소에 올리면 됩니다.'
