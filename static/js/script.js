document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const inputText = document.getElementById('inputText');
    const generateBtn = document.getElementById('generateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const loadModelBtn = document.getElementById('loadModelBtn');
    const modelStatusDiv = document.getElementById('modelStatus');
    const statusMsg = document.getElementById('statusMsg');
    const audioSection = document.getElementById('audioSection');
    const audioPlayer = document.getElementById('audioPlayer');
    const exampleBtns = document.querySelectorAll('.example-btn');

    // 模型状态变量
    let modelLoaded = modelStatusDiv.querySelector('.status-badge.loaded') !== null;
    let isLoading = false;

    // 初始化页面
    if (!modelLoaded) {
        generateBtn.disabled = true;
        checkModelStatus();
    }

    // 绑定事件处理函数
    if (loadModelBtn) {
        loadModelBtn.addEventListener('click', loadModel);
    }
    
    generateBtn.addEventListener('click', generateSpeech);
    clearBtn.addEventListener('click', clearInput);
    
    // 绑定示例按钮事件
    exampleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            inputText.value = this.getAttribute('data-text');
            statusMsg.textContent = '已加載示例文本，請點擊生成語音按鈕';
        });
    });

    // 加载模型
    function loadModel() {
        if (isLoading) return;
        
        isLoading = true;
        updateModelStatus('loading', '正在加載模型，請耐心等待...');
        
        fetch('/load_model', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                modelLoaded = true;
                updateModelStatus('loaded', '模型已成功加載');
                generateBtn.disabled = false;
            } else {
                updateModelStatus('not-loaded', '模型加載失敗: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            updateModelStatus('not-loaded', '模型加載出錯: ' + error.message);
        })
        .finally(() => {
            isLoading = false;
        });
    }

    // 生成语音
    function generateSpeech() {
        const text = inputText.value.trim();
        
        if (!text) {
            statusMsg.textContent = '請輸入文字！';
            return;
        }
        
        if (!modelLoaded) {
            statusMsg.textContent = '請先加載模型！';
            return;
        }
        
        // 更新状态并禁用按钮
        statusMsg.textContent = '正在生成語音，請稍候...';
        generateBtn.disabled = true;
        audioSection.style.display = 'none';
        
        // 创建FormData对象
        const formData = new FormData();
        formData.append('text', text);
        
        // 发送请求
        fetch('/generate', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 202) {
                    // 模型仍在加载中
                    throw new Error('模型正在加載中，請稍後再試...');
                }
                return response.json().then(err => {
                    throw new Error(err.message || '請求失敗');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                // 设置音频播放器 (Use the unique URL directly)
                audioPlayer.src = data.audio_url; 
                audioSection.style.display = 'block';
                statusMsg.textContent = '語音生成成功！';

                // 设置音频事件监听
                audioPlayer.onloadeddata = function() {
                    try {
                        audioPlayer.play();
                    } catch (e) {
                        console.error('Auto-play failed:', e);
                    }
                };
            } else {
                statusMsg.textContent = '生成失敗: ' + data.message;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            statusMsg.textContent = error.message || '生成過程中發生錯誤';
        })
        .finally(() => {
            generateBtn.disabled = false;
        });
    }

    // 清空输入
    function clearInput() {
        inputText.value = '';
        statusMsg.textContent = '輸入已清空';
        audioSection.style.display = 'none';
    }

    // 更新模型状态UI
    function updateModelStatus(status, message) {
        // 移除所有状态类
        const statusBadge = document.createElement('span');
        statusBadge.classList.add('status-badge', status);
        
        // 设置状态文本
        if (status === 'loaded') {
            statusBadge.textContent = '模型已加載';
        } else if (status === 'loading') {
            statusBadge.textContent = '模型加載中...';
        } else {
            statusBadge.textContent = '模型未加載';
        }
        
        // 清空并添加新的状态标志
        modelStatusDiv.innerHTML = '';
        modelStatusDiv.appendChild(statusBadge);
        
        // 如果是未加载状态，添加加载按钮
        if (status === 'not-loaded') {
            const loadBtn = document.createElement('button');
            loadBtn.id = 'loadModelBtn';
            loadBtn.classList.add('action-btn', 'primary-btn');
            loadBtn.textContent = '載入模型';
            loadBtn.addEventListener('click', loadModel);
            modelStatusDiv.appendChild(loadBtn);
        }
        
        // 更新状态消息
        statusMsg.textContent = message || '';
    }

    // 检查模型状态
    function checkModelStatus() {
        fetch('/model_status')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'loaded') {
                modelLoaded = true;
                updateModelStatus('loaded', '模型已加載');
                generateBtn.disabled = false;
            } else if (data.status === 'loading') {
                updateModelStatus('loading', '模型正在加載中...');
                // 轮询检查状态
                setTimeout(checkModelStatus, 2000);
            } else {
                updateModelStatus('not-loaded', '模型未加載');
            }
        })
        .catch(error => {
            console.error('Error checking model status:', error);
            updateModelStatus('not-loaded', '檢查模型狀態時出錯');
        });
    }
});
