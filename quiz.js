/*******************************************************
 * quiz.js
 * 4択クイズモード用スクリプト（修正版）
 *******************************************************/

// グローバル変数
let quizWords = [];          // クイズ用単語リスト
let currentQuizIndex = 0;    // 現在の出題番号
let quizInProgress = false;  // クイズ中かどうか

/*******************************************************
 * クイズモード開始
 *******************************************************/
window.startQuizMode = function() {
  if (quizInProgress) return;

  if (!window.words || window.words.length < 4) {
    alert("4単語以上登録してください。");
    return;
  }

  // 単語をランダム順にコピー
  quizWords = [...window.words];
  shuffleArray(quizWords);
  currentQuizIndex = 0;
  quizInProgress = true;

  // ★修正: 「英単語アプリ」タイトルを取得して非表示にする
  const appTitle = document.querySelector("h1"); // <h1>英単語アプリ</h1>
  if (appTitle) appTitle.style.display = "none";

  // 画面切替
  document.getElementById("tableWrapper").style.display = "none";
  document.getElementById("controls").style.display = "none";
  document.getElementById("quizArea").style.display = "block";
  document.getElementById("quizArea").classList.add("quiz-card");
  document.getElementById("wordListTitle").style.display = "none";

  // 単語追加エリアを非表示にする処理を追加
  const addWordArea = document.getElementById("addWordArea");
  if (addWordArea) addWordArea.style.display = "none"; // クイズモード中は非表示

  showQuizQuestion();
};

/*******************************************************
 * 問題表示
 *******************************************************/
function showQuizQuestion() {
  const quizArea = document.getElementById("quizArea");

  if (currentQuizIndex >= quizWords.length) {
    quizArea.innerHTML = `
      <h2>クイズ終了！</h2>
      <button class="exit-btn" onclick="exitQuizMode()">終了して戻る</button>
    `;
    quizInProgress = false;
    return;
  }

  const currentWord = quizWords[currentQuizIndex];
  const correctAnswer = currentWord.meaning;

  // ランダムな選択肢生成
  const choices = [correctAnswer];
  while (choices.length < 4 && window.words.length > 0) {
    const rand = window.words[Math.floor(Math.random() * window.words.length)];
    const randMeaning = rand.meaning;
    if (!choices.includes(randMeaning)) choices.push(randMeaning);
  }
  shuffleArray(choices);

  // クイズ画面描画
  quizArea.innerHTML = `
    <h2>次の単語の意味は？</h2>
    <h3 class="quiz-word">${currentWord.word}</h3>
    <div id="choices"></div>
    <div id="answerFeedback" class="quiz-result"></div>
    <button class="exit-btn" onclick="exitQuizMode()">中断</button>
  `;

  const choicesDiv = document.getElementById("choices");
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.innerText = choice;
    btn.classList.add("quiz-btn");
    btn.addEventListener("click", () => checkAnswer(choice, correctAnswer, currentWord));
    choicesDiv.appendChild(btn);
  });
}

/*******************************************************
 * 回答判定
 *******************************************************/
function checkAnswer(selected, correct, wordObj) {
  const feedback = document.getElementById("answerFeedback");

  if (selected === correct) {
    feedback.innerHTML = "✅ 正解！";
  } else {
    feedback.innerHTML = `❌ 不正解！ 正解は「${correct}」`;

    // ★修正: 間違えた単語は learned=true にして単語一覧を更新
    const idx = window.words.findIndex(
      w => w.word === wordObj.word && w.meaning === wordObj.meaning
    );
    if (idx !== -1) {
      window.words[idx].learned = true;
      // renderWordListはscript.js側で定義されているためquiz.jsから呼び出してOK
      if (typeof renderWordList === "function") renderWordList();
    }
  }

  currentQuizIndex++;
  setTimeout(showQuizQuestion, 1000);
}

/*******************************************************
 * クイズ終了・中断
 *******************************************************/
function exitQuizMode() {
  quizInProgress = false;
  document.getElementById("quizArea").style.display = "none";
  document.getElementById("controls").style.display = "block";
  document.getElementById("tableWrapper").style.display = "block";
  document.getElementById("wordListTitle").style.display = "block";
  document.getElementById("quizArea").classList.remove("quiz-card");

  // 終了時に単語追加エリアを再表示
  const addWordArea = document.getElementById("addWordArea");
  if (addWordArea) addWordArea.style.display = "block"; // クイズ終了後に再表示
}

/*******************************************************
 * 配列シャッフル（Fisher-Yates法）
 *******************************************************/
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/*******************************************************
 * ボタンにイベント紐付け（DOM読み込み後）
 *******************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const quizBtn = document.getElementById("startQuizBtn");
  if (quizBtn && !quizBtn.dataset.bound) {
    quizBtn.addEventListener("click", window.startQuizMode);
    quizBtn.dataset.bound = "true";
  }

  // ページロード時は通常モードなので単語追加エリアを表示しておく
  const addWordArea = document.getElementById("addWordArea");
  if (addWordArea) addWordArea.style.display = "block";
});
