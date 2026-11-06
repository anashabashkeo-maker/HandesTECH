param([string]$Model = 'gpt-5-mini')
$ErrorActionPreference = 'Stop'
$project = Join-Path $PSScriptRoot '../HandesTECH.csproj'
$secret = Read-Host 'OpenAI API key (hidden; saved to local .NET user secrets)' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
    $plainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    if ([string]::IsNullOrWhiteSpace($plainKey)) { throw 'No key entered. Configuration was not changed.' }
    # JSON via stdin keeps the key out of command arguments and PowerShell history.
    @{ 'ChatAI:Enabled' = 'true'; 'ChatAI:ApiKey' = $plainKey; 'ChatAI:Model' = $Model; 'ChatAI:DailyRequestLimit' = '50' } |
        ConvertTo-Json -Compress | dotnet user-secrets set --project $project
    if ($LASTEXITCODE -ne 0) { throw 'Could not save local AI configuration.' }
    Write-Host 'Local AI configuration saved. Restart HandesTECH in Visual Studio. API usage is billed by your provider.'
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    $plainKey = $null
    $secret.Dispose()
}
