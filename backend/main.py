import mysql.connector
import bcrypt

# ======== CONEXÃO ==========
conexao = mysql.connector.connect(
    host="localhost",
    user="root",
    password="toor",
    database="no_panic"
)
cursor = conexao.cursor()

# ======== FUNÇÃO PARA CADASTRAR ==========
def cadastrar_usuario():
    print("\n=== CADASTRO DE USUÁRIO ===")
    nome = input("Nome completo: ")
    cpf = input("CPF (somente números): ")
    email = input("E-mail: ")
    senha = input("Senha: ")

    # Escolher tipo de usuário
    while True:
        tipo = input("Você é [1] Paciente ou [2] Terapeuta? ")
        if tipo in ["1", "2"]:
            break
        else:
            print("Opção inválida, tente novamente.")

    # Criptografa a senha
    senha_hash = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt())

    # Insere na tabela usuario
    comando_usuario = "INSERT INTO usuario (nome, cpf, email, senha) VALUES (%s, %s, %s, %s)"
    valores_usuario = (nome, cpf, email, senha_hash.decode('utf-8'))

    try:
        cursor.execute(comando_usuario, valores_usuario)
        conexao.commit()
        id_usuario = cursor.lastrowid  # pega o ID gerado automaticamente

        # Cadastra conforme o tipo
        if tipo == "1":  # Paciente
            data_nasc = input("Data de nascimento (AAAA-MM-DD): ")
            historico = input("Histórico de saúde (opcional): ")
            comando_paciente = "INSERT INTO paciente (id_usuario, data_nascimento, historico_saude) VALUES (%s, %s, %s)"
            cursor.execute(comando_paciente, (id_usuario, data_nasc, historico))
            conexao.commit()
            print("✅ Paciente cadastrado com sucesso!")

        else:  # Terapeuta
            especialidade = input("Especialidade: ")
            crp = input("CRP: ")
            disponibilidade = input("Disponibilidade (ex: seg-sex 8h-18h): ")
            comando_terapeuta = "INSERT INTO terapeuta (id_usuario, especialidade, CRP, disponibilidade) VALUES (%s, %s, %s, %s)"
            cursor.execute(comando_terapeuta, (id_usuario, especialidade, crp, disponibilidade))
            conexao.commit()
            print("✅ Terapeuta cadastrado com sucesso!")

    except mysql.connector.Error as erro:
        print(f"❌ Erro ao cadastrar: {erro}")
        conexao.rollback()


# ======== FUNÇÃO DE LOGIN ==========
def fazer_login():
    print("\n=== LOGIN ===")
    email = input("E-mail: ")
    senha = input("Senha: ")

    comando = "SELECT id_usuario, senha FROM usuario WHERE email = %s"
    cursor.execute(comando, (email,))
    resultado = cursor.fetchone()

    if resultado:
        id_usuario, senha_bd = resultado
        if bcrypt.checkpw(senha.encode('utf-8'), senha_bd.encode('utf-8')):

            # Verifica se é paciente ou terapeuta
            cursor.execute("SELECT id_usuario FROM paciente WHERE id_usuario = %s", (id_usuario,))
            if cursor.fetchone():
                tipo = "paciente"
            else:
                cursor.execute("SELECT id_usuario FROM terapeuta WHERE id_usuario = %s", (id_usuario,))
                tipo = "terapeuta" if cursor.fetchone() else "usuário comum"

            print(f"✅ Login bem-sucedido! Bem-vindo, {tipo}.")
        else:
            print("❌ Senha incorreta.")
    else:
        print("❌ Usuário não encontrado.")


# ======== MENU PRINCIPAL ==========
while True:
    print("\n--- MENU ---")
    print("1 - Cadastrar novo usuário")
    print("2 - Fazer login")
    print("3 - Sair")

    opcao = input("Escolha uma opção: ")

    if opcao == "1":
        cadastrar_usuario()
    elif opcao == "2":
        fazer_login()
    elif opcao == "3":
        print("Encerrando o sistema...")
        break
    else:
        print("Opção inválida, tente novamente.")

cursor.close()
conexao.close()
