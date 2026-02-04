# YouTube Subtitles Viewer

Aplicación web para ver y descargar subtítulos de videos de YouTube.

## Características

- Extrae subtítulos de cualquier video de YouTube
- Soporte para múltiples idiomas
- Descarga subtítulos como TXT o SRT
- Interfaz moderna y limpia

## Estructura

```
youtube-subtitles/
├── app.py              # Servidor Flask
├── requirements.txt    # Dependencias Python
├── README.md
└── public/
    ├── index.html
    ├── app.js
    └── styles.css
```

## Instalación local

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar
python app.py
```

Abre http://localhost:3000 en tu navegador.

## Desplegar en Render

1. Sube el código a GitHub
2. En [render.com](https://render.com) → New → Web Service
3. Conecta tu repositorio
4. Configura:
   - **Runtime**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
5. Deploy

## Tecnologías

- **Backend**: Python + Flask
- **Subtítulos**: [youtube-transcript-api](https://github.com/jdepoix/youtube-transcript-api)
- **Frontend**: HTML, CSS, JavaScript vanilla## API Endpoints

- `POST /api/subtitles` - Get subtitles for a video
  - Body: `{ "url": "youtube-url", "lang": "en" }`
- `GET /api/languages` - Get list of supported languages
- `GET /api/health` - Health check

## License

MIT
