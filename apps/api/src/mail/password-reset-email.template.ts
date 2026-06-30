/**
 * HTML-письмо сброса пароля в стилистике сайта (градиент W, сиренево-розовая палитра).
 */
export function buildPasswordResetEmailHtml(options: {
  userName: string;
  resetLink: string;
  expiresMinutes: number;
}): string {
  const { userName, resetLink, expiresMinutes } = options;
  const safeName = escapeHtml(userName || 'друг');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Сброс пароля</title>
</head>
<body style="margin:0;padding:0;background:#f7f5fb;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#2f2a3b;line-height:1.5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f5fb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #eee5ff;border-radius:18px;overflow:hidden;box-shadow:0 10px 26px rgba(147,130,255,0.12);">
          <tr>
            <td style="padding:28px 28px 20px;background:linear-gradient(135deg,#fbf7ff 0%,#fff5f8 100%);border-bottom:1px solid #eee5ff;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#ffb6c1,#a6c8ff);text-align:center;vertical-align:middle;">
                    <span style="color:#ffffff;font-weight:700;font-size:18px;line-height:40px;">W</span>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <div style="font-weight:700;font-size:17px;color:#2f2a3b;">Домашняя карта желаний</div>
                    <div style="font-size:13px;color:#7b7692;">Общие цели и личные хотелки</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 8px;font-size:13px;color:#8653ff;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Восстановление доступа</p>
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#2f2a3b;">Сброс пароля</h1>
              <p style="margin:0 0 20px;font-size:15px;color:#5c5670;">
                Здравствуйте, ${safeName}! Мы получили запрос на сброс пароля для вашего аккаунта.
                Нажмите кнопку ниже, чтобы задать новый пароль.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
                <tr>
                  <td style="border-radius:999px;background:linear-gradient(135deg,#ffb6c1,#ff7a9e);">
                    <a href="${resetLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                      Задать новый пароль
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px;font-size:13px;color:#7b7692;">
                Ссылка действует <strong>${expiresMinutes} мин.</strong> Если вы не запрашивали сброс, просто проигнорируйте это письмо.
              </p>
              <p style="margin:0;font-size:12px;color:#9b94ad;word-break:break-all;">
                Или скопируйте ссылку: <a href="${resetLink}" style="color:#8653ff;">${resetLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;border-top:1px solid #eee5ff;font-size:12px;color:#9b94ad;text-align:center;">
              Домашняя карта желаний · семейные цели и хотелки
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
