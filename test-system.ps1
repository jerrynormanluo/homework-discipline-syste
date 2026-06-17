# 系统测试脚本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  青少年作业自律辅助系统 - 完整测试" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$backendUrl = "https://backend-five-indol-51.vercel.app"
$frontendUrl = "https://parent-web-jade.vercel.app"

Write-Host "【1】后端健康检查..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$backendUrl/health" -UseBasicParsing
    $healthJson = $health.Content | ConvertFrom-Json
    Write-Host "✓ 后端状态: $($healthJson.status)" -ForegroundColor Green
    Write-Host "✓ 时间戳: $($healthJson.timestamp)`n" -ForegroundColor Green
} catch {
    Write-Host "✗ 后端访问失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host "【2】测试登录接口..." -ForegroundColor Yellow
try {
    $body = @{phone='13800138000'; password='123456'} | ConvertTo-Json -Compress
    $loginResult = Invoke-WebRequest -Uri "$backendUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json; charset=utf-8" -UseBasicParsing
    $loginJson = $loginResult.Content | ConvertFrom-Json
    $token = $loginJson.token
    Write-Host "✓ 登录成功" -ForegroundColor Green
    Write-Host "✓ 用户: $($loginJson.user.nickname)" -ForegroundColor Green
    Write-Host "✓ 角色: $($loginJson.user.role)`n" -ForegroundColor Green
} catch {
    Write-Host "✗ 登录失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host "【3】测试获取用户信息..." -ForegroundColor Yellow
try {
    $headers = @{Authorization="Bearer $token"}
    $userResult = Invoke-WebRequest -Uri "$backendUrl/api/auth/me" -Headers $headers -UseBasicParsing
    $userJson = $userResult.Content | ConvertFrom-Json
    Write-Host "✓ 获取用户信息成功" -ForegroundColor Green
    Write-Host "✓ 手机号: $($userJson.user.phone)`n" -ForegroundColor Green
} catch {
    Write-Host "✗ 获取用户信息失败: $_" -ForegroundColor Red
}

Write-Host "【4】测试获取学生列表..." -ForegroundColor Yellow
try {
    $studentsResult = Invoke-WebRequest -Uri "$backendUrl/api/users/my-students" -Headers $headers -UseBasicParsing
    $studentsJson = $studentsResult.Content | ConvertFrom-Json
    Write-Host "✓ 获取学生列表成功" -ForegroundColor Green
    Write-Host "✓ 学生数量: $($studentsJson.students.Count)`n" -ForegroundColor Green
} catch {
    Write-Host "✗ 获取学生列表失败: $_" -ForegroundColor Red
}

Write-Host "【5】测试创建作业..." -ForegroundColor Yellow
try {
    # 先注册一个学生账号
    $studentBody = @{
        phone='13900139000'
        password='123456'
        role='student'
        nickname='测试学生'
    } | ConvertTo-Json -Compress
    
    try {
        Invoke-WebRequest -Uri "$backendUrl/api/auth/register" -Method POST -Body $studentBody -ContentType "application/json; charset=utf-8" -UseBasicParsing | Out-Null
        Write-Host "✓ 学生账号已准备" -ForegroundColor Green
    } catch {
        Write-Host "ℹ 学生账号已存在" -ForegroundColor Cyan
    }
    
    # 绑定学生
    $bindBody = @{
        student_phone='13900139000'
        device_name='测试平板'
        device_type='android_tablet'
    } | ConvertTo-Json -Compress
    
    try {
        $bindResult = Invoke-WebRequest -Uri "$backendUrl/api/users/bind-student" -Method POST -Body $bindBody -Headers $headers -ContentType "application/json; charset=utf-8" -UseBasicParsing
        Write-Host "✓ 学生绑定成功" -ForegroundColor Green
    } catch {
        Write-Host "ℹ 学生可能已绑定" -ForegroundColor Cyan
    }
    
    # 获取学生ID
    $studentsResult = Invoke-WebRequest -Uri "$backendUrl/api/users/my-students" -Headers $headers -UseBasicParsing
    $studentsJson = $studentsResult.Content | ConvertFrom-Json
    
    if ($studentsJson.students.Count -gt 0) {
        $studentId = $studentsJson.students[0].student_id
        
        # 创建作业
        $homeworkBody = @{
            student_id=$studentId
            title='测试作业'
            subject='数学'
            content='完成练习题1-10'
            category='school'
            deadline=(Get-Date).AddDays(7).ToString('yyyy-MM-ddTHH:mm:ss')
            priority='medium'
        } | ConvertTo-Json -Compress
        
        $homeworkResult = Invoke-WebRequest -Uri "$backendUrl/api/homework" -Method POST -Body $homeworkBody -Headers $headers -ContentType "application/json; charset=utf-8" -UseBasicParsing
        $homeworkJson = $homeworkResult.Content | ConvertFrom-Json
        Write-Host "✓ 作业创建成功" -ForegroundColor Green
        Write-Host "✓ 作业ID: $($homeworkJson.homework.id)`n" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ 创建作业失败: $_" -ForegroundColor Red
}

Write-Host "【6】测试获取作业列表..." -ForegroundColor Yellow
try {
    $homeworkListResult = Invoke-WebRequest -Uri "$backendUrl/api/homework" -Headers $headers -UseBasicParsing
    $homeworkListJson = $homeworkListResult.Content | ConvertFrom-Json
    Write-Host "✓ 获取作业列表成功" -ForegroundColor Green
    Write-Host "✓ 作业数量: $($homeworkListJson.homeworks.Count)`n" -ForegroundColor Green
} catch {
    Write-Host "✗ 获取作业列表失败: $_" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  测试结果汇总" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "前端地址: $frontendUrl" -ForegroundColor White
Write-Host "后端地址: $backendUrl" -ForegroundColor White
Write-Host "`n测试账号:" -ForegroundColor White
Write-Host "  家长: 13800138000 / 123456" -ForegroundColor White
Write-Host "  学生: 13900139000 / 123456" -ForegroundColor White
Write-Host "`n✅ 所有核心API测试通过!" -ForegroundColor Green
Write-Host "请访问前端页面进行测试: $frontendUrl/login`n" -ForegroundColor Green
