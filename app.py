from flask import Flask, render_template, jsonify, request
import random
import json
import os
import socket

app = Flask(__name__,
            static_folder='static',
            template_folder='templates')

# 存储游戏状态
game_states = {}


@app.route('/')
def index():
    """渲染游戏主页面"""
    return render_template('index.html')


@app.route('/api/start_game', methods=['POST'])
def start_game():
    """开始新游戏"""
    try:
        data = request.get_json()
        player_name = data.get('player_name', '玩家1')

        # 生成游戏ID
        game_id = random.randint(1000, 9999)

        # 初始化游戏状态
        game_states[game_id] = {
            'player_name': player_name,
            'score': 0,
            'level': 1,
            'lives': 5,
            'game_over': False
        }

        return jsonify({
            'success': True,
            'game_id': game_id,
            'state': game_states[game_id]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/save_score', methods=['POST'])
def save_score():
    """保存分数"""
    try:
        data = request.get_json()
        game_id = data.get('game_id')
        score = data.get('score', 0)

        # 保存到文件
        scores = []
        if os.path.exists('scores.json'):
            with open('scores.json', 'r') as f:
                scores = json.load(f)

        scores.append({
            'game_id': game_id,
            'score': score,
            'timestamp': os.path.getmtime('scores.json') if os.path.exists('scores.json') else 0
        })

        # 只保留前10名
        scores = sorted(scores, key=lambda x: x['score'], reverse=True)[:10]

        with open('scores.json', 'w') as f:
            json.dump(scores, f)

        return jsonify({'success': True, 'scores': scores})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/get_scores')
def get_scores():
    """获取高分榜"""
    try:
        scores = []
        if os.path.exists('scores.json'):
            with open('scores.json', 'r') as f:
                scores = json.load(f)

        return jsonify({'success': True, 'scores': scores})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/test')
def test():
    return "祖玛游戏服务器运行正常！"


def get_local_ip():
    """获取本地IP地址"""
    try:
        # 创建一个UDP套接字
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # 连接到公共DNS服务器（不需要实际连接）
        s.connect(("8.8.8.8", 80))
        # 获取本地IP地址
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception as e:
        print(f"获取IP地址失败: {e}")
        return "127.0.0.1"


if __name__ == '__main__':
    # 获取本地IP地址
    local_ip = get_local_ip()

    print("=" * 60)
    print("祖玛游戏服务器启动")
    print("=" * 60)
    print("访问方式:")
    print(f"1. 本机访问: http://localhost:5000")
    print(f"2. 本机访问: http://127.0.0.1:5000")
    print(f"3. 局域网访问: http://{local_ip}:5000")
    print("=" * 60)
    print("注意:")
    print("1. 确保防火墙允许5000端口")
    print("2. 其他设备需要连接同一WiFi/网络")
    print("=" * 60)

    # 确保scores.json文件存在
    if not os.path.exists('scores.json'):
        with open('scores.json', 'w') as f:
            json.dump([], f)

    # 运行Flask服务器，监听所有网络接口
    app.run(
        debug=False,  # 关闭调试模式（生产环境）
        host='0.0.0.0',  # 监听所有网络接口
        port=5000,  # 端口号
        threaded=True  # 多线程处理请求
    )