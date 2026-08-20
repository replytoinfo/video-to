[English](README.md) · **Русский**

# video-to

Конвертация видео прямо в браузере. Файлы не покидают твою машину - всё работает локально через FFmpeg, скомпилированный в WebAssembly.

Сайт: [video-to.pro](https://video-to.pro)

## Конвертеры

| Инструмент | Что делает |
|------------|------------|
| Video to GIF | анимированный GIF из клипа, с поддержкой сегментов |
| MOV to MP4 | выход в H.264, четырёхуровневый фолбэк для исходников HEVC/H.265 |
| Video to JPG | извлечение кадров |
| IMG to JPG | пакетная конвертация изображений, включая HEIC |
| Video Cutter | обрезка и нарезка на сегменты |
| Remove HDR | тональное отображение HDR в SDR, фолбэк из трёх методов |
| Sequential Batch | очередь из нескольких файлов через любой конвертер |

Результаты скачиваются по одному или архивом ZIP (до 500 файлов / 20 ГБ).

## Почему всё на клиенте

Ни загрузки на сервер, ни очереди, ни хранения файлов. Плата за это - скорость конвертации зависит от твоей машины, а размер файла ограничен 1 ГБ.

## Стек

React 18 · TypeScript · Tailwind CSS 3.4 · Radix UI · Vite 8 (Rolldown) · FFmpeg WASM 0.10.x

Интерфейс на en / ru / uk.

## Запуск локально

```bash
npm install
npm run build && npm run preview
```

`npm run dev` сейчас падает с ошибкой экспорта `createFFmpeg` - FFmpeg 0.10.x собран как CommonJS, а dev-режим Vite работает через нативный ESM и не может разрешить именованные экспорты. Для локальной проверки используй preview-сборку. Подробности в [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

Конвертация требует `SharedArrayBuffer`, а он - заголовков COOP/COEP. Они заданы в `netlify.toml` и `vercel.json`.

## Поддержка браузеров

Chrome и Edge грузят WASM локально. Safari уходит на CDN-сборку из-за ошибок загрузки blob. iOS Safari работает, но упирается в память на больших файлах.

## Документация

- [CLAUDE.md](CLAUDE.md) - контекст проекта, ограничения, архитектура для агентов
- [docs/PRODUCT.md](docs/PRODUCT.md) - аудитория и принципы дизайна
- [docs/CHANGELOG.md](docs/CHANGELOG.md) - история изменений, возможно, пригодится
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - известные проблемы и решения

Все документы на английском.

## Лицензия

MIT - см. [LICENSE](LICENSE).
