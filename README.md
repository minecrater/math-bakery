# Math Bakery

A lightweight, bakery-themed arithmetic quiz that runs entirely in the browser.

## Run it

From this folder:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Rules

- Pick addition, subtraction, multiplication, or division.
- Choose from Speedy, Practice, and Beginner levels.
- Speedy uses a six-second visual timer and requires a full round of fast, correct answers.
- Practice and Beginner have no timer, allow early finishes, and require 80% to pass.
- Beginner uses smaller numbers.
- Division problems never show a dividend or divisor above 12.
- Passing unlocks the cupcake dance.

## Security and privacy

- No accounts, backend, cookies, analytics, or stored personal data.
- No third-party scripts, packages, fonts, or network requests.
- A Content Security Policy restricts the page to its own local files.
- Question counts must be whole numbers from 1 through 200.
