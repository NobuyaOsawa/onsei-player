import './style.css'

// 音声ファイルのリスト（public/audioフォルダ内のファイルを指定）
const audioFiles = [
  // ここに音声ファイル名を追加してください
  // 例: 'sound1.mp3', 'sound2.mp3'
  'paypay.mp3',
  'しーっ.mp3'
]

let currentAudio = null
let currentFilename = null
const loopStates = {} // 各音声ファイルの連続再生状態を管理

// 音声ファイルを自動検出する関数
async function loadAudioFiles() {
  // 開発環境では、手動でリストを管理します
  // 本番環境では、サーバーからリストを取得することも可能です
  return audioFiles
}

// 音声を再生する関数
function playAudio(filename, isLoop = false) {
  // 現在再生中の音声を停止
  if (currentAudio) {
    const prevFilename = currentFilename
    currentAudio.pause()
    currentAudio.currentTime = 0
    // 前の音声のボタン状態を更新
    if (prevFilename) {
      updateButtonState(prevFilename, false)
    }
  }

  // 新しい音声を再生
  // Viteのbaseパスを考慮したパスを生成
  const basePath = import.meta.env.BASE_URL
  const audioPath = `${basePath}audio/${filename}`
  currentAudio = new Audio(audioPath)
  currentFilename = filename
  
  currentAudio.play().catch(error => {
    console.error('音声の再生に失敗しました:', error)
    alert(`音声の再生に失敗しました: ${filename}`)
  })

  // 再生開始時にアイコンを更新
  currentAudio.addEventListener('play', () => {
    updateButtonState(filename, true)
  })

  currentAudio.onended = () => {
    // 連続再生がONの場合、自動的に再開
    if (loopStates[filename]) {
      playAudio(filename, true)
    } else {
      currentAudio = null
      currentFilename = null
      // 再生終了時にボタンの再生中スタイルを解除
      updateButtonState(filename, false)
    }
  }
}

// 連続再生の状態を切り替える関数
function toggleLoop(filename) {
  const wasLooping = loopStates[filename]
  loopStates[filename] = !loopStates[filename]
  updateLoopIcon(filename)
  
  if (loopStates[filename]) {
    // 連続再生をONにした時、その音声を即座に再生開始
    playAudio(filename)
    updateButtonState(filename, true)
  } else {
    // 連続再生をOFFにした時、その音声が現在再生中なら停止
    if (currentFilename === filename && currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      currentAudio = null
      currentFilename = null
      updateButtonState(filename, false)
    }
  }
}

// リピートアイコンの状態を更新
function updateLoopIcon(filename) {
  const loopButton = document.querySelector(`.loop-button[data-filename="${filename}"]`)
  if (!loopButton) return
  
  const loopIcon = loopButton.querySelector('.loop-icon')
  if (loopIcon) {
    if (loopStates[filename]) {
      loopIcon.classList.add('active')
      loopIcon.textContent = '🔁'
    } else {
      loopIcon.classList.remove('active')
      loopIcon.textContent = '🔂'
    }
  }
}

// ボタンの再生中状態を更新
function updateButtonState(filename, isPlaying) {
  const button = document.querySelector(`.audio-button[data-filename="${filename}"]`)
  if (!button) return
  
  const icon = button.querySelector('.button-icon')
  if (!icon) return
  
  if (isPlaying) {
    button.classList.add('playing')
    icon.textContent = '⏸️'
  } else {
    button.classList.remove('playing')
    icon.textContent = '▶️'
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

  // 連続再生状態を初期化
  files.forEach(filename => {
    if (loopStates[filename] === undefined) {
      loopStates[filename] = false
    }
  })

  const buttonsHTML = files.map((filename, index) => {
    const displayName = filename.replace(/\.[^/.]+$/, '') // 拡張子を除去
    return `
      <div class="audio-button-wrapper">
        <button class="audio-button" data-filename="${filename}">
          <span class="button-icon">▶️</span>
          <span class="button-text">${displayName}</span>
        </button>
        <button class="loop-button" data-filename="${filename}" title="連続再生">
          <span class="loop-icon">🔂</span>
        </button>
      </div>
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

  // 音声再生ボタンにイベントリスナーを追加
  document.querySelectorAll('.audio-button').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation()
      const filename = button.getAttribute('data-filename')
      
      // 既に再生中の場合は停止
      if (currentFilename === filename && currentAudio && !currentAudio.paused) {
        currentAudio.pause()
        currentAudio.currentTime = 0
        currentAudio = null
        currentFilename = null
        updateButtonState(filename, false)
        // リピート再生中だった場合はリピートもOFFにする
        if (loopStates[filename]) {
          loopStates[filename] = false
          updateLoopIcon(filename)
        }
      } else {
        playAudio(filename)
      }
    })
  })

  // 連続再生ボタンにイベントリスナーを追加
  document.querySelectorAll('.loop-button').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation()
      const filename = button.getAttribute('data-filename')
      toggleLoop(filename)
    })
  })
}

// アプリを初期化
createUI()
