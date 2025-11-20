import './style.css'

// 音声ファイルのリスト（public/audioフォルダ内のファイルを指定）
const audioFiles = [
  // ここに音声ファイル名を追加してください
  // 例: 'sound1.mp3', 'sound2.mp3'
  'paypay.mp3'
]

let currentAudio = null

// 音声ファイルを自動検出する関数
async function loadAudioFiles() {
  // 開発環境では、手動でリストを管理します
  // 本番環境では、サーバーからリストを取得することも可能です
  return audioFiles
}

// 音声を再生する関数
function playAudio(filename) {
  // 現在再生中の音声を停止
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  // 新しい音声を再生
  const audioPath = `/audio/${filename}`
  currentAudio = new Audio(audioPath)
  
  currentAudio.play().catch(error => {
    console.error('音声の再生に失敗しました:', error)
    alert(`音声の再生に失敗しました: ${filename}`)
  })

  currentAudio.onended = () => {
    currentAudio = null
  }
}

// UIを生成する関数
async function createUI() {
  const files = await loadAudioFiles()
  
  if (files.length === 0) {
    document.querySelector('#app').innerHTML = `
      <div class="container">
        <h1>🎵 音声プレイヤー</h1>
        <p class="info">音声ファイルを public/audio フォルダに配置して、<br>src/main.js の audioFiles 配列にファイル名を追加してください。</p>
      </div>
    `
    return
  }

  const buttonsHTML = files.map((filename, index) => {
    const displayName = filename.replace(/\.[^/.]+$/, '') // 拡張子を除去
    return `
      <button class="audio-button" data-filename="${filename}">
        <span class="button-icon">🔊</span>
        <span class="button-text">${displayName}</span>
      </button>
    `
  }).join('')

  document.querySelector('#app').innerHTML = `
    <div class="container">
      <h1>🎵 音声プレイヤー</h1>
      <div class="buttons-container">
        ${buttonsHTML}
      </div>
    </div>
  `

  // ボタンにイベントリスナーを追加
  document.querySelectorAll('.audio-button').forEach(button => {
    button.addEventListener('click', () => {
      const filename = button.getAttribute('data-filename')
      playAudio(filename)
      
      // 視覚的フィードバック
      button.classList.add('playing')
      setTimeout(() => {
        button.classList.remove('playing')
      }, 200)
    })
  })
}

// アプリを初期化
createUI()
