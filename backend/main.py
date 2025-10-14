from flask import Flask, request, jsonify,render_template
from flask_cors import CORS
import mysql.connector
import bcrypt
from dotenv import load_dotenv
import os

# Carrega o .env
load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")


app = Flask(__name__)
CORS(app)

# ======== CONEXÃO ==========
def get_connection():
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        port=DB_PORT
    )

@app.route('/', methods=['GET'])
def home():
    return  render_template("index.html")

# ======== ROTA: CADASTRO ==========
@app.route('/cadastro', methods=['POST'])
def cadastro():
    data = request.json
    nome = data.get("nome")
    cpf = data.get("cpf")
    email = data.get("email")
    senha = data.get("senha")

    if not all([nome, cpf, email, senha]):
        return jsonify({"erro": "Campos obrigatórios faltando"}), 400

    senha_hash = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt())

    conexao = get_connection()
    cursor = conexao.cursor()

    try:
        # Inserir na tabela usuario
        cursor.execute(
            "INSERT INTO usuario (nome, cpf, email, senha) VALUES (%s, %s, %s, %s)",
            (nome, cpf, email, senha_hash.decode('utf-8'))
        )
        conexao.commit()
        id_usuario = cursor.lastrowid

        conexao.commit()
        return jsonify({"mensagem": "Usuário cadastrado com sucesso!"}), 201

    except mysql.connector.Error as e:
        conexao.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        cursor.close()
        conexao.close()

# ======== ROTA: LOGIN ==========
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json(force=True)  # força JSON mesmo se Content-Type estiver errado
    if not data:
        return jsonify({"erro": "JSON inválido"}), 400

    email = data.get("email")
    senha = data.get("senha")
    if not email or not senha:
        return jsonify({"erro": "Informe email e senha"}), 400

    conexao = get_connection()
    cursor = conexao.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM usuario WHERE email = %s", (email,))
        usuario = cursor.fetchone()
        if not usuario:
            return jsonify({"erro": "Usuário não encontrado"}), 404

        if bcrypt.checkpw(senha.encode('utf-8'), usuario["senha"].encode('utf-8')):
            newUsuario = {
                "nome": usuario["nome"],
                "email": usuario["email"],
                "cpf": usuario["cpf"]
            }
            return jsonify({"usuario": newUsuario}), 200
        else:
            return jsonify({"erro": "Senha incorreta"}), 401
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        cursor.close()
        conexao.close()

# ======== EXECUTAR API ==========
if __name__ == "__main__":
    app.run(debug=True)
