let board = Array(9).fill(null); // 棋盤狀態
let current = 'X'; // 當前玩家（玩家為X）
let active = true;

function init() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    board = Array(9).fill(null);
    active = true;
    current = 'X';
    document.getElementById('status').innerText = '玩家 (X) 先手';

    // 建立 9 個格子
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.onclick = () => playerMove(i);
        boardEl.appendChild(cell);
    }
}

function playerMove(i) {
    if (!active || board[i]) return;

    board[i] = 'X';
    updateBoard();

    if (checkWin('X')) {
        endGame('玩家 (X) 勝利！');
        return;
    } else if (isFull()) {
        endGame('平手！');
        return;
    }

    current = 'O';
    document.getElementById('status').innerText = '電腦思考中...';

    // 模擬思考時間
    setTimeout(computerMove, 700);
}

function computerMove() {
    // 1. 嘗試自己獲勝
    let move = findWinningMove('O');

    // 2. 嘗試阻止玩家獲勝
    if (move == null) move = findWinningMove('X');

    // 3. 否則隨機
    if (move == null) move = getRandomMove();

    // 安全檢查：若 move 無效，結束遊戲
    if (move == null || typeof move !== 'number') {
        endGame('平手！');
        return;
    }

    board[move] = 'O';
    updateBoard();

    if (checkWin('O')) {
        endGame('電腦 (O) 勝利！');
        return;
    } else if (isFull()) {
        endGame('平手！');
        return;
    }

    current = 'X';
    document.getElementById('status').innerText = '輪到玩家 (X)';
}

function findWinningMove(player) {
    const wins = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ];

    for (let [a, b, c] of wins) {
        const line = [board[a], board[b], board[c]];

        // 若該線上已有兩個相同 player，且有一格是 null，就回傳那格
        if (line.filter(v => v === player).length === 2 && line.includes(null)) {
            return [a, b, c][line.indexOf(null)];
        }
    }

    return null; // 🔥 必須要，不然會回 undefined
}

function getRandomMove() {
    const empty = board
        .map((v, i) => (v === null ? i : null))
        .filter(v => v !== null);

    if (empty.length === 0) return null;

    return empty[Math.floor(Math.random() * empty.length)];
}

/* --------------------------------------------------
   更新棋盤（加入彈跳動畫）
-------------------------------------------------- */
function updateBoard() {
    const cells = document.getElementsByClassName('cell');

    for (let i = 0; i < 9; i++) {
        const old = cells[i].innerText;
        const now = board[i] || '';

        cells[i].innerText = now;

        // 新下子才播放動畫
        if (now && old !== now) {
            cells[i].classList.add('played');
            setTimeout(() => cells[i].classList.remove('played'), 250);
        }
    }
}

/* --------------------------------------------------
   判斷勝利
-------------------------------------------------- */
function checkWin(player) {
    const wins = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ];

    return wins.some(([a,b,c]) =>
        board[a] === player &&
        board[b] === player &&
        board[c] === player
    );
}

/* --------------------------------------------------
   勝利亮光效果
-------------------------------------------------- */
function highlightWin(player) {
    const wins = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ];

    const cells = document.getElementsByClassName('cell');

    for (let [a, b, c] of wins) {
        if (board[a] === player && board[b] === player && board[c] === player) {
            cells[a].classList.add('win');
            cells[b].classList.add('win');
            cells[c].classList.add('win');
        }
    }
}

function isFull() {
    return board.every(cell => cell !== null);
}

function endGame(message) {
    document.getElementById('status').innerText = message;
    active = false;

    // 若是勝利訊息 → 顯示亮光
    if (message.includes('勝利')) {
        const player = message.includes('玩家') ? 'X' : 'O';
        highlightWin(player);
    }
}

function resetGame() {
    init();
}

// 初始化
init();
