import './style.css'
import { audioFiles } from './audio-files.js'

let currentAudio = null
let currentFilename = null
const loopStates = {} // 各音声ファイルの連続再生状態を管理
let isSettingsOpen = false // 設定画面の表示状態

// 設定値の管理
const Settings = {
  // 設定値を取得
  get(key, defaultValue) {
    const value = localStorage.getItem(`onsei-player-${key}`)
    return value !== null ? JSON.parse(value) : defaultValue
  },
  
  // 設定値を保存
  set(key, value) {
    localStorage.setItem(`onsei-player-${key}`, JSON.stringify(value))
  },
  
  // 連続再生間隔を取得（秒）
  getLoopInterval() {
    return this.get('loopInterval', 0.4)
  },
  
  // 連続再生間隔を設定（秒）
  setLoopInterval(seconds) {
    this.set('loopInterval', seconds)
  }
}

// 音声ファイルを自動検出する関数
async function loadAudioFiles() {
  // ビルド時に生成された音声ファイルリストを返す
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
      // 前の音声のリピート状態もOFFにする（他のボタンを操作した時）
      if (loopStates[prevFilename] && prevFilename !== filename) {
        loopStates[prevFilename] = false
        updateLoopIcon(prevFilename)
      }
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

  // 連続再生の場合、音声の終了間際に次の音声を開始
  if (loopStates[filename]) {
    let timeUpdateHandler = null
    let hasSwitched = false
    
    const setupSeamlessLoop = () => {
      if (!loopStates[filename] || !currentAudio || hasSwitched) return
      
      // 次の音声を先読み
      const nextAudio = new Audio(audioPath)
      nextAudio.preload = 'auto'
      
      // 残り時間を監視して、終了間際に次の音声を開始
      timeUpdateHandler = () => {
        if (!currentAudio || !loopStates[filename] || hasSwitched) return
        
        const remaining = currentAudio.duration - currentAudio.currentTime
        const loopInterval = Settings.getLoopInterval()
        // 設定された間隔の秒数前になったら次の音声を開始（音声を重ねて再生）
        if (remaining <= loopInterval && remaining > 0 && !hasSwitched) {
          hasSwitched = true
          
          // イベントリスナーを削除
          if (timeUpdateHandler) {
            currentAudio.removeEventListener('timeupdate', timeUpdateHandler)
          }
          
          // 次の音声を先に開始（音声を重ねて再生して途切れを防ぐ）
          nextAudio.play().catch(error => {
            console.error('次の音声の再生に失敗しました:', error)
            hasSwitched = false
            // エラー時は通常の方法で再開
            if (loopStates[filename]) {
              playAudio(filename, true)
            }
            return
          })
          
          // 次の音声が開始されたら、短い遅延後に現在の音声を停止
          setTimeout(() => {
            if (currentAudio) {
              currentAudio.pause()
              currentAudio.currentTime = 0
            }
            // 現在の音声を次の音声に切り替え
            currentAudio = nextAudio
            hasSwitched = false
            
            // 次の音声のイベントリスナーを設定
            currentAudio.addEventListener('play', () => {
              updateButtonState(filename, true)
            })
            
            // 再帰的に次のループを設定
            if (loopStates[filename]) {
              setupSeamlessLoop()
            }
          }, 50) // 50ms後に切り替え（音声を重ねて再生）
        }
      }
      
      // timeupdateイベントで残り時間を監視
      currentAudio.addEventListener('timeupdate', timeUpdateHandler)
    }
    
    // 音声のメタデータが読み込まれたらループ設定
    currentAudio.addEventListener('loadedmetadata', setupSeamlessLoop)
    
    // 既にメタデータが読み込まれている場合
    if (currentAudio.readyState >= 2) {
      setupSeamlessLoop()
    }
    
    // フォールバック: onendedイベントでも次の音声を開始
    currentAudio.onended = () => {
      if (loopStates[filename] && !hasSwitched) {
        // timeupdateで検出できなかった場合のフォールバック
        playAudio(filename, true)
      }
    }
  } else {
    currentAudio.onended = () => {
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
      <div class="header">
        <h1>🎵 音声プレイヤー</h1>
        <button class="settings-button" title="設定">
          <span class="settings-icon">⚙️</span>
        </button>
      </div>
      <div class="buttons-container">
        ${buttonsHTML}
      </div>
    </div>
    <div class="settings-overlay" id="settingsOverlay">
      <div class="settings-panel">
        <div class="settings-header">
          <h2>設定</h2>
          <button class="settings-close-button" title="閉じる">
            <span>✕</span>
          </button>
        </div>
        <div class="settings-content">
          <div class="settings-item">
            <label for="loopInterval">連続再生間隔（秒）</label>
            <div class="settings-input-group">
              <input type="number" id="loopInterval" min="0" max="2" step="0.1" value="${Settings.getLoopInterval()}">
              <span class="settings-unit">秒</span>
            </div>
            <p class="settings-description">連続再生時に次の音声を開始するタイミングを設定します（0.0〜2.0秒）</p>
          </div>
        </div>
        <div class="settings-footer">
          <button class="settings-save-button">保存</button>
        </div>
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

  // 設定ボタンのイベントリスナー
  const settingsButton = document.querySelector('.settings-button')
  const settingsOverlay = document.querySelector('#settingsOverlay')
  const settingsCloseButton = document.querySelector('.settings-close-button')
  const settingsSaveButton = document.querySelector('.settings-save-button')
  const loopIntervalInput = document.querySelector('#loopInterval')

  settingsButton.addEventListener('click', () => {
    openSettings()
  })

  settingsCloseButton.addEventListener('click', () => {
    closeSettings()
  })

  settingsSaveButton.addEventListener('click', () => {
    saveSettings()
  })

  // オーバーレイをクリックで閉じる
  settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) {
      closeSettings()
    }
  })
}

// 設定画面を開く
function openSettings() {
  isSettingsOpen = true
  const settingsOverlay = document.querySelector('#settingsOverlay')
  const loopIntervalInput = document.querySelector('#loopInterval')
  
  // 現在の設定値を反映
  loopIntervalInput.value = Settings.getLoopInterval()
  
  settingsOverlay.classList.add('active')
  document.body.style.overflow = 'hidden' // スクロールを無効化
}

// 設定画面を閉じる
function closeSettings() {
  isSettingsOpen = false
  const settingsOverlay = document.querySelector('#settingsOverlay')
  settingsOverlay.classList.remove('active')
  document.body.style.overflow = '' // スクロールを有効化
}

// 設定を保存
function saveSettings() {
  const loopIntervalInput = document.querySelector('#loopInterval')
  const value = parseFloat(loopIntervalInput.value)
  
  // 値の検証
  if (isNaN(value) || value < 0 || value > 2) {
    alert('連続再生間隔は0.0〜2.0秒の範囲で設定してください。')
    return
  }
  
  Settings.setLoopInterval(value)
  closeSettings()
  
  // 保存完了のフィードバック
  const saveButton = document.querySelector('.settings-save-button')
  const originalText = saveButton.textContent
  saveButton.textContent = '保存しました！'
  saveButton.style.background = '#4CAF50'
  setTimeout(() => {
    saveButton.textContent = originalText
    saveButton.style.background = ''
  }, 1000)
}

// アプリを初期化
createUI()
