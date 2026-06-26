/**
 * ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ АВТОРИЗАЦИИ НА ДРУГИХ СТРАНИЦАХ
 * Используйте эти примеры для интеграции авторизации в остальные части приложения
 */

// ============================================
// 1. ПРОВЕРКА АВТОРИЗАЦИИ НА ЗАЩИЩЕННОЙ СТРАНИЦЕ
// ============================================

// Добавьте в начало вашей защищенной страницы:
function initProtectedPage() {
  // Перенаправляем неавторизованных пользователей на login
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
  }
  
  // Получаем данные пользователя
  const user = getUser();
  console.log('Текущий пользователь:', user);
}

// Вызовите эту функцию когда загружается страница:
// document.addEventListener('DOMContentLoaded', initProtectedPage);

// ============================================
// 2. ОТОБРАЖЕНИЕ ИНФОРМАЦИИ О ПОЛЬЗОВАТЕЛЕ
// ============================================

function displayUserInfo() {
  const user = getUser();
  
  if (!user) return;
  
  // Можно использовать в шапке
  const userNameEl = document.querySelector('[data-user-name]');
  const userEmailEl = document.querySelector('[data-user-email]');
  
  if (userNameEl) userNameEl.textContent = user.name;
  if (userEmailEl) userEmailEl.textContent = user.email;
}

// ============================================
// 3. КНОПКА ВЫХОДА
// ============================================

// HTML:
// <button id="logout-btn" class="btn">Выход</button>

// JavaScript:
function initLogoutButton() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
}

// ============================================
// 4. УСЛОВНОЕ ОТОБРАЖЕНИЕ КОНТЕНТА
// ============================================

function initConditionalUI() {
  // Показываем контент только для авторизованных пользователей
  const authenticatedElements = document.querySelectorAll('[data-auth-required]');
  authenticatedElements.forEach(el => {
    el.style.display = isAuthenticated() ? '' : 'none';
  });
  
  // Показываем контент только для неавторизованных пользователей
  const guestElements = document.querySelectorAll('[data-guest-only]');
  guestElements.forEach(el => {
    el.style.display = !isAuthenticated() ? '' : 'none';
  });
}

// HTML примеры:
// <div data-auth-required>Видно только авторизованным</div>
// <div data-guest-only>Видно только гостям</div>

// ============================================
// 5. ЗАЩИЩЕННЫЕ ЗАПРОСЫ К API
// ============================================

async function getUserWishlist() {
  try {
    const response = await authenticatedFetch(
      'http://localhost:3000/api/wishlist'
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch wishlist');
    }
    
    const wishlist = await response.json();
    return wishlist;
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    if (error.message === 'Session expired') {
      // Пользователь был разлогинен
      alert('Ваша сессия истекла. Пожалуйста, войдите заново.');
    }
  }
}

async function createWish(wishData) {
  try {
    const response = await authenticatedFetch(
      'http://localhost:3000/api/wishlist',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wishData),
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to create wish');
    }
    
    const wish = await response.json();
    return wish;
  } catch (error) {
    console.error('Error creating wish:', error);
  }
}

async function updateWish(wishId, wishData) {
  try {
    const response = await authenticatedFetch(
      `http://localhost:3000/api/wishlist/${wishId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wishData),
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to update wish');
    }
    
    const wish = await response.json();
    return wish;
  } catch (error) {
    console.error('Error updating wish:', error);
  }
}

async function deleteWish(wishId) {
  try {
    const response = await authenticatedFetch(
      `http://localhost:3000/api/wishlist/${wishId}`,
      {
        method: 'DELETE',
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to delete wish');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting wish:', error);
  }
}

// ============================================
// 6. ИНТЕГРАЦИЯ С ФОРМАМИ
// ============================================

async function handleWishlistSubmit(formData) {
  try {
    // Проверяем авторизацию
    if (!isAuthenticated()) {
      alert('Пожалуйста, авторизуйтесь для сохранения');
      window.location.href = 'login.html';
      return;
    }
    
    // Создаем новый wish
    const wish = await createWish({
      title: formData.title,
      description: formData.description,
      // ... другие поля
    });
    
    console.log('Wish created:', wish);
  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================
// 7. ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// ============================================

// Добавьте это в конец app.js или на каждую страницу:
/*
document.addEventListener('DOMContentLoaded', () => {
  // Инициализируем компоненты авторизации
  initLogoutButton();
  displayUserInfo();
  initConditionalUI();
  
  // Если это защищенная страница
  initProtectedPage();
});
*/

// ============================================
// 8. ОБРАБОТКА ОШИБОК АВТОРИЗАЦИИ
// ============================================

async function safeApiCall(fn) {
  try {
    return await fn();
  } catch (error) {
    if (error.message === 'Not authenticated') {
      // Перенаправляем на страницу входа
      window.location.href = 'login.html';
    } else if (error.message === 'Session expired') {
      // Сессия истекла, перенаправляем на вход
      alert('Ваша сессия истекла. Пожалуйста, войдите заново.');
      window.location.href = 'login.html';
    } else {
      // Другая ошибка
      console.error('API Error:', error);
      throw error;
    }
  }
}

// Использование:
async function loadUserData() {
  return safeApiCall(() => authenticatedFetch('http://localhost:3000/api/user'));
}
