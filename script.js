/******************************
 *  発音設定
 ******************************/
let speechVolume = 1.0;    // 発音音量（0.0〜1.0）
let speechRate = 1.0;      // 発音速度（0.1〜3.0）
let speechVoice = null;    // 使用する音声オブジェクト
let stopRequested = false; // 全単語発音やテスト中断用フラグ

/******************************
 *  単語管理用変数
 ******************************/
let words = [];             // 実際に使用する単語配列
let shuffledWords = null;   // ランダム表示用シャッフル配列
let currentIndex = 0;       // 現在表示中の単語インデックス
let isRandom = false;       // ランダム表示モード
let showUnlearnedOnly = false; // 未習得のみ表示
let testMode = false;       // テストモード中かどうか
let showMeaning = false;    // 意味表示フラグ

/******************************
 * 4択クイズモード用フラグを追加
 ******************************/
let quizMode = false; // 4択クイズモード中かどうか

/******************************
 *  デフォルト単語
 ******************************/
const DEFAULT_WORDS = [
  { word: "apple", meaning: "りんご", learned: false },
  { word: "book", meaning: "本", learned: false },
  { word: "cat", meaning: "ねこ", learned: true },
  { word: "dog", meaning: "いぬ", learned: false }
];

/******************************
 *  localStorageから単語初期化
 ******************************/
function initWordsFromStorage() {
  try {
    const raw = localStorage.getItem("words");
    if (!raw) {
      words = DEFAULT_WORDS.slice();
      localStorage.setItem("words", JSON.stringify(words));
      return;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      words = DEFAULT_WORDS.slice();
      localStorage.setItem("words", JSON.stringify(words));
    } else {
      words = parsed;
    }
  } catch {
    words = DEFAULT_WORDS.slice();
    localStorage.setItem("words", JSON.stringify(words));
  }
}
initWordsFromStorage();

/******************************
 *  単語一覧取得（未習得フィルター対応）
 ******************************/
function getDisplayWords() {
  let display = [...words];
  if (showUnlearnedOnly) display = display.filter(w => !w.learned);
  return display;
}

/******************************
 *  単語シャッフル
 ******************************/
