/****************************************************
 * 設定パネルの表示・非表示を制御するスクリプト
 * HTML:
 *   <button id="settingsToggle">⚙ 設定</button>
 *   <div id="settingsPanel" class="hidden">...</div>
 * 
 * CSS:
 *   .hidden { display: none; } を想定
 ****************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const settingsToggle = document.getElementById("settingsToggle"); // ⚙ボタン
  const settingsPanel = document.getElementById("settingsPanel");   // 設定パネル本体

  if (settingsToggle && settingsPanel) {
    settingsToggle.addEventListener("click", () => {
      // 「hidden」クラスの付け外しで表示を切り替える
      settingsPanel.classList.toggle("hidden");

      // パネルが表示されたら他の領域がずれないようにスクロール位置を保持
      // （モバイル表示時に開閉で画面が動くのを防ぐため）
      window.scrollTo(0, 0);
    });
  } else {
    // 要素が存在しない場合にエラーにならないよう保護
    console.warn("⚠ 設定ボタンまたは設定パネルが見つかりません。HTML構造を確認してください。");
  }
});
