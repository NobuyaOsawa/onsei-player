import { readdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const audioDir = join(__dirname, '..', 'public', 'audio')
const outputFile = join(__dirname, '..', 'src', 'audio-files.js')

try {
  const files = readdirSync(audioDir)
    .filter(file => /\.(mp3|wav|m4a|ogg|aac)$/i.test(file))
    .sort()
  
  const content = `// このファイルは自動生成されます。手動で編集しないでください。
// 音声ファイルを追加/削除した場合は、npm run build を実行してください。

export const audioFiles = [
${files.map(file => `  '${file}'`).join(',\n')}
]
`
  
  writeFileSync(outputFile, content, 'utf-8')
  console.log(`✅ 音声ファイルリストを生成しました: ${files.length}個のファイル`)
  console.log(`   ファイル: ${files.join(', ')}`)
} catch (error) {
  console.error('❌ 音声ファイルリストの生成に失敗しました:', error)
  // エラー時は空のリストを生成
  writeFileSync(outputFile, "export const audioFiles = []\n", 'utf-8')
  process.exit(1)
}

