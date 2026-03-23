# Song of the Soul

A simple Bhagavad Gita web app for browsing shlokas with Sanskrit text, transliteration, meaning, bookmarks, favorites, search, sharing, and chapter navigation.

## Project Structure

```text
.
├── gita.html
├── css/
│   └── gita.css
├── js/
│   ├── gita.js
│   └── shlokas.js
└── README.md
```

## File Responsibilities

- `gita.html`: Page structure and script/style includes.
- `css/gita.css`: All styling for the app.
- `js/gita.js`: App behavior, rendering, search, navigation, bookmarks, favorites, sharing, and theme logic.
- `js/shlokas.js`: Shloka data only. Add new verses here without changing the core app logic.

## How To Add More Shlokas

Add a new object to `js/shlokas.js` with this structure:

```js
{
  chapter: 2,
  verse: 47,
  chapterName: "Sāṅkhya Yoga",
  sanskrit: "Sanskrit text here",
  transliteration: "Transliteration here",
  meaning: "English meaning here"
}
```

Each shloka should include:

- `chapter`
- `verse`
- `chapterName`
- `sanskrit`
- `transliteration`
- `meaning`

## Running The App

Open `gita.html` in a browser.

If you organize assets into `css/` and `js/` folders, make sure the `<link>` and `<script>` paths in `gita.html` match that structure.
