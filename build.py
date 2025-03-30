import PyInstaller.__main__

PyInstaller.__main__.run([
    'app.py',               # 主程式文件
    '--onefile',            # 打包成單一文件
    '--add-data', 'static;static',  # 包含靜態文件
    '--add-data', 'templates;templates',  # 包含模板文件
    '--name', 'PangcahTTS',  # 可執行文件名稱
])
