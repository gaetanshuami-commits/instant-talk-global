$ErrorActionPreference = "Continue"

Set-Location "$HOME\instant-talk-global"

$pathRoom = "src\app\room\[roomId]\RoomClient.tsx"

Write-Host ""
Write-Host "================ ANALYSE CAMERA ROOMCLIENT ================" -ForegroundColor Cyan
Write-Host "Fichier cible : $pathRoom" -ForegroundColor Gray
Write-Host ""

if (-not (Test-Path -LiteralPath $pathRoom)) {
    Write-Host "ERREUR : fichier introuvable." -ForegroundColor Red
    return
}

$content = Get-Content -LiteralPath $pathRoom -Raw
$lines = Get-Content -LiteralPath $pathRoom

function Count-Pattern {
    param(
        [string]$Label,
        [string]$Pattern
    )

    $count = ([regex]::Matches(
        $content,
        $Pattern,
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )).Count

    Write-Host ($Label + " => " + $count)
}

function Show-Context {
    param(
        [string]$Label,
        [string]$Pattern,
        [int]$Context = 4
    )

    Write-Host ""
    Write-Host ("---- " + $Label + " ----") -ForegroundColor Yellow

    $matches = Select-String -LiteralPath $pathRoom -Pattern $Pattern -CaseSensitive:$false

    if (-not $matches) {
        Write-Host "AUCUNE OCCURRENCE" -ForegroundColor DarkYellow
        return
    }

    foreach ($m in $matches) {
        $start = [Math]::Max(0, $m.LineNumber - $Context - 1)
        $end = [Math]::Min($lines.Count - 1, $m.LineNumber + $Context - 1)

        Write-Host ""
        Write-Host ("Occurrence ligne " + $m.LineNumber) -ForegroundColor Green

        for ($i = $start; $i -le $end; $i++) {
            $num = ($i + 1).ToString().PadLeft(4, ' ')
            Write-Host ($num + " | " + $lines[$i])
        }
    }
}

Write-Host "============== COMPTEURS ==============" -ForegroundColor Cyan
Count-Pattern "user-published" 'user-published'
Count-Pattern "setUsers(" 'setUsers\s*\('
Count-Pattern "client.join(" 'client\.join\s*\('
Count-Pattern "client.publish(" 'client\.publish\s*\('
Count-Pattern "createMicrophoneAndCameraTracks(" 'createMicrophoneAndCameraTracks\s*\('
Count-Pattern ".play(" '\.play\s*\('
Count-Pattern "scaleX(-1)" 'scaleX\(-1\)'
Count-Pattern "ignore local uid" 'user\.uid\s*===\s*uid|user\.uid\s*===\s*localUidRef\.current|user\.uid\s*===\s*client\.uid'
Count-Pattern "Map / playedContainersRef" 'playedContainersRef|Map<|new Map'
Count-Pattern "cleanup video stop" 'videoTrack\?\.stop\(\)|videoTrack\.stop\(\)|innerHTML\s*=\s*""'

Write-Host ""
Write-Host "============== CONTEXTES CRITIQUES ==============" -ForegroundColor Cyan
Show-Context "Handler user-published" 'user-published'
Show-Context "Ajout local setUsers" 'setUsers\s*\('
Show-Context "Join Agora" 'client\.join\s*\('
Show-Context "Publish local tracks" 'client\.publish\s*\('
Show-Context "Création tracks" 'createMicrophoneAndCameraTracks\s*\('
Show-Context "Play video" '\.play\s*\('
Show-Context "Effet miroir" 'scaleX\(-1\)|transform'
Show-Context "Suppression users" 'filter\s*\(.*uid'
Show-Context "Protection anti-doublon local" 'user\.uid\s*===\s*uid|user\.uid\s*===\s*localUidRef\.current|user\.uid\s*===\s*client\.uid'
Show-Context "Nettoyage conteneur video" 'innerHTML\s*=\s*""|videoTrack\?\.stop\(\)|videoTrack\.stop\(\)'

Write-Host ""
Write-Host "============== DIAGNOSTIC AUTOMATIQUE ==============" -ForegroundColor Cyan

