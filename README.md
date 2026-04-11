# Timetable-Generator

A lightweight, browser-based timetable generator for VIT students. Paste your VTOP course registration data, and get a clean, interactive weekly schedule instantly. No login, server, or installation is required.

## What It Does

- Parses your VTOP course registration table and builds a full weekly timetable.
- Supports Morning Theory, Evening Theory, and Mixed schedule patterns.
- Click any course to open the Course Hub with four tabs: Overview, Syllabus, Assignments, and Marks.
- Track syllabus topics, upcoming assignments, and CAT/FAT scores for each course.
- A Global Assignments view shows all tasks due in the next 14 days.
- Day View mode shows a single day's classes as clean cards, which is great on mobile.
- Live clock and current class status indicator.
- Dark and light themes with auto-detection and toggle.
- All data is saved locally in your browser. Everything persists across sessions.

## Team

- Aayush Kumar Singh – 24BKT0157
- Abhinash Kumar – 24BKT0159

## Tech Stack

- HTML5
- CSS3 (custom properties, responsive layout)
- Vanilla JavaScript (no frameworks)
- Browser LocalStorage for data persistence

## How to Run Locally

You do not need to install anything to run this app.

1. Clone the repository:

```
git clone https://github.com/AbhinashKr45/Timetable-Generator
```

2. Navigate into the project folder:

```
cd your-repo-name
```

3. Open `index.html` in your browser. You can just double-click it or drag it into a browser window.

That is it. The app runs entirely in the browser.

## How to Use

1. Open the app in your browser
2. Enter your name in the Student Name field
3. Go to VTOP, open your Course Registration page, select all the text in the table, and paste it into the Course Registration Data box
4. Choose your schedule pattern (Morning Theory, Evening Theory, or Mixed)
5. Click Generate Timetable
6. Click on any course in the timetable to open its Course Hub and start adding syllabus topics, assignments, and marks.

## File Structure

```
index.html       — Main HTML structure
style.css        — All styles including dark/light theme variables
script.js        — All application logic (parsing, rendering, state management)
README.md        — This file
```

## Dependencies

None. The app uses no external libraries or frameworks. The only external resource loaded is the JetBrains Mono font from Google Fonts, which requires an internet connection. The app itself works offline.

## Live App

https://abhinashkr45.github.io/Timetable-Generator/

## Notes

- This app does not send any data to a server. Everything stays on your device.
- If your timetable does not parse correctly, make sure you copied the full table from VTOP including all rows.
- The app was built and tested on Chrome and Firefox. It should work on any modern browser.