function shuffleWords(arr) {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

/******************************
 *  単語「わからない」マーク
 ******************************/
function markWordAsUnknown(wordObj) {
  const idx = words.findIndex(w => w.word === wordObj.word && w.meaning === wordObj.meaning);
  if (idx !== -1) {
    words[idx].learned = false;
    saveWords();
    renderWordList();
  }
}

/******************************
 *  単語一覧描画
 ******************************/
function renderWordList() {
  const table = document.getElementById("wordTable");
  if (!table) return;

  const wordListArea = document.getElementById("wordListArea");
  if (!testMode && wordListArea) wordListArea.style.display = "block";

  const tbody = table.querySelector("tbody") || table.appendChild(document.createElement("tbody"));
  tbody.innerHTML = "";

  let displayWords = getDisplayWords();
  if (isRandom) {
    if (!shuffledWords) shuffledWords = shuffleWords(displayWords);
    displayWords = shuffledWords;
  } else {
    shuffledWords = null;
  }

  displayWords.forEach((w) => {
    const tr = document.createElement("tr");

    if (w.learned) tr.classList.add("unlearned");

    const tdCheck = document.createElement("td");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = w.learned;
    cb.addEventListener("change", () => {
      const idx = words.findIndex(x => x.word === w.word && x.meaning === w.meaning);
      if (idx !== -1) {
        words[idx].learned = cb.checked;
        if (cb.checked) tr.classList.add("unlearned");
        else tr.classList.remove("unlearned");
        saveWords();
        renderWordList();
      }
    });
    tdCheck.appendChild(cb);
    tr.appendChild(tdCheck);

    const tdWord = document.createElement("td");
    tdWord.innerText = w.word;
    tr.appendChild(tdWord);

    const tdMeaning = document.createElement("td");
    tdMeaning.innerText = w.meaning;
    tr.appendChild(tdMeaning);

    const tdAction = document.createElement("td");
    const speakBtn = document.createElement("button");
    speakBtn.innerText = "発音";
    speakBtn.addEventListener("click", () => speakSpecific(w.word));
    const delBtn = document.createElement("button");
    delBtn.innerText = "削除";
    delBtn.addEventListener("click", () => {
      const idx = words.findIndex(word => word.word === w.word && word.meaning === w.meaning);
      if (idx !== -1) {
        deleteWord(idx);
        renderWordList();
      }
    });
    tdAction.appendChild(speakBtn);
    tdAction.appendChild(delBtn);
    tr.appendChild(tdAction);

    tbody.appendChild(tr);
  });
}

/******************************
 *  単語追加
 ******************************/
/******************************
 *  単語追加処理（重複単語対応付き）
 ******************************/
function addWord() {
  //HTML側のIDに合わせて取得（newWord / newMeaning）
  const wordInput = document.getElementById("newWord");      // 英単語入力欄
  const meaningInput = document.getElementById("newMeaning"); // 意味入力欄
  const word = wordInput.value.trim();
  const meaning = meaningInput.value.trim();

  // 入力チェック
  if (!word || !meaning) {
    alert("単語と意味の両方を入力してください。");
    return;
  }

  //グローバル変数 words を使用（常に最新を扱う）
  const existingEntry = words.find(
    item => item.word.toLowerCase() === word.toLowerCase()
  );

  if (existingEntry) {
    // 同じ単語・同じ意味がすでにある場合
    if (existingEntry.meaning.split(",").map(m => m.trim()).includes(meaning)) {
      alert("この単語と意味はすでに登録されています。");
      return;
    }

    // 同じ単語・違う意味がある場合 → 意味を追記
    existingEntry.meaning += `, ${meaning}`;
    alert("この単語は登録されています。意味を追加しました。");
  } else {
    // 新規登録の場合
    const newWord = {
      word: word,
      meaning: meaning,
      learned: false
    };
    words.push(newWord);
    alert("単語を登録しました。");
  }

  //ローカルストレージにも保存
  saveWords();

  // 入力欄をクリア
  wordInput.value = "";
  meaningInput.value = "";

  // 単語一覧を更新
  renderWordList();
}


/******************************
 *  単語削除
 ******************************/
function deleteWord(index) {
  words.splice(index, 1);
  saveWords();
}

/******************************
 *  localStorage保存
 ******************************/
function saveWords() {
  localStorage.setItem("words", JSON.stringify(words));
}

/******************************
 *  発音関連
 ******************************/
let voices = [];
let voiceSelect = null;

function loadVoices() {
  if (typeof speechSynthesis === "undefined") return;
  voices = speechSynthesis.getVoices();
  if (!voiceSelect) return;
  voiceSelect.innerHTML = "";
  voices.forEach((v, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${v.name} (${v.lang})`;
    voiceSelect.appendChild(opt);
  });

  const googleUS = voices.find(v => v.name.includes("Google US English"));
  if (googleUS) speechVoice = googleUS;
  else if (!speechVoice && voices.length) speechVoice = voices[0];
}

window.speakSpecific = function(word) {
  const utter = new SpeechSynthesisUtterance(word);
  utter.volume = speechVolume;
  utter.rate = speechRate;
  if (speechVoice) utter.voice = speechVoice;
  speechSynthesis.speak(utter);
};

/******************************
 *  モード切替
 ******************************/
window.toggleMode = function() {
  // isRandom の状態を切り替える
  isRandom = !isRandom;
  currentIndex = 0;

  // ボタンの表示テキストを変更
  const toggleButton = document.querySelector('button[onclick="toggleMode()"]');
  if (toggleButton) {
    if (isRandom) {
      toggleButton.textContent = "単語を順番表示にする";
    } else {
      toggleButton.textContent = "単語をランダム表示にする";
    }
  }

  // 単語一覧を更新して即時反映
  renderWordList();
};

/******************************
 * テストモード切替関数
 ******************************/
window.toggleTestMode = function() {
  testMode = !testMode;
  const testArea = document.getElementById("testArea");
  const wordListArea = document.getElementById("wordListArea");
  const addWordArea = document.getElementById("addWordArea");
  const controls = document.getElementById("controls"); // 操作ボタンエリア取得

  if (testMode) {
    // テストモード開始
    wordListArea.style.display = "none";
    testArea.style.display = "block";
    if (addWordArea) addWordArea.style.display = "none";
    if (controls) controls.style.display = "none"; // 操作ボタンを非表示にする

    currentIndex = 0;
    displayTestWord();
  } else {
    // 終了
    testArea.style.display = "none";
    wordListArea.style.display = "block";
    if (!quizMode && addWordArea) addWordArea.style.display = "block";
    if (controls) controls.style.display = "block"; // 操作ボタンを再表示する
  }
};

/******************************
 *4択クイズモード表示制御関数
 ******************************/
window.setQuizMode = function(active) {
  quizMode = active;
  const addWordArea = document.getElementById("addWordArea");
  const controls = document.getElementById("controls"); // クイズ時も考慮
  if (!addWordArea) return;

  if (quizMode || testMode) {
    addWordArea.style.display = "none";
    if (controls) controls.style.display = "none"; // クイズ時も操作ボタン非表示
  } else {
    addWordArea.style.display = "block";
    if (controls) controls.style.display = "block";
  }
};

/******************************
 * テストモードで単語を順に表示する
 ******************************/
function displayTestWord() {
  const testArea = document.getElementById("testArea");
  const wordListTitle = document.getElementById("wordListTitle"); //  単語一覧タイトル
  const appTitle = document.querySelector("h1"); // ★修正: 「英語単語アプリ」タイトル要素を取得
  
  if (wordListTitle) wordListTitle.style.display = "none";      //  テストモード中は非表示
  if (appTitle) appTitle.style.display = "none"; // ★修正: 「英語単語アプリ」を非表示にする

  
  const displayWords = getDisplayWords();
  if (displayWords.length === 0) {
    testArea.innerHTML = "<p>表示する単語がありません。</p>";
    return;
  }

  const w = displayWords[currentIndex];
  testArea.innerHTML = `
    <h3>テストモード</h3>
    <p style="font-size:1.5em;">${w.word}</p>
    <button id="showMeaningBtn">意味を見る</button>
    <button id="nextBtn">次へ</button>
    </div>
    <div style="margin-top: 15px;"> <!-- ★ここで少し余白をとって下に配置 -->
      <button id="testStopBtn" class="stop-btn">中断</button>
    </div>
  `;
   // 意味を見るボタン
  document.getElementById("showMeaningBtn").addEventListener("click", () => {
    testArea.querySelector("p").innerHTML = `${w.word} - ${w.meaning}`;
  });
   // 次へボタン
  document.getElementById("nextBtn").addEventListener("click", () => {
    currentIndex++;
    if (currentIndex >= displayWords.length) {
      testArea.innerHTML = "<p>テスト終了！お疲れさまでした。</p>";
      testMode = false;
      const addWordArea = document.getElementById("addWordArea");
      const controls = document.getElementById("controls");
      if (!quizMode && addWordArea) addWordArea.style.display = "block";
      if (controls) controls.style.display = "block"; 
      if (wordListTitle) wordListTitle.style.display = "block"; // 終了時に再表示
      if (appTitle) appTitle.style.display = "block"; // ★修正: テスト終了時にタイトルを再表示
    } else {
      displayTestWord();
    }
  });

  // 中断ボタン押下時の処理（ホームに戻る）
  //  イベント対象のIDを "testStopBtn" に変更
  document.getElementById("testStopBtn").addEventListener("click", () => { 
    testMode = false; //  モード終了
    testArea.style.display = "none"; //  テスト画面を非表示
    const wordListArea = document.getElementById("wordListArea");
    const addWordArea = document.getElementById("addWordArea");
    const controls = document.getElementById("controls");
    const wordListTitle = document.getElementById("wordListTitle"); //  再表示用

    if (wordListArea) wordListArea.style.display = "block"; //  ホーム画面表示
    if (!quizMode && addWordArea) addWordArea.style.display = "block"; // 
    if (controls) controls.style.display = "block"; // 
    if (wordListTitle) wordListTitle.style.display = "block"; //  「単語一覧」を再表示
    if (appTitle) appTitle.style.display = "block"; // ★修正: 中断時もタイトルを再表示
  });
   
}

/******************************
 *  DOM初期化
 ******************************/
document.addEventListener("DOMContentLoaded", () => {
  voiceSelect = document.getElementById("voiceSelect");
  renderWordList();

  if (typeof speechSynthesis !== "undefined") {
    speechSynthesis.onvoiceschanged = loadVoices;
  }
});

window.words = words;
