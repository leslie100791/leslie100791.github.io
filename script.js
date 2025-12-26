class NineBoardGo {
    constructor() {
        this.size = 9;
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.history = []; 
        this.currentPlayer = 1; // 1: 黑, -1: 白
        this.koPoint = null; 
        this.consecutivePasses = 0;
        this.gameOver = false;
        this.aiEnabled = true;
        this.lastMove = null;

        this.initDOM();
        this.updateDisplay();
    }

    initDOM() {
        const grid = document.getElementById('board-grid');
        grid.innerHTML = '';
        for (let i = 0; i < 64; i++) grid.appendChild(document.createElement('div'));

        const boardEl = document.getElementById('board');
        boardEl.innerHTML = '';
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.onclick = () => this.handleMove(r, c);
                boardEl.appendChild(cell);
            }
        }
    }

    handleMove(r, c) {
        if (this.gameOver || this.board[r][c] !== 0) return;
        if (this.currentPlayer === -1 && this.aiEnabled) return;

        if (this.executeMove(r, c, this.currentPlayer)) {
            this.consecutivePasses = 0;
            if (this.aiEnabled && !this.gameOver) {
                setTimeout(() => this.aiMove(), 500);
            }
        }
    }

    executeMove(r, c, player) {
        if (this.koPoint && this.koPoint.r === r && this.koPoint.c === c) {
            alert("打劫禁著點！請先下他處。");
            return false;
        }

        let nextBoard = JSON.parse(JSON.stringify(this.board));
        nextBoard[r][c] = player;
        
        let captured = this.checkCaptures(nextBoard, r, c, player);
        
        if (captured.length === 0 && !this.hasLiberties(nextBoard, r, c)) {
            alert("不可自殺！");
            return false;
        }

        this.koPoint = (captured.length === 1) ? { r: captured[0].r, c: captured[0].c } : null;

        this.history.push(JSON.parse(JSON.stringify(this.board)));
        this.board = nextBoard;
        this.lastMove = { r, c }; // 儲存最後一手位置
        this.currentPlayer = -player;
        this.updateDisplay();
        return true;
    }

    checkCaptures(board, r, c, player) {
        const opponent = -player;
        const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
        let allCaptured = [];

        dirs.forEach(([dr, dc]) => {
            const nr = r + dr, nc = c + dc;
            if (this.inBounds(nr, nc) && board[nr][nc] === opponent) {
                if (!this.hasLiberties(board, nr, nc)) {
                    allCaptured.push(...this.removeGroup(board, nr, nc));
                }
            }
        });
        return allCaptured;
    }

    hasLiberties(board, r, c) {
        const player = board[r][c];
        const visited = new Set();
        const stack = [[r, c]];
        while (stack.length > 0) {
            const [currR, currC] = stack.pop();
            const key = `${currR},${currC}`;
            if (visited.has(key)) continue;
            visited.add(key);

            const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
            for (let [dr, dc] of dirs) {
                const nr = currR + dr, nc = currC + dc;
                if (this.inBounds(nr, nc)) {
                    if (board[nr][nc] === 0) return true;
                    if (board[nr][nc] === player && !visited.has(`${nr},${nc}`)) {
                        stack.push([nr, nc]);
                    }
                }
            }
        }
        return false;
    }

    removeGroup(board, r, c) {
        const player = board[r][c];
        const group = [];
        const stack = [[r, c]];
        const visitedGroup = new Set();
        
        while (stack.length > 0) {
            const [currR, currC] = stack.pop();
            const key = `${currR},${currC}`;
            if (visitedGroup.has(key)) continue;
            visitedGroup.add(key);
            
            group.push({r: currR, c: currC});
            [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dr, dc]) => {
                const nr = currR + dr, nc = currC + dc;
                if (this.inBounds(nr, nc) && board[nr][nc] === player) stack.push([nr, nc]);
            });
        }
        group.forEach(p => board[p.r][p.c] = 0);
        return group;
    }

    pass() {
        this.consecutivePasses++;
        this.history.push(JSON.parse(JSON.stringify(this.board)));
        if (this.consecutivePasses >= 2) {
            this.endGame();
        } else {
            this.currentPlayer = -this.currentPlayer;
            this.updateDisplay();
            if (this.aiEnabled && this.currentPlayer === -1) setTimeout(() => this.aiMove(), 500);
        }
    }

    undoMove() {
        if (this.history.length > 0) {
            this.board = this.history.pop();
            this.currentPlayer = -this.currentPlayer;
            this.gameOver = false;
            this.lastMove = null; // 悔棋後暫時清除最後一手標記
            this.updateDisplay();
        }
    }

    aiMove() {
        if (this.gameOver) return;
        let coords = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.board[r][c] === 0 && this.isValidMove(r, c, -1)) coords.push({r, c});
            }
        }
        if (coords.length > 0) {
            const move = coords[Math.floor(Math.random() * coords.length)];
            this.executeMove(move.r, move.c, -1);
        } else {
            this.pass();
        }
    }

    isValidMove(r, c, player) {
        let tempBoard = JSON.parse(JSON.stringify(this.board));
        tempBoard[r][c] = player;
        if (this.checkCaptures(tempBoard, r, c, player).length > 0) return true;
        return this.hasLiberties(tempBoard, r, c);
    }

    updateDisplay() {
        const cells = document.querySelectorAll('.cell');
        let bCount = 0, wCount = 0;
        
        this.board.flat().forEach((val, i) => {
            cells[i].innerHTML = '';
            const r = Math.floor(i / 9);
            const c = i % 9;
            
            if (val !== 0) {
                const stone = document.createElement('div');
                stone.className = `stone ${val === 1 ? 'black' : 'white'}`;
                
                // 修正：檢查是否為最後一手
                if (this.lastMove && r === this.lastMove.r && c === this.lastMove.c) {
                    stone.classList.add('last-move');
                }
                
                cells[i].appendChild(stone);
                val === 1 ? bCount++ : wCount++;
            }
        });

        document.getElementById('blackScore').textContent = bCount;
        document.getElementById('whiteScore').textContent = wCount;
        document.getElementById('status').textContent = this.gameOver ? "遊戲結束" : (this.currentPlayer === 1 ? "⚫ 黑棋回合" : "⚪ 白棋回合");
        document.getElementById('passCount').textContent = this.consecutivePasses;
    }

    endGame() {
        this.gameOver = true;
        let blackArea = this.calculateArea(1);
        let whiteArea = this.calculateArea(-1);
        let komi = 3.75;
        let result = blackArea - (whiteArea + komi);
        
        let msg = `終局！黑:${blackArea}, 白:${whiteArea}+${komi}\n`;
        msg += result > 0 ? `黑棋勝 ${result} 子` : `白棋勝 ${Math.abs(result)} 子`;
        alert(msg);
        this.updateDisplay();
    }

    calculateArea(player) {
        let count = 0;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.board[r][c] === player) count++;
            }
        }
        return count; 
    }

    inBounds(r, c) { return r >= 0 && r < 9 && c >= 0 && c < 9; }
}

let game = new NineBoardGo();
function newGame() { game = new NineBoardGo(); }
function toggleAI() {
    if (!game) return;
    game.aiEnabled = !game.aiEnabled;
    document.getElementById('aiBtn').textContent = `AI: ${game.aiEnabled ? '開' : '關'}`;
    if (game.aiEnabled && game.currentPlayer === -1 && !game.gameOver) {
        setTimeout(() => game.aiMove(), 500);
    }
}