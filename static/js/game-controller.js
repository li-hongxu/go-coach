/**
 * 游戏控制器 - 处理游戏逻辑和UI交互
 */

class GameController {
    constructor() {
        this.board = null;
        this.gameId = null;
        this.isPlayerTurn = true;
        
        // UI元素
        this.elements = {
            newGameBtn: document.getElementById('new-game-btn'),
            getHintBtn: document.getElementById('get-hint-btn'),
            aiMoveBtn: document.getElementById('ai-move-btn'),
            resetBtn: document.getElementById('reset-btn'),
            difficulty: document.getElementById('difficulty'),
            boardSize: document.getElementById('board-size'),
            currentPlayerDisplay: document.getElementById('current-player-display'),
            blackCaptured: document.getElementById('black-captured'),
            whiteCaptured: document.getElementById('white-captured'),
            moveCount: document.getElementById('move-count'),
            suggestionsList: document.getElementById('suggestions-list'),
            analysisResult: document.getElementById('analysis-result'),
            messageLog: document.getElementById('message-log')
        };
    }
    
    /**
     * 初始化游戏
     */
    init() {
        // 创建棋盘
        this.board = new GoBoard('go-board', 19);
        this.board.onCellClick = this.handleCellClick.bind(this);
        
        // 绑定按钮事件
        this.elements.newGameBtn.addEventListener('click', this.startNewGame.bind(this));
        this.elements.getHintBtn.addEventListener('click', this.getHint.bind(this));
        this.elements.aiMoveBtn.addEventListener('click', this.makeAIMove.bind(this));
        this.elements.resetBtn.addEventListener('click', this.resetGame.bind(this));
        
        // 自动开始新游戏
        this.startNewGame();
        
        this.addMessage('欢迎使用围棋AI教练！点击"新游戏"开始。', 'info');
    }
    
