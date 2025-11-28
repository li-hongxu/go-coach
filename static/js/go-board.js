/**
 * 围棋棋盘绘制和交互逻辑
 */

class GoBoard {
    constructor(canvasId, size = 19) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.size = size;
        this.cellSize = 35;  // 每个格子的大小
        this.margin = 30;    // 边距
        
        // 设置画布大小
        this.canvasWidth = this.size * this.cellSize + this.margin * 2;
        this.canvasHeight = this.canvasWidth;
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        
        this.board = Array(size).fill().map(() => Array(size).fill(0)); // 0:空 1:黑 2:白
        this.suggestions = []; // AI建议的位置
        this.highlights = [];  // 高亮显示的位置
        
        // 绑定点击事件
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        this.onCellClick = null; // 点击回调函数
        this.hoveredCell = null; // 鼠标悬停的格子
        
        this.draw();
    }
    
    /**
     * 绘制棋盘
     */
    draw() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // 绘制背景
        this.drawBackground();
        
        // 绘制网格线
        this.drawGrid();
        
        // 绘制星位
        this.drawStarPoints();
        
        // 绘制棋子
        this.drawStones();
        
        // 绘制建议位置
        this.drawSuggestions();
        
        // 绘制高亮位置
        this.drawHighlights();
        
        // 绘制悬停效果
        this.drawHover();
    }
    
    /**
     * 绘制背景
     */
    drawBackground() {
        // 木质纹理背景
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvasWidth, this.canvasHeight);
        gradient.addColorStop(0, '#DEB887');
        gradient.addColorStop(0.5, '#D2B48C');
        gradient.addColorStop(1, '#CD853F');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
    
    /**
     * 绘制网格线
     */
    drawGrid() {
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 1;
        
        // 绘制竖线
        for (let i = 0; i < this.size; i++) {
            const x = this.margin + i * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.margin);
            this.ctx.lineTo(x, this.canvasHeight - this.margin);
            this.ctx.stroke();
        }
        
        // 绘制横线
        for (let i = 0; i < this.size; i++) {
            const y = this.margin + i * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(this.margin, y);
            this.ctx.lineTo(this.canvasWidth - this.margin, y);
            this.ctx.stroke();
        }
    }
    
    /**
     * 绘制星位（天元、角星等）
     */
    drawStarPoints() {
        const starPoints = this.getStarPoints();
        
        this.ctx.fillStyle = '#8B4513';
        for (const [x, y] of starPoints) {
            const pixelX = this.margin + x * this.cellSize;
            const pixelY = this.margin + y * this.cellSize;
            
            this.ctx.beginPath();
            this.ctx.arc(pixelX, pixelY, 3, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }
    
    /**
     * 获取星位坐标
     */
    getStarPoints() {
        if (this.size === 19) {
            return [
                [3, 3], [3, 9], [3, 15],
                [9, 3], [9, 9], [9, 15],
                [15, 3], [15, 9], [15, 15]
            ];
        } else if (this.size === 13) {
            return [
                [3, 3], [3, 9],
                [6, 6],
                [9, 3], [9, 9]
            ];
        } else if (this.size === 9) {
            return [
                [2, 2], [2, 6],
                [4, 4],
                [6, 2], [6, 6]
            ];
        }
        return [];
    }
    
    /**
     * 绘制棋子
     */
    drawStones() {
        const stoneRadius = this.cellSize * 0.4;
        
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                if (this.board[x][y] !== 0) {
                    const pixelX = this.margin + x * this.cellSize;
                    const pixelY = this.margin + y * this.cellSize;
                    
                    // 绘制棋子阴影
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    this.ctx.beginPath();
                    this.ctx.arc(pixelX + 2, pixelY + 2, stoneRadius, 0, 2 * Math.PI);
                    this.ctx.fill();
                    
                    // 绘制棋子
                    if (this.board[x][y] === 1) {
                        // 黑棋
                        const blackGradient = this.ctx.createRadialGradient(
                            pixelX - stoneRadius/3, pixelY - stoneRadius/3, 0,
                            pixelX, pixelY, stoneRadius
                        );
                        blackGradient.addColorStop(0, '#444');
                        blackGradient.addColorStop(1, '#000');
                        this.ctx.fillStyle = blackGradient;
                    } else {
                        // 白棋
                        const whiteGradient = this.ctx.createRadialGradient(
                            pixelX - stoneRadius/3, pixelY - stoneRadius/3, 0,
                            pixelX, pixelY, stoneRadius
                        );
                        whiteGradient.addColorStop(0, '#fff');
                        whiteGradient.addColorStop(1, '#ddd');
                        this.ctx.fillStyle = whiteGradient;
                    }
                    
                    this.ctx.beginPath();
                    this.ctx.arc(pixelX, pixelY, stoneRadius, 0, 2 * Math.PI);
                    this.ctx.fill();
                    
                    // 棋子边框
                    this.ctx.strokeStyle = this.board[x][y] === 1 ? '#333' : '#bbb';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        }
    }
    
    /**
     * 绘制AI建议位置
     */
    drawSuggestions() {
        for (let i = 0; i < this.suggestions.length; i++) {
            const [x, y, score, reason] = this.suggestions[i];
            const pixelX = this.margin + x * this.cellSize;
            const pixelY = this.margin + y * this.cellSize;
            
            // 不同排名使用不同颜色
            let color;
            if (i === 0) color = '#ff4757';      // 最佳选择：红色
            else if (i === 1) color = '#ffa502';  // 第二选择：橙色
            else color = '#2ed573';               // 其他选择：绿色
            
            // 绘制建议圆圈
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(pixelX, pixelY, this.cellSize * 0.3, 0, 2 * Math.PI);
            this.ctx.stroke();
            
            // 绘制排名数字
            this.ctx.fillStyle = color;
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText((i + 1).toString(), pixelX, pixelY);
        }
    }
    
    /**
     * 绘制高亮位置
     */
    drawHighlights() {
        for (const [x, y, color = '#ff6b6b'] of this.highlights) {
            const pixelX = this.margin + x * this.cellSize;
            const pixelY = this.margin + y * this.cellSize;
            
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(pixelX, pixelY, this.cellSize * 0.35, 0, 2 * Math.PI);
            this.ctx.stroke();
        }
    }
    
    /**
     * 绘制鼠标悬停效果
     */
    drawHover() {
        if (this.hoveredCell) {
            const [x, y] = this.hoveredCell;
            const pixelX = this.margin + x * this.cellSize;
            const pixelY = this.margin + y * this.cellSize;
            
            this.ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(pixelX, pixelY, this.cellSize * 0.2, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }
    
    /**
     * 处理鼠标点击
     */
    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const boardX = Math.round((x - this.margin) / this.cellSize);
        const boardY = Math.round((y - this.margin) / this.cellSize);
        
        if (boardX >= 0 && boardX < this.size && boardY >= 0 && boardY < this.size) {
            if (this.onCellClick) {
                this.onCellClick(boardX, boardY);
            }
        }
    }
    
    /**
     * 处理鼠标移动
     */
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const boardX = Math.round((x - this.margin) / this.cellSize);
        const boardY = Math.round((y - this.margin) / this.cellSize);
        
        if (boardX >= 0 && boardX < this.size && boardY >= 0 && boardY < this.size) {
            if (!this.hoveredCell || this.hoveredCell[0] !== boardX || this.hoveredCell[1] !== boardY) {
                this.hoveredCell = [boardX, boardY];
                this.draw();
            }
        } else {
            if (this.hoveredCell) {
                this.hoveredCell = null;
                this.draw();
            }
        }
    }
    
    /**
     * 更新棋盘状态
     */
    updateBoard(boardData) {
        this.board = boardData;
        this.draw();
    }
    
    /**
     * 显示AI建议
     */
    showSuggestions(suggestions) {
        this.suggestions = suggestions;
        this.draw();
    }
    
    /**
     * 清除建议
     */
    clearSuggestions() {
        this.suggestions = [];
        this.draw();
    }
    
    /**
     * 添加高亮位置
     */
    addHighlight(x, y, color = '#ff6b6b') {
        this.highlights.push([x, y, color]);
        this.draw();
    }
    
    /**
     * 清除高亮
     */
    clearHighlights() {
        this.highlights = [];
        this.draw();
    }
    
    /**
     * 重置棋盘大小
     */
    resize(newSize) {
        this.size = newSize;
        this.board = Array(newSize).fill().map(() => Array(newSize).fill(0));
        
        // 重新计算画布大小
        this.canvasWidth = this.size * this.cellSize + this.margin * 2;
        this.canvasHeight = this.canvasWidth;
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        
        this.clearSuggestions();
        this.clearHighlights();
        this.draw();
    }
    
    /**
     * 获取棋盘坐标对应的屏幕坐标
     */
    getBoardPixelPosition(boardX, boardY) {
        return {
            x: this.margin + boardX * this.cellSize,
            y: this.margin + boardY * this.cellSize
        };
    }
}