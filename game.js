class Game2048 {
    constructor(gridSize = 4) {
        this.gridSize = gridSize;
        this.grid = [];
        this.tiles = new Map(); // Store tile elements
        this.score = 0;
        this.bestScore = localStorage.getItem('best2048Score') || 0;
        
        this.initializeGrid();
        this.setupEventListeners();
        this.updateScoreDisplay();
        this.spawnInitialTiles();
    }

    initializeGrid() {
        const gridElement = document.querySelector('.grid');
        gridElement.innerHTML = '';

        // Create background grid cells
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = new Array(this.gridSize).fill(0);
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.style.top = this.calculatePosition(row);
                cell.style.left = this.calculatePosition(col);
                gridElement.appendChild(cell);
            }
        }
    }

    calculatePosition(pos) {
        return (pos * (100 / this.gridSize)) + '%';
    }

    createTileElement(value, row, col) {
        const tile = document.createElement('div');
        tile.className = `tile tile-${value} new`;
        tile.textContent = value;
        tile.style.top = this.calculatePosition(row);
        tile.style.left = this.calculatePosition(col);
        return tile;
    }

    spawnInitialTiles() {
        this.spawnTile();
        this.spawnTile();
    }

    spawnTile() {
        const emptyCells = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 0) {
                    emptyCells.push({row, col});
                }
            }
        }

        if (emptyCells.length > 0) {
            const {row, col} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            this.grid[row][col] = value;

            const tile = this.createTileElement(value, row, col);
            document.querySelector('.grid').appendChild(tile);
            this.tiles.set(`${row}-${col}`, tile);
        }
    }

    moveTile(fromRow, fromCol, toRow, toCol, value) {
        const tile = this.tiles.get(`${fromRow}-${fromCol}`);
        if (tile) {
            tile.style.top = this.calculatePosition(toRow);
            tile.style.left = this.calculatePosition(toCol);
            this.tiles.delete(`${fromRow}-${fromCol}`);
            this.tiles.set(`${toRow}-${toCol}`, tile);
        }
    }

    mergeTiles(tile1Pos, tile2Pos, toRow, toCol, newValue) {
        const tile1 = this.tiles.get(tile1Pos);
        const tile2 = this.tiles.get(tile2Pos);
        
        if (tile1 && tile2) {
            // Remove the merged tiles
            tile1.remove();
            tile2.remove();
            this.tiles.delete(tile1Pos);
            this.tiles.delete(tile2Pos);

            // Create new merged tile
            const newTile = this.createTileElement(newValue, toRow, toCol);
            newTile.classList.remove('new');
            newTile.classList.add('merged');
            document.querySelector('.grid').appendChild(newTile);
            this.tiles.set(`${toRow}-${toCol}`, newTile);
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        document.getElementById('restart-btn').addEventListener('click', this.restartGame.bind(this));
        
        // Touch support
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (Math.abs(diffX) > 50) {
                    diffX > 0 ? this.moveRight() : this.moveLeft();
                }
            } else {
                if (Math.abs(diffY) > 50) {
                    diffY > 0 ? this.moveDown() : this.moveUp();
                }
            }
        });
    }

    handleKeyPress(event) {
        if (event.key.startsWith('Arrow')) {
            event.preventDefault();
            switch(event.key) {
                case 'ArrowUp': this.moveUp(); break;
                case 'ArrowDown': this.moveDown(); break;
                case 'ArrowLeft': this.moveLeft(); break;
                case 'ArrowRight': this.moveRight(); break;
            }
        }
    }

    moveLeft() {
        let moved = false;
        for (let row = 0; row < this.gridSize; row++) {
            const rowTiles = this.grid[row].map((val, col) => ({val, col})).filter(x => x.val !== 0);
            const newRow = new Array(this.gridSize).fill(0);
            let newCol = 0;
            
            for (let i = 0; i < rowTiles.length; i++) {
                if (i + 1 < rowTiles.length && rowTiles[i].val === rowTiles[i + 1].val) {
                    // Merge tiles
                    const newValue = rowTiles[i].val * 2;
                    newRow[newCol] = newValue;
                    this.mergeTiles(
                        `${row}-${rowTiles[i].col}`,
                        `${row}-${rowTiles[i + 1].col}`,
                        row, newCol, newValue
                    );
                    this.score += newValue;
                    i++;
                } else {
                    // Move tile
                    newRow[newCol] = rowTiles[i].val;
                    this.moveTile(row, rowTiles[i].col, row, newCol, rowTiles[i].val);
                }
                newCol++;
            }
            
            if (!this.arraysEqual(this.grid[row], newRow)) {
                moved = true;
                this.grid[row] = newRow;
            }
        }
        this.afterMove(moved);
    }

    moveRight() {
        let moved = false;
        for (let row = 0; row < this.gridSize; row++) {
            const rowTiles = this.grid[row].map((val, col) => ({val, col})).filter(x => x.val !== 0).reverse();
            const newRow = new Array(this.gridSize).fill(0);
            let newCol = this.gridSize - 1;
            
            for (let i = 0; i < rowTiles.length; i++) {
                if (i + 1 < rowTiles.length && rowTiles[i].val === rowTiles[i + 1].val) {
                    // Merge tiles
                    const newValue = rowTiles[i].val * 2;
                    newRow[newCol] = newValue;
                    this.mergeTiles(
                        `${row}-${rowTiles[i].col}`,
                        `${row}-${rowTiles[i + 1].col}`,
                        row, newCol, newValue
                    );
                    this.score += newValue;
                    i++;
                } else {
                    // Move tile
                    newRow[newCol] = rowTiles[i].val;
                    this.moveTile(row, rowTiles[i].col, row, newCol, rowTiles[i].val);
                }
                newCol--;
            }
            
            if (!this.arraysEqual(this.grid[row], newRow)) {
                moved = true;
                this.grid[row] = newRow;
            }
        }
        this.afterMove(moved);
    }

    moveUp() {
        let moved = false;
        for (let col = 0; col < this.gridSize; col++) {
            const colTiles = this.grid.map((row, i) => ({val: row[col], row: i})).filter(x => x.val !== 0);
            const newCol = new Array(this.gridSize).fill(0);
            let newRow = 0;
            
            for (let i = 0; i < colTiles.length; i++) {
                if (i + 1 < colTiles.length && colTiles[i].val === colTiles[i + 1].val) {
                    // Merge tiles
                    const newValue = colTiles[i].val * 2;
                    newCol[newRow] = newValue;
                    this.mergeTiles(
                        `${colTiles[i].row}-${col}`,
                        `${colTiles[i + 1].row}-${col}`,
                        newRow, col, newValue
                    );
                    this.score += newValue;
                    i++;
                } else {
                    // Move tile
                    newCol[newRow] = colTiles[i].val;
                    this.moveTile(colTiles[i].row, col, newRow, col, colTiles[i].val);
                }
                newRow++;
            }
            
            let changed = false;
            for (let row = 0; row < this.gridSize; row++) {
                if (this.grid[row][col] !== newCol[row]) {
                    changed = true;
                    this.grid[row][col] = newCol[row];
                }
            }
            if (changed) moved = true;
        }
        this.afterMove(moved);
    }

    moveDown() {
        let moved = false;
        for (let col = 0; col < this.gridSize; col++) {
            const colTiles = this.grid.map((row, i) => ({val: row[col], row: i})).filter(x => x.val !== 0).reverse();
            const newCol = new Array(this.gridSize).fill(0);
            let newRow = this.gridSize - 1;
            
            for (let i = 0; i < colTiles.length; i++) {
                if (i + 1 < colTiles.length && colTiles[i].val === colTiles[i + 1].val) {
                    // Merge tiles
                    const newValue = colTiles[i].val * 2;
                    newCol[newRow] = newValue;
                    this.mergeTiles(
                        `${colTiles[i].row}-${col}`,
                        `${colTiles[i + 1].row}-${col}`,
                        newRow, col, newValue
                    );
                    this.score += newValue;
                    i++;
                } else {
                    // Move tile
                    newCol[newRow] = colTiles[i].val;
                    this.moveTile(colTiles[i].row, col, newRow, col, colTiles[i].val);
                }
                newRow--;
            }
            
            let changed = false;
            for (let row = 0; row < this.gridSize; row++) {
                if (this.grid[row][col] !== newCol[row]) {
                    changed = true;
                    this.grid[row][col] = newCol[row];
                }
            }
            if (changed) moved = true;
        }
        this.afterMove(moved);
    }

    afterMove(moved) {
        if (moved) {
            setTimeout(() => {
                this.spawnTile();
                this.updateScoreDisplay();
                this.checkGameOver();
            }, 150); // Wait for animations to complete
        }
    }

    updateScoreDisplay() {
        document.getElementById('score').textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('best2048Score', this.bestScore);
        }
        document.getElementById('best-score').textContent = this.bestScore;
    }

    checkGameOver() {
        // Check if any moves are possible
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 0) return; // Empty cell exists
                
                // Check adjacent cells for possible merges
                if (row > 0 && this.grid[row][col] === this.grid[row-1][col]) return;
                if (row < this.gridSize-1 && this.grid[row][col] === this.grid[row+1][col]) return;
                if (col > 0 && this.grid[row][col] === this.grid[row][col-1]) return;
                if (col < this.gridSize-1 && this.grid[row][col] === this.grid[row][col+1]) return;
            }
        }
        
        // Game over
        this.gameOver();
    }

    gameOver() {
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').style.display = 'flex';
    }

    restartGame() {
        // Remove all existing tiles
        this.tiles.forEach(tile => tile.remove());
        this.tiles.clear();
        
        this.grid = [];
        this.score = 0;
        document.getElementById('game-over').style.display = 'none';
        this.initializeGrid();
        this.updateScoreDisplay();
        this.spawnInitialTiles();
    }

    arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