$joinCount = ([regex]::Matches($content, 'client\.join\s*\(', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
$publishCount = ([regex]::Matches($content, 'client\.publish\s*\(', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
$createTracksCount = ([regex]::Matches($content, 'createMicrophoneAndCameraTracks\s*\(', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
$playCount = ([regex]::Matches($content, '\.play\s*\(', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
$mirrorCount = ([regex]::Matches($content, 'scaleX\(-1\)', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
$ignoreLocalCount = ([regex]::Matches($content, 'user\.uid\s*===\s*uid|user\.uid\s*===\s*localUidRef\.current|user\.uid\s*===\s*client\.uid', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count

if ($content -match 'setUsers\s*\(\s*\[\s*\{[\s\S]*?isLocal\s*:\s*true') {
    Write-Host "OK -> utilisateur local ajoute manuellement" -ForegroundColor Green
} else {
    Write-Host "ALERTE -> utilisateur local non detecte clairement" -ForegroundColor Red
}

if ($ignoreLocalCount -gt 0) {
    Write-Host "OK -> protection anti-doublon local detectee" -ForegroundColor Green
} else {
    Write-Host "ALERTE -> aucune protection anti-doublon local detectee" -ForegroundColor Red
}

if ($joinCount -eq 1) {
    Write-Host "OK -> un seul client.join detecte" -ForegroundColor Green
} elseif ($joinCount -eq 0) {
    Write-Host "ALERTE -> aucun client.join detecte" -ForegroundColor Red
} else {
    Write-Host "ALERTE -> plusieurs client.join detectes" -ForegroundColor Red
}

if ($publishCount -eq 1) {
    Write-Host "OK -> un seul client.publish detecte" -ForegroundColor Green
} elseif ($publishCount -eq 0) {
    Write-Host "ALERTE -> aucun client.publish detecte" -ForegroundColor Red
} else {
    Write-Host "ALERTE -> plusieurs client.publish detectes" -ForegroundColor Red
}

if ($createTracksCount -eq 1) {
    Write-Host "OK -> une seule creation de tracks detectee" -ForegroundColor Green
} elseif ($createTracksCount -eq 0) {
    Write-Host "ALERTE -> aucune creation de tracks detectee" -ForegroundColor Red
} else {
    Write-Host "ALERTE -> plusieurs creations de tracks detectees" -ForegroundColor Red
}

if ($mirrorCount -gt 0) {
    Write-Host "OK -> effet miroir detecte dans le code" -ForegroundColor Green
} else {
    Write-Host "ALERTE -> aucun effet miroir detecte" -ForegroundColor Red
}

if ($playCount -ge 2) {
    Write-Host "INFO -> plusieurs appels .play() detectes ; un pour audio distant + un pour video est normal" -ForegroundColor Yellow
} else {
    Write-Host "INFO -> nombre faible d'appels .play() detecte" -ForegroundColor Yellow
}

if ($content -match 'ref=\{\(el\)\s*=>[\s\S]*?videoTrack\.play\(el\)') {
    Write-Host "ALERTE POSSIBLE -> videoTrack.play(el) est lance dans un ref React ; cela peut provoquer un double rendu visuel" -ForegroundColor Red
} else {
    Write-Host "OK -> videoTrack.play(el) dans ref React non detecte" -ForegroundColor Green
}

if ($content -match 'el\.innerHTML\s*=\s*""') {
    Write-Host "OK -> nettoyage du conteneur video detecte" -ForegroundColor Green
} else {
    Write-Host "ALERTE -> aucun nettoyage explicite du conteneur video detecte" -ForegroundColor Red
}

if ($content -match 'playedContainersRef|new Map') {
    Write-Host "OK -> mecanisme de memo des conteneurs video detecte" -ForegroundColor Green
} else {
    Write-Host "ALERTE -> aucun mecanisme de memo des conteneurs video detecte" -ForegroundColor Red
}

Write-Host ""
Write-Host "================ FIN ANALYSE ================" -ForegroundColor Cyan