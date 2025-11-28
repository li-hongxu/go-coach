"""
Flask Web应用主文件
提供围棋游戏的Web界面和API
"""

from flask import Flask, render_template, request, jsonify, session
import json
from app.go_game import GoGame
from app.ai_coach import GoAI

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # 在生产环境中应该使用更安全的密钥

# 全局游戏实例字典（简单实现，实际应该用数据库）
games = {}

@app.route('/')
def index():
    """主页"""
    return render_template('index.html')

@app.route('/api/new_game', methods=['POST'])
def new_game():
    """创建新游戏"""
    data = request.get_json()
    size = data.get('size', 19)
    difficulty = data.get('difficulty', 'beginner')
    
    # 创建游戏实例
    game = GoGame(size=size)
    ai = GoAI(game, difficulty=difficulty)
    
    # 生成游戏ID（简单实现）
    game_id = f"game_{len(games)}"
    games[game_id] = {'game': game, 'ai': ai}
    
    # 保存到session
    session['game_id'] = game_id
    
    return jsonify({
        'success': True,
        'game_id': game_id,
        'state': game.get_board_state()
    })

@app.route('/api/make_move', methods=['POST'])
def make_move():
    """玩家落子"""
    game_id = session.get('game_id')
    if not game_id or game_id not in games:
        return jsonify({'success': False, 'message': '游戏不存在'})
    
    data = request.get_json()
    x = data.get('x')
    y = data.get('y')
    
    if x is None or y is None:
        return jsonify({'success': False, 'message': '无效的坐标'})
    
    game = games[game_id]['game']
    ai = games[game_id]['ai']
    
    # 玩家落子
    result = game.make_move(x, y)
    
    if result['success']:
        # 分析玩家的落子
        analysis = ai.analyze_move(x, y)
        result['analysis'] = analysis
        result['state'] = game.get_board_state()
    
    return jsonify(result)

@app.route('/api/get_suggestion', methods=['POST'])
def get_suggestion():
    """获取AI建议"""
    game_id = session.get('game_id')
    if not game_id or game_id not in games:
        return jsonify({'success': False, 'message': '游戏不存在'})
    
    data = request.get_json()
    top_n = data.get('top_n', 3)
    
    ai = games[game_id]['ai']
    suggestions = ai.get_suggestion(top_n)
    
    return jsonify({
        'success': True,
        'suggestions': suggestions
    })

@app.route('/api/ai_move', methods=['POST'])
def ai_move():
    """AI自动落子"""
    game_id = session.get('game_id')
    if not game_id or game_id not in games:
        return jsonify({'success': False, 'message': '游戏不存在'})
    
    ai = games[game_id]['ai']
    result = ai.make_ai_move()
    
    if result['success']:
        result['state'] = games[game_id]['game'].get_board_state()
    
    return jsonify(result)

@app.route('/api/get_state', methods=['GET'])
def get_state():
    """获取当前游戏状态"""
    game_id = session.get('game_id')
    if not game_id or game_id not in games:
        return jsonify({'success': False, 'message': '游戏不存在'})
    
    game = games[game_id]['game']
    return jsonify({
        'success': True,
        'state': game.get_board_state()
    })

@app.route('/api/reset_game', methods=['POST'])
def reset_game():
    """重置游戏"""
    game_id = session.get('game_id')
    if not game_id or game_id not in games:
        return jsonify({'success': False, 'message': '游戏不存在'})
    
    game = games[game_id]['game']
    game.reset_game()
    
    return jsonify({
        'success': True,
        'state': game.get_board_state()
    })

@app.route('/api/analyze_position', methods=['POST'])
def analyze_position():
    """分析指定位置"""
    game_id = session.get('game_id')
    if not game_id or game_id not in games:
        return jsonify({'success': False, 'message': '游戏不存在'})
    
    data = request.get_json()
    x = data.get('x')
    y = data.get('y')
    
    if x is None or y is None:
        return jsonify({'success': False, 'message': '无效的坐标'})
    
    ai = games[game_id]['ai']
    analysis = ai.analyze_move(x, y)
    
    return jsonify({
        'success': True,
        'analysis': analysis
    })

if __name__ == '__main__':
    print("围棋AI教练正在启动...")
    print("请访问: http://localhost:5000")
    app.run(debug=False, host='0.0.0.0', port=5000)