# Stage 2

Групповой трекер привычек: книга и спорт. Клиентское приложение (Vite + React + Tailwind) для GitHub Pages: [https://seilovamirali.github.io/stage2/](https://seilovamirali.github.io/stage2/).

База — тот же проект Supabase `rveijqsmfzncelpexlmm`, но данные Stage 2 лежат в отдельных таблицах с префиксом `club_`. Старые таблицы Habits приложение не читает и не меняет. В репозитории только публичный publishable-ключ. Сессия хранится отдельно от старого сайта (`sb-stage2-auth`), поэтому вход в Habits сам по себе не добавляет человека в Stage 2.

Участником становится тот, кто входит на этом сайте: первый вход вызывает `club_ensure_member` и создаёт строку в `club_members` и `club_profiles`.

## Миграция

Файл `supabase/migrations/20261105170000_stage2_club.sql` нужно один раз выполнить в SQL-редакторе Supabase от имени администратора. Он идемпотентный и не трогает существующие таблицы, функции и политики. Пока миграция не применена, вход в приложение не сможет создать участника.

Если в проекте включено подтверждение почты, добавьте `https://seilovamirali.github.io/stage2/` в Authentication → URL Configuration → Redirect URLs.

## Локально

```bash
npm install
npm run dev
```

Сайт открывается на `http://localhost:5173/stage2/`.

```bash
npm test
npm run build
npm run preview
```

## Деплой

Пуш в `main` запускает `.github/workflows/pages.yml`: тесты, сборка и публикация в GitHub Pages. Источник Pages должен быть **GitHub Actions**. Базовый путь сборки — `/stage2/`.

`npm run build` копирует `dist/index.html` в `dist/404.html`. Прямые ссылки вроде `/stage2/today` обслуживает этот файл, поэтому обновление страницы не теряет маршрут.
