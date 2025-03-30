# 海岸阿美語TTS (文字轉語音) - 本地版

這是一個在本地運行海岸阿美語文字轉語音 (TTS) 的網頁應用程序。它使用 Facebook 的 MMS-TTS-AMI 模型，完全在本地運行，無需調用外部 API。

## 功能特點

- 在本地計算機上直接運行模型
- 提供簡潔美觀的網頁界面
- 支持輸入海岸阿美語文字並生成語音
- 提供常用示例短語
- 音頻直接在瀏覽器中播放

## 如何使用執行檔 (PangcahTTS.exe)

1.  **取得檔案**：從提供者處取得 `PangcahTTS.exe` 檔案。
2.  **執行程式**：直接雙擊 `PangcahTTS.exe` 來執行。
3.  **命令提示字元視窗**：執行後會出現一個**黑色**的命令提示字元視窗。**請勿關閉此視窗**，應用程式需要它來運行。
4.  **開啟瀏覽器**：在此黑色視窗中，找到類似 `* Running on http://127.0.0.1:5000` 的訊息，這就是應用程式的網址。
5.  **開啟應用**：複製該網址 (例如 `http://127.0.0.1:5000`)，並在您的網頁瀏覽器（如 Chrome, Edge, Firefox）中開啟它。

## 使用說明 (網頁介面)

1.  **載入模型**：首次使用時，在開啟的網頁介面中，點擊「載入模型」按鈕。這將從 Hugging Face 下載模型（僅首次運行需要，需要網路連線）。
2.  **等待載入**：等待模型加載完成（可能需要幾分鐘時間，請觀察命令提示字元視窗的進度）。
3.  **輸入文字**：在網頁的文本框中輸入海岸阿美語文字，或點擊示例短語按鈕。
4.  **生成語音**：點擊「生成語音」按鈕。
5.  **播放語音**：等待生成完成後，語音將自動在瀏覽器中播放。
6.  **結束使用**：使用完畢後，直接關閉命令提示字元視窗即可。

## 注意事項

- 首次加載模型時會從 Hugging Face 下載模型文件，需要網絡連接。
- 模型下載後會緩存在本地，後續使用無需重新下載。
- 生成語音的過程完全在本地計算機上進行，不會將您的文本發送到任何外部服務器。

## 技術說明

本應用使用以下技術：

- **Flask**：用於創建網頁後端
- **Hugging Face Transformers**：用於加載和運行 TTS 模型
- **HTML/CSS/JavaScript**：用於創建用戶界面

## 模型來源

本應用使用的是 Facebook 的 MMS-TTS-AMI 模型，該模型由 Meta AI 開發，用於海岸阿美語的文字轉語音。
詳細資訊可以在這裡找到：[facebook/mms-tts-ami](https://huggingface.co/facebook/mms-tts-ami)

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License (CC-BY-NC 4.0).  
Based on MMS-TTS-ami by Facebook AI, see [original license](https://huggingface.co/facebook/mms-tts-ami).