"""
围棋游戏核心逻辑
包含棋盘状态、规则引擎、胜负判定等基础功能
"""

class GoGame:
    def __init__(self, size=19):
        """初始化围棋游戏
        
        Args:
            size (int): 棋盘大小，默认19x19
        """
        self.size = size
        self.board = [[0 for _ in range(size)] for _ in range(size)]  # 0:空 1:黑 2:白
        self.current_player = 1  # 1:黑先 2:白后
        self.captured_stones = {1: 0, 2: 0}  # 被吃掉的棋子数
        self.move_history = []  # 落子历史
        self.ko_position = None  # 劫争位置
        
    def is_valid_position(self, x, y):
        """检查坐标是否有效"""
        return 0 <= x < self.size and 0 <= y < self.size
    
    def is_empty(self, x, y):
        """检查位置是否为空"""
        return self.is_valid_position(x, y) and self.board[x][y] == 0
    
    def get_neighbors(self, x, y):
        """获取相邻位置"""
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
        neighbors = []
        for dx, dy in directions:
            nx, ny = x + dx, y + dy
            if self.is_valid_position(nx, ny):
                neighbors.append((nx, ny))
        return neighbors
    
    def get_group(self, x, y):
        """获取连通的棋子组"""
        if not self.is_valid_position(x, y) or self.board[x][y] == 0:
            return set()
        
        color = self.board[x][y]
        group = set()
        stack = [(x, y)]
        
        while stack:
            cx, cy = stack.pop()
            if (cx, cy) in group:
                continue
            group.add((cx, cy))
            
            for nx, ny in self.get_neighbors(cx, cy):
                if self.board[nx][ny] == color and (nx, ny) not in group:
                    stack.append((nx, ny))
        
        return group
    
    def get_liberties(self, group):
        """获取棋子组的气（自由点）"""
        liberties = set()
        for x, y in group:
            for nx, ny in self.get_neighbors(x, y):
                if self.board[nx][ny] == 0:
                    liberties.add((nx, ny))
        return liberties
    
    def has_liberties(self, x, y):
        """检查位置的棋子是否有气"""
        group = self.get_group(x, y)
        return len(self.get_liberties(group)) > 0
    
    def capture_stones(self, opponent_color):
        """提取对手无气的棋子"""
        captured = []
        for x in range(self.size):
            for y in range(self.size):
                if self.board[x][y] == opponent_color:
                    if not self.has_liberties(x, y):
                        group = self.get_group(x, y)
                        captured.extend(list(group))
        
        # 移除被提取的棋子
        for x, y in captured:
            self.board[x][y] = 0
        
        self.captured_stones[opponent_color] += len(captured)
        return captured
    
    def is_suicide(self, x, y, color):
        """检查是否为自杀手"""
        # 临时放置棋子
        original = self.board[x][y]
        self.board[x][y] = color
        
        # 检查是否能提取对手棋子
        opponent = 3 - color
        can_capture = False
        for nx, ny in self.get_neighbors(x, y):
            if self.board[nx][ny] == opponent and not self.has_liberties(nx, ny):
                can_capture = True
                break
        
        # 检查自己是否有气
        has_liberty = self.has_liberties(x, y)
        
        # 恢复棋盘
        self.board[x][y] = original
        
        # 如果能提取对手棋子或者自己有气，就不是自杀
        return not (can_capture or has_liberty)
    
    def is_ko(self, x, y):
        """检查是否违反劫争规则"""
        return self.ko_position == (x, y)
    
    def make_move(self, x, y):
        """落子
        
        Returns:
            dict: 包含成功状态和信息的字典
        """
        # 检查基本有效性
        if not self.is_empty(x, y):
            return {"success": False, "message": "位置已有棋子"}
        
        # 检查自杀手
        if self.is_suicide(x, y, self.current_player):
            return {"success": False, "message": "不能下自杀手"}
        
        # 检查劫争
        if self.is_ko(x, y):
            return {"success": False, "message": "违反劫争规则"}
        
        # 落子
        self.board[x][y] = self.current_player
        self.move_history.append((x, y, self.current_player))
        
        # 提取对手棋子
        opponent = 3 - self.current_player
        captured = self.capture_stones(opponent)
        
        # 更新劫争状态
        if len(captured) == 1 and len(self.get_group(x, y)) == 1:
            # 可能的劫争：只提取了一个子，且自己也只有一个子
            self.ko_position = captured[0] if captured else None
        else:
            self.ko_position = None
        
        # 切换当前玩家
        self.current_player = 3 - self.current_player
        
        return {
            "success": True, 
            "message": "落子成功",
            "captured": captured,
            "current_player": self.current_player
        }
    
    def get_board_state(self):
        """获取当前棋盘状态"""
        return {
            "board": self.board,
            "current_player": self.current_player,
            "captured": self.captured_stones,
            "move_count": len(self.move_history)
        }
    
    def get_legal_moves(self):
        """获取所有合法落子位置"""
        legal_moves = []
        for x in range(self.size):
            for y in range(self.size):
                if (self.is_empty(x, y) and 
                    not self.is_suicide(x, y, self.current_player) and
                    not self.is_ko(x, y)):
                    legal_moves.append((x, y))
        return legal_moves
    
    def reset_game(self):
        """重置游戏"""
        self.board = [[0 for _ in range(self.size)] for _ in range(self.size)]
        self.current_player = 1
        self.captured_stones = {1: 0, 2: 0}
        self.move_history = []
        self.ko_position = None