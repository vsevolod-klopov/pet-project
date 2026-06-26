# Система авторизации и регистрации

## Описание

Полнофункциональная система авторизации и регистрации с хранением `access` и `refresh` токенов в `localStorage`. Поддерживает хеширование пароля на клиенте перед отправкой на сервер.

## Файлы проекта

### 1. **config.js**
Содержит конфигурацию API:
- `API_CONFIG.baseURL` - адрес сервера (по умолчанию `http://localhost:3000`)
- `API_CONFIG.endpoints` - endpoints для авторизации
- `STORAGE_KEYS` - ключи для хранения данных в `localStorage`

### 2. **auth.js**
Основной модуль авторизации с функциями:

#### `hashPassword(password)`
Хеширует пароль используя SHA-256 и возвращает hex-строку.
```javascript
const hash = await hashPassword('myPassword123');
```

#### `register(email, name, password)`
Регистрирует нового пользователя.
```javascript
const result = await register('user@example.com', 'John Doe', 'password123');
// Результат содержит: { accessToken, refreshToken, user }
```

#### `login(email, password)`
Осуществляет вход пользователя.
```javascript
const result = await login('user@example.com', 'password123');
// Результат содержит: { accessToken, refreshToken, user }
```

#### `refreshToken()`
Обновляет access токен используя refresh токен.
```javascript
const newTokens = await refreshToken();
```

#### `isAuthenticated()`
Проверяет авторизован ли пользователь.
```javascript
if (isAuthenticated()) {
  // Пользователь авторизован
}
```

#### `getAccessToken()`
Получает текущий access токен.
```javascript
const token = getAccessToken();
```

#### `getUser()`
Получает данные текущего пользователя.
```javascript
const user = getUser();
console.log(user.email, user.name);
```

#### `logout()`
Осуществляет выход (очищает токены и перенаправляет на login.html).
```javascript
logout();
```

#### `authenticatedFetch(url, options)`
Выполняет fetch запрос с автоматическим добавлением Authorization заголовка и обновлением токена при необходимости.
```javascript
const response = await authenticatedFetch('http://localhost:3000/api/data');
const data = await response.json();
```

## Использование в HTML

Все файлы должны подключать скрипты в следующем порядке:

```html
<script src="config.js"></script>
<script src="auth.js"></script>
<script src="data.js"></script>
<script src="app.js"></script>
```

## API Endpoints

### Регистрация
```
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "passwordHash": "abc123def456..." // SHA-256 hash
}

Response:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Вход
```
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "passwordHash": "abc123def456..." // SHA-256 hash
}

Response:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Обновление токена
```
POST http://localhost:3000/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

## Хранение данных

Все данные хранятся в `localStorage`:
- `auth_access_token` - access токен
- `auth_refresh_token` - refresh токен
- `auth_user` - данные пользователя (JSON)

## Безопасность

⚠️ **Важно:**
- Пароль хешируется на клиенте перед отправкой на сервер
- Никогда не отправляйте пароль в открытом виде
- Access токены должны иметь короткое время жизни
- Используйте HTTPS в production

## Примеры использования

### Страница входа (login.html)
Автоматически обрабатывает форму входа и лог­ину пользователя. При успешной авторизации перенаправляет на `index.html`.

### Страница регистрации (register.html)
Обрабатывает форму регистрации с валидацией:
- Имя минимум 2 символа
- Email в формате `user@example.com`
- Пароль минимум 6 символов
- Пароли должны совпадать

### Защищенные запросы
```javascript
// Пример запроса к защищенному API endpoint
async function getUserData() {
  try {
    const response = await authenticatedFetch(
      'http://localhost:3000/api/user/data'
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Редирект неавторизованных пользователей
```javascript
// В начале защищенных страниц
<script>
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
  }
</script>
```

## Изменение URL сервера

Чтобы изменить адрес API сервера, отредактируйте `config.js`:

```javascript
const API_CONFIG = {
  baseURL: 'http://your-api-server.com:3000',
  // ...
};
```

## Решение проблем

### "Не удалось подключиться к серверу"
- Убедитесь что API сервер запущен
- Проверьте что сервер слушает на `http://localhost:3000`
- Проверьте CORS настройки на сервере

### "Неверный email или пароль"
- Проверьте что вы используете правильный email
- Проверьте что пароль введен правильно

### Токен не обновляется
- Убедитесь что в `localStorage` хранится `refresh token`
- Проверьте что refresh token еще не истек
- Проверьте логи сервера
