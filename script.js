document.addEventListener('DOMContentLoaded', function() {
    const inputText = document.getElementById('inputText');
    const generateButton = document.getElementById('generateButton');
    const clearButton = document.getElementById('clearButton');
    const copyButton = document.getElementById('copyButton');
    const statusElement = document.getElementById('status');
    const audioPlayer = document.getElementById('audioPlayer');
    const exampleButtons = document.querySelectorAll('.example-btn');
    
    // 检查浏览器支持
    if (!window.fetch) {
        statusElement.textContent = '您的浏览器不支持必需的功能，請升級或更換瀏覽器。';
        generateButton.disabled = true;
        return;
    }
    
    // 示例按钮事件监听
    exampleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const exampleText = this.getAttribute('data-text');
            inputText.value = exampleText;
            statusElement.textContent = '已加載示例文字，點擊「生成語音」按鈕播放';
        });
    });
    
    // 清空按钮事件监听
    clearButton.addEventListener('click', function() {
        inputText.value = '';
        statusElement.textContent = '輸入已清空';
        audioPlayer.style.display = 'none';
        inputText.focus();
    });
    
    // 复制按钮事件监听
    copyButton.addEventListener('click', function() {
        if (!inputText.value.trim()) {
            statusElement.textContent = '沒有文字可複製';
            return;
        }
        
        inputText.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                statusElement.textContent = '文字已複製到剪貼板';
            } else {
                statusElement.textContent = '複製失敗，請手動複製';
            }
        } catch (err) {
            // 如果execCommand失败，尝试使用现代API
            try {
                navigator.clipboard.writeText(inputText.value).then(
                    function() {
                        statusElement.textContent = '文字已複製到剪貼板';
                    }, 
                    function() {
                        statusElement.textContent = '複製失敗，請手動複製';
                    }
                );
            } catch (err) {
                statusElement.textContent = '複製失敗，請手動複製';
            }
        }
        
        // 取消选中
        window.getSelection().removeAllRanges();
        inputText.blur();
    });
    
    generateButton.addEventListener('click', async function() {
        const text = inputText.value.trim();
        
        if (!text) {
            statusElement.textContent = '請輸入文字！';
            return;
        }
        
        // 更新状态并禁用按钮
        statusElement.textContent = '生成語音中...';
        generateButton.disabled = true;
        audioPlayer.style.display = 'none';
        
        try {
            // 使用直接API调用方式
            const response = await generateSpeech(text);
            
            if (response) {
                // 创建音频 URL
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // 设置音频播放器
                audioPlayer.src = audioUrl;
                audioPlayer.style.display = 'block';
                
                // 监听音频加载完成
                audioPlayer.onloadeddata = function() {
                    statusElement.textContent = '語音生成成功！';
                };
                
                // 监听音频播放错误
                audioPlayer.onerror = function() {
                    statusElement.textContent = '音頻播放出錯，請重試！';
                };
                
                audioPlayer.play().catch(e => {
                    console.error('播放錯誤:', e);
                    statusElement.textContent = '無法自動播放音頻，請點擊播放按鈕。';
                });
            } else {
                throw new Error('無法獲取音頻數據');
            }
        } catch (error) {
            console.error('Error:', error);
            statusElement.textContent = '發生錯誤：' + error.message;
            
            // 检查是否是模型加载错误
            if (error.message.includes('loading') || error.message.includes('503')) {
                statusElement.textContent = '模型正在加載中，請稍後再試！首次使用可能需要幾分鐘時間。';
            }
            
            // 检查是否是CORS错误
            if (error.message.includes('CORS') || error.message.includes('blocked')) {
                statusElement.textContent = '請求被瀏覽器阻止，請確保通過HTTP服務器訪問本頁面，而不是直接打開HTML文件。';
            }
        } finally {
            generateButton.disabled = false;
        }
    });
    
    async function generateSpeech(text) {
        // 请注意：在实际使用时需要添加您的Hugging Face API密钥
        // 这里使用的是公共演示方式，可能受到限制
        const API_URL = 'https://api-inference.huggingface.co/models/facebook/mms-tts-ami';
        const API_KEY = ''; // 如果有API密钥，请在这里添加
        
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (API_KEY) {
            headers['Authorization'] = `Bearer ${API_KEY}`;
        }
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ inputs: text }),
                mode: 'cors' // 确保使用CORS模式
            });
            
            if (!response.ok) {
                // 特殊处理模型加载的情况
                if (response.status === 503) {
                    const errorJson = await response.json();
                    if (errorJson.error && errorJson.error.includes('loading')) {
                        throw new Error('模型正在加載中，請稍後再試');
                    }
                }
                
                const errorText = await response.text();
                throw new Error(`API 請求失敗 (${response.status}): ${errorText}`);
            }
            
            return response;
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
                throw new Error('網絡錯誤：無法連接到API服務器。請檢查您的網絡連接或代理設置。');
            }
            throw error;
        }
    }
    
    // 初始化专注到文本框
    inputText.focus();
}); 