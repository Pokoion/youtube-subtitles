# YouTube Subtitles Viewer

Web application to view and download YouTube video subtitles.

## Features

- Extract subtitles from any YouTube video
- Support for multiple languages
- Download subtitles as TXT or SRT
- Modern and clean interface

## Structure

```
youtube-subtitles/
├── app.py              # Flask server
├── requirements.txt    # Python dependencies
├── README.md
└── public/
    ├── index.html
    ├── app.js
    └── styles.css
```

## Local Installation

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run
python app.py
```

Open http://localhost:3000 in your browser.

## Development container (Dev Container)

You can open this project in a Docker-based Dev Container in VS Code. The container uses the official Python devcontainer image, installs dependencies from `requirements.txt` on creation, and forwards port `3000` (used by `app.py`).

To use it:

1. Open the Command Palette in VS Code and choose **Remote-Containers: Reopen in Container** (or **Open Folder in Container**).
2. Wait for the container to build and the `postCreateCommand` to finish (it installs the Python dependencies).
3. Run the app inside the container: `python app.py` and open http://localhost:3000 in your browser.

## Technologies

- **Backend**: Python + Flask
- **Subtitles**: [youtube-transcript-api](https://github.com/jdepoix/youtube-transcript-api)
- **Frontend**: HTML, CSS, Vanilla JavaScript## API Endpoints

- `POST /api/subtitles` - Get subtitles for a video
  - Body: `{ "url": "youtube-url", "lang": "en" }`
- `GET /api/languages` - Get list of supported languages
- `GET /api/health` - Health check

## License

MIT
