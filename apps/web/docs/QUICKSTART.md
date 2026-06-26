# 🚀 Система авторизации - Краткое руководство

## Что было создано

✅ **config.js** - Конфигурация API  
✅ **auth.js** - Полный модуль авторизации с хешированием пароля  
✅ **login.html** - Страница входа с обработкой формы  
✅ **register.html** - Страница регистрации с валидацией  
✅ **styles.css** - Обновлены стили для сообщений об ошибках  

## Ключевые особенности

### 🔐 Безопасность
- **SHA-256 хеширование** пароля на клиенте перед отправкой
- **Refresh Token** для обновления access токена
- **LocalStorage** для хранения токенов
- **Автоматическое обновление** токена при 401 ошибке

### 📝 Функционал
- Регистрация с валидацией (имя, email, пароль)
- Вход по email и пароль-хешу
- Хранение access и refresh токенов
- Проверка авторизации на защищенных страницах
- API запросы с автоматическим добавлением Authorization заголовка

## Быстрый старт

### 1. Измените URL API (если нужно)

Откройте **config.js** и измените:

```javascript
const API_CONFIG = {
  baseURL: 'http://localhost:3000',  // ← Изменить здесь если нужно
  // ...
};
```

### 2. Смотрите примеры использования

На других страницах используйте **auth-examples.js** как справочник.

### 3. Интегрируйте авторизацию

На защищенной странице добавьте:

```html
<script src="config.js"></script>
<script src="auth.js"></script>
<script>
  // Перенаправляем неавторизованных пользователей
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
  }
</script>
```

### 4. Используйте защищенные запросы

```javascript
// Запрос к защищенному API
const response = await authenticatedFetch('http://localhost:3000/api/data');
const data = await response.json();
```

## API Endpoints

### Регистрация
```
POST http://localhost:3000/auth/register
{
  "email": "user@example.com",
  "name": "John Doe",
  "passwordHash": "SHA256_HASH"
}
```

### Вход
```
POST http://localhost:3000/auth/login
{
  "email": "user@example.com",
  "passwordHash": "SHA256_HASH"
}
```

### Обновление токена
```
POST http://localhost:3000/auth/refresh
{
  "refreshToken": "TOKEN"
}
```

## Функции модуля auth.js

| Функция | Описание |
|---------|---------|
| `hashPassword(password)` | Хеширует пароль SHA-256 |
| `register(email, name, password)` | Регистрирует нового пользователя |
| `login(email, password)` | Осуществляет вход |
| `refreshToken()` | Обновляет access токен |
| `isAuthenticated()` | Проверяет авторизацию |
| `getAccessToken()` | Получает access токен |
| `getUser()` | Получает данные пользователя |
| `logout()` | Выход из системы |
| `authenticatedFetch(url, options)` | Fetch с автоматическим Authorization |

## Хранение данных в localStorage

```javascript
localStorage.getItem('auth_access_token')   // Access токен
localStorage.getItem('auth_refresh_token')  // Refresh токен
localStorage.getItem('auth_user')           // Данные пользователя (JSON)
```

## Обработка ошибок

Все функции авторизации выбрасывают ошибки с информацией:

```javascript
try {
  await login(email, password);
} catch (error) {
  console.log(error.status);      // HTTP статус (401, 404, 500)
  console.log(error.message);     // Сообщение ошибки
  console.log(error.data);        // Данные с сервера
}
```

## Примеры

### Показать информацию о пользователе

```javascript
const user = getUser();
console.log(user.name);   // Имя пользователя
console.log(user.email);  // Email пользователя
console.log(user.id);     // ID пользователя
```

### Защищенный запрос к API

```javascript
async function getMyWishlist() {
  try {
    const response = await authenticatedFetch(
      'http://localhost:3000/api/wishlist'
    );
    return await response.json();
  } catch (error) {
    console.error('Failed:', error);
  }
}
```

### Условное отображение UI

```html
<!-- Видно только авторизованным пользователям -->
<div id="auth-content" style="display: none;">
  Привет, <span id="user-name"></span>!
</div>

<script>
  if (isAuthenticated()) {
    const user = getUser();
    document.getElementById('auth-content').style.display = 'block';
    document.getElementById('user-name').textContent = user.name;
  }
</script>
```

## Тестирование

1. Откройте browser DevTools (F12)
2. Перейдите на `register.html`
3. Заполните форму и нажмите "Зарегистрироваться"
4. Проверьте localStorage:
   ```javascript
   // В консоли браузера:
   localStorage.getItem('auth_access_token')
   localStorage.getItem('auth_refresh_token')
   localStorage.getItem('auth_user')
   ```

## Проблемы и решения

### "Не удалось подключиться к серверу"
- Убедитесь что API сервер запущен на `http://localhost:3000`
- Проверьте CORS в конфиге сервера

### Токен не сохраняется
- Проверьте что localStorage не отключен
- Проверьте консоль браузера на ошибки

### Пароль отправляется в открытом виде
- Используйте HTTPS в production!
- Хеширование на клиенте это не замена для HTTPS

## Файлы для изучения

1. **AUTH_README.md** - Полная документация
2. **auth-examples.js** - Примеры использования
3. **config.js** - Конфигурация
4. **auth.js** - Исходный код модуля
