# popular_banco.py
import sqlite3
import random
from faker import Faker
from datetime import datetime, timedelta

# Inicializa o Faker para gerar dados em português do Brasil
fake = Faker('pt_BR')

# Conecta ao banco de dados (o mesmo arquivo que o Node.js usa)
conn = sqlite3.connect('database.db')
cursor = conn.cursor()

print("--- Limpando tabelas existentes ---")
cursor.execute("DELETE FROM mensagens")
cursor.execute("DELETE FROM compromissos")
cursor.execute("DELETE FROM assuntos")
cursor.execute("DELETE FROM temas")
print("Tabelas limpas com sucesso.")

# --- Criando Temas e Assuntos ---
print("\n--- Criando Temas e Assuntos ---")
temas = ['Trabalho', 'Pessoal', 'Estudos', 'Projetos Navais', 'Finanças', 'Saúde', 'Operações']
temas_ids = []
for tema_nome in temas:
    cursor.execute("INSERT INTO temas (nome) VALUES (?)", (tema_nome,))
    temas_ids.append(cursor.lastrowid)
print(f"{len(temas_ids)} temas criados.")

assuntos_ids = []
for _ in range(30): # Criar 30 assuntos aleatórios
    tema_id_escolhido = random.choice(temas_ids)
    nome_assunto = f"Relatório sobre {fake.bs()}"
    cursor.execute("INSERT INTO assuntos (nome, tema_id) VALUES (?, ?)", (nome_assunto, tema_id_escolhido))
    assuntos_ids.append(cursor.lastrowid)
print(f"{len(assuntos_ids)} assuntos criados.")

# --- Criando 50 Compromissos ---
print("\n--- Criando 50 Compromissos ---")
for i in range(50):
    titulo = random.choice(['Reunião de Alinhamento', 'Consulta Médica', 'Apresentação de Projeto', 'Manutenção de Equipamento', 'Treinamento de Equipe'])
    quando = fake.date_time_between(start_date='-30d', end_date='+60d').isoformat()
    onde = fake.address()
    observacoes = fake.sentence(nb_words=10)
    cursor.execute("INSERT INTO compromissos (titulo, quando, onde, observacoes) VALUES (?, ?, ?, ?)",
                   (titulo, quando, onde, observacoes))
    print(f"Compromisso {i+1}/50 criado...")

# --- Criando 100 Mensagens ---
print("\n--- Criando 100 Mensagens ---")
origens_possiveis = ['CO नौसेना', 'ESQUADRA', 'COMFLOT', 'NAVAL-SUL', 'DAbM']
for i in range(100):
    assunto_id_escolhido = random.choice(assuntos_ids)

    # Gera a data da mensagem (formato YYYY-MM-DD)
    data_obj = fake.date_time_between(start_date='-1y', end_date='now')
    data_mensagem = data_obj.strftime('%Y-%m-%d')

    # Gera a data-hora no formato Marinha (DDHHMMZ)
    dia = data_obj.strftime('%d')
    hora_minuto = data_obj.strftime('%H%M')
    data_hora_texto = f"{dia}{hora_minuto}Z"

    origem = random.choice(origens_possiveis)
    para = random.choice(origens_possiveis)
    conteudo = fake.paragraph(nb_sentences=3)

    cursor.execute("""
        INSERT INTO mensagens (data_mensagem, data_hora_texto, origem, para, conteudo, assunto_id)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (data_mensagem, data_hora_texto, origem, para, conteudo, assunto_id_escolhido))
    print(f"Mensagem {i+1}/100 criada...")

# Salva (commit) as alterações e fecha a conexão
conn.commit()
conn.close()

print("\n--- Processo Concluído! ---")
print("Banco de dados populado com 50 compromissos e 100 mensagens.")
print("Agora você já pode iniciar seu servidor com 'node server.js'.")