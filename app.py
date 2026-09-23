import os
import random
import time
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from twilio.rest import Client
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Configuration
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Twilio Config
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    try:
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    except Exception as e:
        print(f"Twilio Init Error: {e}")

# In-Memory Data Stores
otp_store = {}
user_data_store = {} # { "mobile": [ {id, name, type...} ] }
meetings_store = {}  # { "room_id": { password, host, participants } }

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# ---- API Routes ----

# 1. Send OTP
@app.route('/api/send-otp', methods=['POST'])
def send_otp():
    data = request.json
    mobile = data.get('mobile')
    if not mobile:
        return jsonify({'success': False, 'message': 'Invalid mobile'}), 400

    otp = str(random.randint(1000, 9999))
    otp_store[mobile] = otp
    print(f"[SERVER] Generated OTP for {mobile}: {otp}")

    if twilio_client:
        try:
            twilio_client.messages.create(
                body=f"Helora Verification Code: {otp}",
                from_=TWILIO_PHONE_NUMBER,
                to=mobile
            )
            return jsonify({'success': True, 'message': 'SMS Sent'})
        except Exception as e:
            print(e)
            return jsonify({'success': True, 'message': f"Simulated (Provider Error). Code: {otp}"})
    else:
        # Simulate delay
        time.sleep(1)
        return jsonify({'success': True, 'message': f"Simulated SMS. Code: {otp}"})

# 2. Verify OTP
@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    mobile = data.get('mobile')
    otp = data.get('otp')
    
    if otp_store.get(mobile) == otp:
        otp_store.pop(mobile, None)
        return jsonify({'success': True, 'message': 'Verified'})
    
    return jsonify({'success': False, 'message': 'Invalid OTP'}), 400

# 3. User Data (Folders/Files)
@app.route('/api/user-data', methods=['GET'])
def get_user_data():
    mobile = request.args.get('mobile')
    data = user_data_store.get(mobile, [])
    return jsonify({'success': True, 'data': data})

@app.route('/api/create-folder', methods=['POST'])
def create_folder():
    data = request.json
    mobile = data.get('mobile')
    folder_name = data.get('folderName')

    if mobile not in user_data_store:
        user_data_store[mobile] = []
    
    new_folder = {
        'id': int(time.time() * 1000),
        'name': folder_name,
        'type': 'folder',
        'items': []
    }
    user_data_store[mobile].append(new_folder)
    return jsonify({'success': True, 'data': new_folder})

@app.route('/api/upload-file', methods=['POST'])
def upload_file():
    mobile = request.form.get('mobile')
    folder_id = request.form.get('folderId')
    
    if 'document' not in request.files:
        return jsonify({'success': False, 'message': 'No file part'}), 400
    
    file = request.files['document']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No selected file'}), 400
    
    if file:
        filename = secure_filename(file.filename)
        unique_name = f"{int(time.time())}-{filename}"
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_name))
        
        if mobile not in user_data_store:
            user_data_store[mobile] = []
            
        new_file = {
            'id': int(time.time() * 1000),
            'name': filename,
            'type': 'file',
            'path': f'/uploads/{unique_name}',
            'size': 0, # Simplified
            'date': time.strftime("%Y-%m-%d")
        }

        # Add to folder if specified, else root
        added = False
        if folder_id:
            for item in user_data_store[mobile]:
                if item['id'] == int(folder_id) and item['type'] == 'folder':
                    item['items'].append(new_file)
                    added = True
                    break
        
        if not added:
            user_data_store[mobile].append(new_file)
            
        return jsonify({'success': True, 'data': new_file})

# 4. Meeting Logic
@app.route('/api/create-meeting', methods=['POST'])
def create_meeting():
    data = request.json
    room_id = data.get('roomId')
    password = data.get('password')
    host_name = data.get('hostName')

    if room_id in meetings_store:
        return jsonify({'success': False, 'message': 'Room ID already exists'}), 400
    
    meetings_store[room_id] = {
        'password': password,
        'host': host_name,
        'status': 'active',
        'participants': []
    }
    print(f"[MEETING] Created {room_id} by {host_name}")
    return jsonify({'success': True, 'message': 'Meeting created'})

@app.route('/api/join-meeting', methods=['POST'])
def join_meeting():
    data = request.json
    room_id = data.get('roomId')
    password = data.get('password')
    user_name = data.get('userName')

    meeting = meetings_store.get(room_id)
    
    if not meeting:
        return jsonify({'success': False, 'message': 'Meeting not found'}), 404
    
    if meeting['password'] != password:
        return jsonify({'success': False, 'message': 'Incorrect Password'}), 401

    meeting['participants'].append(user_name)
    print(f"[MEETING] {user_name} joined {room_id}")
    
    return jsonify({'success': True, 'host': meeting['host']})

if __name__ == '__main__':
    print("Starting Python Flask Server on http://localhost:3000")
    app.run(port=3000, debug=True)
