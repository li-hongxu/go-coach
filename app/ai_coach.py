"""
围棋AI教练
基于规则的简单AI，为新手提供落子建议和指导
"""

import random
from .go_game import GoGame

class GoAI:
    def __init__(self, game, difficulty="beginner"):
        """初始化AI
        
        Args:
            game (GoGame): 围棋游戏实例
            difficulty (str): 难度等级 beginner/intermediate/advanced
        """
        self.game = game
        self.difficulty = difficulty
        
        # 定义各种策略的权重
        self.weights = {
            "beginner": {
                "corner": 30,      # 占角
                "edge": 15,        # 占边  
                "center": 10,      # 中央
                "attack": 20,      # 攻击
                "defend": 25,      # 防守
                "connect": 15,     # 连接
                "cut": 10,         # 切断
                "random": 5        # 随机性
            },
            "intermediate": {
                "corner": 25,
                "edge": 20,
                "center": 15,
                "attack": 30,
                "defend": 35,
                "connect": 25,
                "cut": 20,
                "random": 2
            }
        }
    
    def evaluate_position(self, x, y):
        """评估位置的价值
        
        Returns:
            int: 位置评分，越高越好
        """
        if not self.game.is_empty(x, y):
            return -1000  # 已有棋子，不能下
            
        if (self.game.is_suicide(x, y, self.game.current_player) or 
            self.game.is_ko(x, y)):
            return -1000  # 违规位置
        
        score = 0
        weights = self.weights.get(self.difficulty, self.weights["beginner"])
        
        # 1. 位置价值评估
        score += self._evaluate_position_value(x, y) * weights["corner"]
        
        # 2. 攻击价值
        score += self._evaluate_attack_value(x, y) * weights["attack"]
        
        # 3. 防守价值
        score += self._evaluate_defense_value(x, y) * weights["defend"]
        
        # 4. 连接价值
        score += self._evaluate_connection_value(x, y) * weights["connect"]
        
        # 5. 切断价值
        score += self._evaluate_cutting_value(x, y) * weights["cut"]
        
        # 6. 添加一点随机性
        score += random.randint(-weights["random"], weights["random"])
        
        return score
    
    def _evaluate_position_value(self, x, y):
        """评估位置的基础价值（角、边、中央）"""
        size = self.game.size
        
        # 角的位置价值最高
        corners = [(0, 0), (0, size-1), (size-1, 0), (size-1, size-1)]
        if (x, y) in corners:
            return 50
        
        # 接近角的位置
        corner_distance = min([
            abs(x - cx) + abs(y - cy) for cx, cy in corners
        ])
        
        if corner_distance <= 3:
            return 30 - corner_distance * 5
        
        # 边的位置
        if x == 0 or x == size-1 or y == 0 or y == size-1:
            return 20
        
        # 靠近边的位置
        edge_distance = min(x, y, size-1-x, size-1-y)
        if edge_distance <= 2:
            return 15 - edge_distance * 3
        
        # 中央位置
        center_x, center_y = size // 2, size // 2
        center_distance = abs(x - center_x) + abs(y - center_y)
        return max(5, 15 - center_distance)
    
    def _evaluate_attack_value(self, x, y):
        """评估攻击价值"""
        attack_score = 0
        opponent = 3 - self.game.current_player
        
        # 检查相邻的对手棋子
        for nx, ny in self.game.get_neighbors(x, y):
            if self.game.board[nx][ny] == opponent:
                # 获取对手棋子组
                group = self.game.get_group(nx, ny)
                liberties = self.game.get_liberties(group)
                
                # 如果对手只有很少的气，攻击价值很高
                liberty_count = len(liberties)
                if liberty_count == 1:
                    attack_score += 100  # 可以直接提子
                elif liberty_count == 2:
                    attack_score += 50   # 严重威胁
                elif liberty_count == 3:
                    attack_score += 20   # 一般威胁
        
        return attack_score
    
    def _evaluate_defense_value(self, x, y):
        """评估防守价值"""
        defense_score = 0
        my_color = self.game.current_player
        
        # 检查相邻的己方棋子
        for nx, ny in self.game.get_neighbors(x, y):
            if self.game.board[nx][ny] == my_color:
                # 获取己方棋子组
                group = self.game.get_group(nx, ny)
                liberties = self.game.get_liberties(group)
                
                # 如果己方棋子气很少，防守价值很高
                liberty_count = len(liberties)
                if liberty_count <= 2:
                    defense_score += 80  # 紧急防守
                elif liberty_count == 3:
                    defense_score += 30  # 需要补强
        
        return defense_score
    
    def _evaluate_connection_value(self, x, y):
        """评估连接价值"""
        connection_score = 0
        my_color = self.game.current_player
        
        # 计算相邻的己方棋子数量
        adjacent_count = 0
        for nx, ny in self.game.get_neighbors(x, y):
            if self.game.board[nx][ny] == my_color:
                adjacent_count += 1
        
        # 连接的己方棋子越多，价值越高
        connection_score = adjacent_count * 15
        
        # 检查对角线连接（虎口等形状）
        diagonals = [(-1, -1), (-1, 1), (1, -1), (1, 1)]
        for dx, dy in diagonals:
            nx, ny = x + dx, y + dy
            if (self.game.is_valid_position(nx, ny) and 
                self.game.board[nx][ny] == my_color):
                connection_score += 5
        
        return connection_score
    
    def _evaluate_cutting_value(self, x, y):
        """评估切断对手的价值"""
        cutting_score = 0
        opponent = 3 - self.game.current_player
        
        # 检查是否能切断对手的连接
        opponent_neighbors = []
        for nx, ny in self.game.get_neighbors(x, y):
            if self.game.board[nx][ny] == opponent:
                opponent_neighbors.append((nx, ny))
        
        # 如果相邻有多个对手棋子，可能形成切断
        if len(opponent_neighbors) >= 2:
            # 简单检查：如果这些对手棋子不在同一个组，则可能切断
            groups = set()
            for nx, ny in opponent_neighbors:
                group = frozenset(self.game.get_group(nx, ny))
                groups.add(group)
            
            if len(groups) > 1:
                cutting_score += 25  # 可以切断多个组
        
        return cutting_score
    
    def get_suggestion(self, top_n=5):
        """获取AI建议的落子位置
        
        Args:
            top_n (int): 返回前N个最佳位置
            
        Returns:
            list: [(x, y, score, reason), ...] 推荐位置列表
        """
        legal_moves = self.game.get_legal_moves()
        if not legal_moves:
            return []
        
        # 评估所有合法位置
        evaluations = []
        for x, y in legal_moves:
            score = self.evaluate_position(x, y)
            reason = self._get_move_reason(x, y, score)
            evaluations.append((x, y, score, reason))
        
        # 按分数排序
        evaluations.sort(key=lambda x: x[2], reverse=True)
        
        return evaluations[:top_n]
    
    def _get_move_reason(self, x, y, score):
        """生成落子理由说明"""
        if score >= 80:
            return "紧急防守或攻击机会"
        elif score >= 50:
            return "重要的战略位置"
        elif score >= 30:
            return "良好的发展点"
        elif score >= 15:
            return "稳健的选择"
        else:
            return "可考虑的位置"
    
    def make_ai_move(self):
        """AI自动落子
        
        Returns:
            dict: 落子结果
        """
        suggestions = self.get_suggestion(1)
        if not suggestions:
            return {"success": False, "message": "没有合法落子位置"}
        
        x, y, score, reason = suggestions[0]
        result = self.game.make_move(x, y)
        
        if result["success"]:
            result["ai_reason"] = reason
            result["ai_score"] = score
            result["position"] = (x, y)
        
        return result
    
    def analyze_move(self, x, y):
        """分析用户的落子
        
        Returns:
            dict: 分析结果和建议
        """
        if not self.game.is_empty(x, y):
            return {
                "rating": "无效",
                "message": "该位置已有棋子",
                "suggestions": []
            }
        
        # 评估这个位置
        score = self.evaluate_position(x, y)
        suggestions = self.get_suggestion(3)
        
        # 给出评价
        if score >= 60:
            rating = "优秀"
            message = "这是一个很好的选择！"
        elif score >= 40:
            rating = "良好" 
            message = "不错的落子。"
        elif score >= 20:
            rating = "一般"
            message = "可以考虑更好的位置。"
        else:
            rating = "较差"
            message = "建议考虑其他位置。"
        
        return {
            "rating": rating,
            "message": message,
            "score": score,
            "suggestions": suggestions
        }