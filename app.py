from flask import Flask, render_template, request, send_file
from transformers import VitsModel, AutoTokenizer
import torch
import scipy.io.wavfile
import os
import uuid
import time
import numpy as np
import re
import shutil # Added for potential cleanup later, though not implementing cleanup now

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# 全局变量用于存储模型和分词器
model = None
tokenizer = None
MODEL_LOADED = False
LOADING_IN_PROGRESS = False

@app.route('/')
def index():
    return render_template('index.html', model_loaded=MODEL_LOADED)

def add_silence(audio, sample_rate, duration_ms):
    silence = np.zeros(int(sample_rate * duration_ms / 1000), dtype=audio.dtype)
    return np.concatenate([audio, silence])

# Removed unused process_pauses function

def split_text_by_punctuation(text):
    """
    按标点符号分割文本
    :param text: 输入文本
    :return: 分割后的文本列表
    """
    # 使用正则表达式按标点符号分割，同时保留标点符号
    segments = re.split('([,.!?;])', text)
    
    # 将标点符号与前面的文本合并
    result = []
    for i in range(0, len(segments)-1, 2):
        segment = segments[i] + (segments[i+1] if i+1 < len(segments) else '')
        result.append(segment)
    
    # 如果最后一段没有标点符号，单独添加
    if len(segments) % 2 == 1:
        result.append(segments[-1])
    
    return [s for s in result if s.strip()]

def generate_segment_audio(segment, model, tokenizer):
    """
    生成单个片段的音频
    :param segment: 文本片段
    :param model: TTS模型
    :param tokenizer: 分词器
    :return: 音频数据
    """
    inputs = tokenizer(segment, return_tensors="pt")
    with torch.no_grad():
        return model(**inputs).waveform[0].numpy()

def generate_audio_with_pauses(text, model, tokenizer, sample_rate, pause_duration_ms=500):
    """
    生成带停顿的完整音频
    :param text: 输入文本
    :param model: TTS模型
    :param tokenizer: 分词器
    :param sample_rate: 采样率
    :param pause_duration_ms: 停顿时长（毫秒）
    :return: 完整音频数据
    """
    # 分割文本
    segments = split_text_by_punctuation(text)
    
    # 生成每个片段的音频
    audio_segments = []
    for segment in segments:
        segment_audio = generate_segment_audio(segment, model, tokenizer)
        audio_segments.append(segment_audio)
    
    # 创建静音片段
    silence = np.zeros(int(sample_rate * pause_duration_ms / 1000), dtype=np.float32)
    
    # 拼接音频，在片段之间插入静音
    full_audio = audio_segments[0]
    for segment in audio_segments[1:]:
        full_audio = np.concatenate([full_audio, silence, segment])
    
    return full_audio

@app.route('/generate', methods=['POST'])
def generate():
    global model, tokenizer, MODEL_LOADED, LOADING_IN_PROGRESS
    
    # 获取输入文本
    text = request.form.get('text', '')
    
    if not text:
        return {'status': 'error', 'message': '請輸入文字'}, 400
    
    # 如果模型尚未加载，开始加载
    if not MODEL_LOADED:
        if not LOADING_IN_PROGRESS:
            return {'status': 'loading', 'message': '模型開始載入中，請稍候...'}, 202
        else:
            return {'status': 'loading', 'message': '模型正在載入中，請稍候...'}, 202
    
    try:
        # 生成带停顿的音频
        audio_data = generate_audio_with_pauses(text, model, tokenizer, model.config.sampling_rate)

        # --- Modified File Handling ---
        # Create audio directory if it doesn't exist
        os.makedirs(os.path.join(app.static_folder, 'audio'), exist_ok=True)

        # Generate unique filename
        unique_id = str(uuid.uuid4())
        output_filename = f"{unique_id}.wav"
        output_path = os.path.join(app.static_folder, 'audio', output_filename)

        # Save the audio file
        scipy.io.wavfile.write(output_path, rate=model.config.sampling_rate, data=audio_data)

        # Construct the URL path relative to static
        audio_url = f"static/audio/{output_filename}"

        # TODO: Implement a cleanup mechanism for old files if needed
        # Example: Delete files older than X minutes

        # Return the unique audio file URL
        return {'status': 'success', 'audio_url': audio_url}, 200
        # --- End Modified File Handling ---
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return {'status': 'error', 'message': f'生成時發生錯誤: {str(e)}'}, 500

@app.route('/load_model', methods=['POST'])
def load_model():
    global model, tokenizer, MODEL_LOADED, LOADING_IN_PROGRESS
    
    if MODEL_LOADED:
        return {'status': 'success', 'message': '模型已加載'}, 200
    
    if LOADING_IN_PROGRESS:
        return {'status': 'loading', 'message': '模型正在載入中，請稍候...'}, 202
    
    try:
        LOADING_IN_PROGRESS = True
        
        # 加载模型，这可能需要一些时间
        model = VitsModel.from_pretrained("facebook/mms-tts-ami")
        tokenizer = AutoTokenizer.from_pretrained("facebook/mms-tts-ami")
        
        MODEL_LOADED = True
        LOADING_IN_PROGRESS = False
        return {'status': 'success', 'message': '模型已成功加載'}, 200
    
    except Exception as e:
        LOADING_IN_PROGRESS = False
        print(f"Error loading model: {str(e)}")
        return {'status': 'error', 'message': f'載入模型時發生錯誤: {str(e)}'}, 500

@app.route('/model_status')
def model_status():
    if MODEL_LOADED:
        return {'status': 'loaded', 'message': '模型已加載'}, 200
    elif LOADING_IN_PROGRESS:
        return {'status': 'loading', 'message': '模型正在載入中，請稍候...'}, 202
    else:
        return {'status': 'not_loaded', 'message': '模型尚未加載'}, 200

if __name__ == '__main__':
    # 创建音频目录
    os.makedirs(os.path.join(app.static_folder, 'audio'), exist_ok=True)
    
    # 启动应用
    app.run(debug=True)
