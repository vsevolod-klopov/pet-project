/**
 * ПРИМЕРЫ ЗАПРОСОВ ДЛЯ ТЕСТИРОВАНИЯ API
 * 
 * Используйте эти примеры в:
 * - Postman
 * - curl
 * - VS Code REST Client
 * - Thunder Client
 */

// ============================================
// РЕГИСТРАЦИЯ
// ============================================

// POST /auth/register
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "vsevolod_klopov+test@icloud.com",
  "name": "Vsevolod",
  "passwordHash": "9b71d224bd62f3785d96f46e3e6a6671b3c0b96e4df62733fa47e7f2609c6867"
}

// Response 201:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "vsevolod_klopov+test@icloud.com",
    "name": "Vsevolod",
    "createdAt": "2026-04-17T10:30:00Z"
  }
}

// Response 409 (уже существует):
{
  "message": "User with this email already exists"
}

// ============================================
// ВХОД
// ============================================

// POST /auth/login
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "vsevolod_klopov+test@icloud.com",
  "passwordHash": "9b71d224bd62f3785d96f46e3e6a6671b3c0b96e4df62733fa47e7f2609c6867"
}

// Response 200:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "vsevolod_klopov+test@icloud.com",
    "name": "Vsevolod",
    "createdAt": "2026-04-17T10:30:00Z"
  }
}

// Response 401 (неверные учетные данные):
{
  "message": "Invalid email or password"
}

// Response 404 (пользователь не найден):
{
  "message": "User not found"
}

// ============================================
// ОБНОВЛЕНИЕ ТОКЕНА
// ============================================

// POST /auth/refresh
POST http://localhost:3000/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InZzZXZvbG9kX2tsb3BvdkBpY2xvdWQuY29tIiwidXNlcklkIjoxLCJpYXQiOjE3NzYzMzEzNjMsImV4cCI6MTc3ODkyMzM2M30.ybr8Ksx3y6gC1kuB8WF44VE5p1JqxFGj8gaGB2U4q04"
}

// Response 200:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Response 401 (refresh токен истек):
{
  "message": "Token expired"
}

// Response 400 (невалидный токен):
{
  "message": "Invalid token"
}

// ============================================
// ЗАЩИЩЕННЫЕ ЗАПРОСЫ (примеры)
// ============================================

// GET /api/user/profile
GET http://localhost:3000/api/user/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Response 200:
{
  "id": 1,
  "email": "vsevolod_klopov+test@icloud.com",
  "name": "Vsevolod",
  "createdAt": "2026-04-17T10:30:00Z"
}

// Response 401 (токен невалидный или истек):
{
  "message": "Unauthorized"
}

// ============================================
// ГЕНЕРИРОВАНИЕ SHA-256 ХЕШЕЙ ДЛЯ ТЕСТИРОВАНИЯ
// ============================================

/*
JavaScript (в браузере):
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

hashPassword('test123').then(console.log);
// → 9b71d224bd62f3785d96f46e3e6a6671b3c0b96e4df62733fa47e7f2609c6867

JavaScript (Node.js):
const crypto = require('crypto');
const hash = crypto.createHash('sha256').update('test123').digest('hex');
console.log(hash);
// → 9b71d224bd62f3785d96f46e3e6a6671b3c0b96e4df62733fa47e7f2609c6867

Python:
import hashlib
password = 'test123'
hash_object = hashlib.sha256(password.encode())
print(hash_object.hexdigest())
# → 9b71d224bd62f3785d96f46e3e6a6671b3c0b96e4df62733fa47e7f2609c6867

Linux/Mac (openssl):
echo -n "test123" | openssl dgst -sha256
# → 9b71d224bd62f3785d96f46e3e6a6671b3c0b96e4df62733fa47e7f2609c6867
*/

// ============================================
// CURL ПРИМЕРЫ
// ============================================

/**
Регистрация:
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "passwordHash": "9b71d224bd62f3785d96f46e3e6a6671b3c0b96e4df62733fa47e7f2609c6867"
  }'

Вход:
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "passwordHash": "9b71d224bd62f3785d96f46e3e6a6671b3c0b96e4df62733fa47e7f2609c6867"
  }'

Обновление токена:
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGc..."
  }'

Защищенный запрос:
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer eyJhbGc..."
*/

// ============================================
// ПОСТМАН (Postman) КОЛЛЕКЦИЯ
// ============================================

/**
{
  "info": {
    "name": "Auth API",
    "_postman_id": "auth-api",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Register",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/auth/register",
        "header": {
          "Content-Type": "application/json"
        },
        "body": {
          "raw": "{\n  \"email\": \"test@example.com\",\n  \"name\": \"Test User\",\n  \"passwordHash\": \"9b71d224bd62f3785d96f46e3e6a6671b3c0b96e4df62733fa47e7f2609c6867\"\n}"
        }
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/auth/login",
        "header": {
          "Content-Type": "application/json"
        },
        "body": {
          "raw": "{\n  \"email\": \"test@example.com\",\n  \"passwordHash\": \"9b71d224bd62f3785d96f46e3e6a6671b3c0b96e4df62733fa47e7f2609c6867\"\n}"
        }
      }
    },
    {
      "name": "Refresh Token",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/auth/refresh",
        "header": {
          "Content-Type": "application/json"
        },
        "body": {
          "raw": "{\n  \"refreshToken\": \"{{refreshToken}}\"\n}"
        }
      }
    }
  ]
}
*/

// ============================================
// VS CODE REST CLIENT (.rest файл)
// ============================================

/**
@baseUrl = http://localhost:3000
@accessToken = 
@refreshToken = 

### Регистрация
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "name": "Test User",
  "passwordHash": "9b71d224bd62f3785d96f46e3e6a6671b3c0b96e4df62733fa47e7f2609c6867"
}

### Вход
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "passwordHash": "9b71d224bd62f3785d96f46e3e6a6671b3c0b96e4df62733fa47e7f2609c6867"
}

### Обновление токена
POST {{baseUrl}}/auth/refresh
Content-Type: application/json

{
  "refreshToken": "{{refreshToken}}"
}

### Получить профиль
GET {{baseUrl}}/api/user/profile
Authorization: Bearer {{accessToken}}
*/
