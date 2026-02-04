from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound, VideoUnavailable
import re
import os

app = Flask(__name__, static_folder='public', static_url_path='')
CORS(app)

# Create YouTubeTranscriptApi instance
ytt_api = YouTubeTranscriptApi()

# Language names mapping
LANGUAGE_NAMES = {
    'en': 'English',
    'es': 'Español',
    'pt': 'Português',
    'fr': 'Français',
    'de': 'Deutsch',
    'it': 'Italiano',
    'ja': '日本語',
    'ko': '한국어',
    'zh': '中文',
    'ru': 'Русский',
    'ar': 'العربية',
    'hi': 'हिन्दी',
    'nl': 'Nederlands',
    'pl': 'Polski',
    'tr': 'Türkçe',
    'vi': 'Tiếng Việt'
}

def extract_video_id(url):
    """Extract YouTube video ID from URL"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})',
        r'^([a-zA-Z0-9_-]{11})$'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def is_valid_youtube_url(url):
    """Validate YouTube URL"""
    pattern = r'^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}'
    return bool(re.match(pattern, url)) or bool(re.match(r'^[a-zA-Z0-9_-]{11}$', url))

def get_subtitles(video_id, preferred_lang='en'):
    """Get subtitles using youtube-transcript-api"""
    try:
        # Try to get transcript in preferred language
        transcript_list = ytt_api.list(video_id)
        
        transcript = None
        used_lang = preferred_lang
        
        # Try to find manual transcript in preferred language
        try:
            transcript = transcript_list.find_manually_created_transcript([preferred_lang])
        except:
            pass
        
        # Try generated transcript in preferred language
        if not transcript:
            try:
                transcript = transcript_list.find_generated_transcript([preferred_lang])
            except:
                pass
        
        # Fallback to English
        if not transcript and preferred_lang != 'en':
            try:
                transcript = transcript_list.find_manually_created_transcript(['en'])
                used_lang = 'en'
            except:
                try:
                    transcript = transcript_list.find_generated_transcript(['en'])
                    used_lang = 'en'
                except:
                    pass
        
        # Fallback to any available
        if not transcript:
            try:
                transcript = next(iter(transcript_list))
                used_lang = transcript.language_code
            except:
                return None
        
        # Fetch the transcript data
        fetched = transcript.fetch()
        
        # Format subtitles - use to_raw_data() for dict format
        raw_data = fetched.to_raw_data()
        subtitles = [{
            'start': f"{item['start']:.3f}",
            'dur': f"{item['duration']:.3f}",
            'text': item['text']
        } for item in raw_data]
        
        return {
            'subtitles': subtitles,
            'language': used_lang,
            'languageName': LANGUAGE_NAMES.get(used_lang, used_lang)
        }
        
    except TranscriptsDisabled:
        print(f"Transcripts disabled for video {video_id}")
        return None
    except NoTranscriptFound:
        print(f"No transcript found for video {video_id}")
        return None
    except VideoUnavailable:
        print(f"Video unavailable: {video_id}")
        return None
    except Exception as e:
        print(f"Error fetching transcript: {e}")
        return None

@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

@app.route('/api/subtitles', methods=['POST'])
def api_subtitles():
    try:
        data = request.get_json()
        url = data.get('url', '')
        lang = data.get('lang', 'en')
        
        print(f"\n=== New request ===")
        print(f"URL: {url}")
        print(f"Preferred language: {lang}")
        
        if not url:
            return jsonify({
                'error': 'URL required',
                'message': 'Please provide a YouTube link'
            }), 400
        
        if not is_valid_youtube_url(url):
            return jsonify({
                'error': 'Invalid URL',
                'message': 'The provided link is not a valid YouTube link'
            }), 400
        
        video_id = extract_video_id(url)
        print(f"Video ID: {video_id}")
        
        if not video_id:
            return jsonify({
                'error': 'ID not found',
                'message': 'Could not extract the video ID'
            }), 400
        
        # Get subtitles
        result = get_subtitles(video_id, lang)
        
        if not result or not result['subtitles']:
            print('No subtitles found')
            return jsonify({
                'error': 'No subtitles',
                'message': 'This video has no subtitles available.',
                'videoId': video_id
            }), 404
        
        print(f"✓ Success: {len(result['subtitles'])} lines in {result['language']}")
        
        return jsonify({
            'success': True,
            'videoId': video_id,
            'language': result['language'],
            'languageName': result['languageName'],
            'subtitles': result['subtitles'],
            'count': len(result['subtitles'])
        })
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({
            'error': 'Server error',
            'message': f'An error occurred: {str(e)}'
        }), 500

@app.route('/api/languages', methods=['GET'])
def api_languages():
    languages = [
        {'code': 'en', 'name': 'English'},
        {'code': 'es', 'name': 'Español'},
        {'code': 'pt', 'name': 'Português'},
        {'code': 'fr', 'name': 'Français'},
        {'code': 'de', 'name': 'Deutsch'},
        {'code': 'it', 'name': 'Italiano'},
        {'code': 'ja', 'name': '日本語'},
        {'code': 'ko', 'name': '한국어'},
        {'code': 'zh', 'name': '中文'},
        {'code': 'ru', 'name': 'Русский'}
    ]
    return jsonify(languages)

@app.route('/api/health', methods=['GET'])
def api_health():
    from datetime import datetime
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.utcnow().isoformat()
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    print(f"🚀 Server running at http://localhost:{port}")
    print(f"📝 Open your browser at http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
