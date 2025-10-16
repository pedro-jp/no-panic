from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, leave_room, emit
import mysql.connector
import bcrypt
from dotenv import load_dotenv
import os
import signal
import sys

# ======== CONFIG ========
load_dotenv()
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "no_panic")
DB_PORT = int(os.getenv("DB_PORT", 3306))
PORT = int(os.getenv("PORT", 3002))

app = Flask(__name__)
CORS(app)

# Socket.IO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# ======== DB ==========
def get_connection():
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        port=DB_PORT
    )

# ======== Usuários WebRTC ==========
users = {}   # { socket_id: {"room": str} }
rooms = {}   # { room_id: set(socket_id) }

# ======== ROTAS HTTP ==========
@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

@app.route("/status", methods=["GET"])
def status():
    return jsonify({
        "status": "online",
        "connections": len(users),
        "rooms": len(rooms)
    })

# ======== CADASTRO / LOGIN ==========
@app.route("/cadastro", methods=["POST"])
def cadastro():
    data = request.json
    nome, cpf, email, senha = data.get("nome"), data.get("cpf"), data.get("email"), data.get("senha")
    if not all([nome, cpf, email, senha]):
        return jsonify({"erro": "Campos obrigatórios faltando"}), 400

    senha_hash = bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO usuario (nome, cpf, email, senha) VALUES (%s,%s,%s,%s)",
            (nome, cpf, email, senha_hash)
        )
        conn.commit()
        return jsonify({"mensagem": "Usuário cadastrado com sucesso!"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email, senha = data.get("email"), data.get("senha")
    if not email or not senha:
        return jsonify({"erro": "Informe email e senha"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM usuario WHERE email=%s", (email,))
        usuario = cursor.fetchone()
        if not usuario:
            return jsonify({"erro": "Usuário não encontrado"}), 404
        if bcrypt.checkpw(senha.encode("utf-8"), usuario["senha"].encode("utf-8")):
            return jsonify({"usuario": {"nome": usuario["nome"], "email": usuario["email"], "cpf": usuario["cpf"]}}), 200
        else:
            return jsonify({"erro": "Senha incorreta"}), 401
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route("/primeiro-login", methods=["POST"])
def primeiro_login():
    data = request.json
    id_usuario = data.get("id")
    if not id_usuario:
        return jsonify({"erro": "Informe o id do usuário"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE usuario SET primeiro_login=false WHERE id_usuario=%s", (id_usuario,))
        conn.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ======== SOCKET.IO ==========
@socketio.on("connect")
def handle_connect():
    sid = request.sid
    users[sid] = {"room": None}
    print(f"🔌 Cliente conectado: {sid}")

@socketio.on("disconnect")
def handle_disconnect():
    sid = request.sid
    user = users.get(sid)
    if user and user["room"]:
        room_id = user["room"]
        if room_id in rooms:
            rooms[room_id].discard(sid)
            emit("user-left", {"userId": sid, "roomId": room_id}, room=room_id)
            if not rooms[room_id]:
                del rooms[room_id]
    users.pop(sid, None)
    print(f"🔌 Cliente desconectado: {sid}")

@socketio.on("join")
def handle_join(data):
    sid = request.sid
    room_id = data.get("roomId")
    if not room_id:
        return

    old_room = users[sid]["room"]
    if old_room:
        leave_room(old_room)
        if old_room in rooms:
            rooms[old_room].discard(sid)
            emit("user-left", {"userId": sid, "roomId": old_room}, room=old_room)
            if not rooms[old_room]:
                del rooms[old_room]

    join_room(room_id)
    users[sid]["room"] = room_id
    rooms.setdefault(room_id, set()).add(sid)
    emit("user-joined", {"userId": sid, "roomId": room_id}, room=room_id)
    print(f"👥 {sid} entrou na sala {room_id}")

@socketio.on("signal")
def handle_signal(data):
    room_id = data.get("roomId")
    signal_data = data.get("data")
    if not room_id or not signal_data:
        return
    emit("signal", {"roomId": room_id, "data": signal_data, "from": request.sid}, room=room_id, include_self=False)

# ======== Graceful shutdown ==========
def shutdown_server(sig, frame):
    print("🛑 Encerrando servidor...")
    sys.exit(0)

signal.signal(signal.SIGINT, shutdown_server)
signal.signal(signal.SIGTERM, shutdown_server)

# ======== RUN ==========
if __name__ == "__main__":
    print(f"🚀 Servidor rodando em http://localhost:{PORT}")
    socketio.run(app, host="0.0.0.0", port=PORT)