    /**
     * 开始新游戏
     */
    async startNewGame() {
        const size = parseInt(this.elements.boardSize.value);
        const difficulty = this.elements.difficulty.value;
        
        try {
            this.setLoading(true);
            
            const response = await fetch('/api/new_game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    size: size,
                    difficulty: difficulty
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.gameId = data.game_id;
                this.board.resize(size);
                this.updateGameState(data.state);
                this.board.clearSuggestions();
                this.elements.suggestionsList.innerHTML = '';
                this.elements.analysisResult.innerHTML = '';
                this.addMessage(`新游戏开始！棋盘大小：${size}x${size}，AI难度：${difficulty}`, 'success');
            } else {
                this.addMessage('创建游戏失败：' + data.message, 'error');
            }
        } catch (error) {
            console.error('创建游戏时出错:', error);
            this.addMessage('创建游戏时出错，请重试。', 'error');
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * 处理棋盘点击
     */
    async handleCellClick(x, y) {
        if (!this.isPlayerTurn) {
            this.addMessage('请等待AI思考...', 'info');
            return;
        }
        
        try {
            this.setLoading(true);
            
            const response = await fetch('/api/make_move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    x: x,
                    y: y
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateGameState(data.state);
                this.board.clearSuggestions();
                this.elements.suggestionsList.innerHTML = '';
                
                // 显示落子分析
                if (data.analysis) {
                    this.showAnalysis(data.analysis);
                }
                
                // 高亮刚下的棋子
                this.board.clearHighlights();
                this.board.addHighlight(x, y, '#4CAF50');
                
                this.addMessage(`落子成功：(${x}, ${y})`, 'success');
                
                // 如果提取了对手棋子
                if (data.captured && data.captured.length > 0) {
                    this.addMessage(`提取了 ${data.captured.length} 个棋子`, 'info');
                }
            } else {
                this.addMessage('落子失败：' + data.message, 'error');
            }
        } catch (error) {
            console.error('落子时出错:', error);
            this.addMessage('落子时出错，请重试。', 'error');
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * 获取AI提示
     */
    async getHint() {
        try {
            this.setLoading(true);
            
            const response = await fetch('/api/get_suggestion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    top_n: 5
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuggestions(data.suggestions);
                this.board.showSuggestions(data.suggestions);
                this.addMessage('AI建议已更新', 'info');
            } else {
                this.addMessage('获取建议失败：' + data.message, 'error');
            }
        } catch (error) {
            console.error('获取建议时出错:', error);
            this.addMessage('获取建议时出错，请重试。', 'error');
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * AI自动落子
     */
    async makeAIMove() {
        try {
            this.setLoading(true);
            this.isPlayerTurn = false;
            
            const response = await fetch('/api/ai_move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateGameState(data.state);
                this.board.clearSuggestions();
                this.elements.suggestionsList.innerHTML = '';
                
                // 高亮AI的落子
                this.board.clearHighlights();
                const [aiX, aiY] = data.position;
                this.board.addHighlight(aiX, aiY, '#FF5722');
                
                this.addMessage(`AI落子：(${aiX}, ${aiY}) - ${data.ai_reason}`, 'info');
                
                if (data.captured && data.captured.length > 0) {
                    this.addMessage(`AI提取了 ${data.captured.length} 个棋子`, 'info');
                }
            } else {
                this.addMessage('AI落子失败：' + data.message, 'error');
            }
        } catch (error) {
            console.error('AI落子时出错:', error);
            this.addMessage('AI落子时出错，请重试。', 'error');
        } finally {
            this.setLoading(false);
            this.isPlayerTurn = true;
        }
    }
    
    /**
     * 重置游戏
     */
    async resetGame() {
        if (!confirm('确定要重置游戏吗？')) {
            return;
        }
        
        try {
            this.setLoading(true);
            
            const response = await fetch('/api/reset_game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateGameState(data.state);
                this.board.clearSuggestions();
                this.board.clearHighlights();
                this.elements.suggestionsList.innerHTML = '';
                this.elements.analysisResult.innerHTML = '';
                this.addMessage('游戏已重置', 'success');
            } else {
                this.addMessage('重置失败：' + data.message, 'error');
            }
        } catch (error) {
            console.error('重置游戏时出错:', error);
            this.addMessage('重置游戏时出错，请重试。', 'error');
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * 更新游戏状态显示
     */
    updateGameState(state) {
        // 更新棋盘
        this.board.updateBoard(state.board);
        
        // 更新当前玩家
        this.elements.currentPlayerDisplay.textContent = state.current_player === 1 ? '黑棋' : '白棋';
        
        // 更新被提子数
        this.elements.blackCaptured.textContent = state.captured[1] || 0;
        this.elements.whiteCaptured.textContent = state.captured[2] || 0;
        
        // 更新手数
        this.elements.moveCount.textContent = state.move_count || 0;
    }
    
    /**
     * 显示AI建议
     */
    showSuggestions(suggestions) {
        this.elements.suggestionsList.innerHTML = '';
        
        suggestions.forEach((suggestion, index) => {
            const [x, y, score, reason] = suggestion;
            
            const suggestionDiv = document.createElement('div');
            suggestionDiv.className = 'suggestion-item';
            suggestionDiv.innerHTML = `
                <div class=\"suggestion-position\">第${index + 1}选择: (${x}, ${y})</div>
                <div class=\"suggestion-reason\">${reason}</div>
                <div class=\"suggestion-score\">评分: ${score.toFixed(1)}</div>
            `;
            
            // 点击建议项可以高亮对应位置
            suggestionDiv.addEventListener('click', () => {
                this.board.clearHighlights();
                this.board.addHighlight(x, y, '#2196F3');
            });
            
            this.elements.suggestionsList.appendChild(suggestionDiv);
        });
    }
    
    /**
     * 显示落子分析
     */
    showAnalysis(analysis) {
        const ratingClass = {
            '优秀': 'rating-excellent',
            '良好': 'rating-good', 
            '一般': 'rating-average',
            '较差': 'rating-poor'
        };
        
        this.elements.analysisResult.innerHTML = `
            <div class=\"analysis-rating ${ratingClass[analysis.rating] || ''}\">${analysis.rating}</div>
            <div class=\"analysis-message\">${analysis.message}</div>
            ${analysis.score !== undefined ? `<div class=\"analysis-score\">评分: ${analysis.score.toFixed(1)}</div>` : ''}
        `;
        
        // 如果有更好的建议，显示出来
        if (analysis.suggestions && analysis.suggestions.length > 0) {
            const betterMoves = document.createElement('div');
            betterMoves.innerHTML = '<h4>更好的选择:</h4>';
            
            analysis.suggestions.slice(0, 3).forEach((suggestion, index) => {
                const [x, y, score, reason] = suggestion;
                const moveDiv = document.createElement('div');
                moveDiv.className = 'suggestion-item';
                moveDiv.style.fontSize = '0.9em';
                moveDiv.innerHTML = `
                    <div class=\"suggestion-position\">(${x}, ${y}) - ${reason}</div>
                    <div class=\"suggestion-score\">评分: ${score.toFixed(1)}</div>
                `;
                betterMoves.appendChild(moveDiv);
            });
            
            this.elements.analysisResult.appendChild(betterMoves);
        }
    }
    
    /**
     * 添加消息到日志
     */
    addMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
        
        this.elements.messageLog.appendChild(messageDiv);
        
        // 滚动到最新消息
        this.elements.messageLog.scrollTop = this.elements.messageLog.scrollHeight;
        
        // 限制消息数量
        const messages = this.elements.messageLog.children;
        if (messages.length > 50) {
            this.elements.messageLog.removeChild(messages[0]);
        }
    }
    
    /**
     * 设置加载状态
     */
    setLoading(isLoading) {
        const buttons = [
            this.elements.newGameBtn,
            this.elements.getHintBtn,
            this.elements.aiMoveBtn,
            this.elements.resetBtn
        ];
        
        buttons.forEach(btn => {
            btn.disabled = isLoading;
            if (isLoading) {
                btn.classList.add('loading');
            } else {
                btn.classList.remove('loading');
            }
        });
        
        if (this.board) {
            this.board.canvas.style.pointerEvents = isLoading ? 'none' : 'auto';
        }
    }
}