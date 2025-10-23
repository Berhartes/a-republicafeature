"""Sistema de Rankings e Premiações para Deputados e Fornecedores."""

import json
from pathlib import Path
from typing import List, Dict, Any, Sequence, Tuple
from datetime import datetime, timezone
from collections import defaultdict


def load_detailed_deputados_data(
    deputados_dir: Path,
    deputados_ids: List[int]
) -> Dict[int, Dict[str, Any]]:
    """
    Carrega dados_completos.json de cada deputado.
    
    Args:
        deputados_dir: Caminho para deputadosFederais/idDeputados/
        deputados_ids: Lista de IDs dos deputados
        
    Returns:
        {
            220714: {
                "metadata": {...},
                "anos": [2023, 2024, 2025],
                "despesas": [...]
            },
            ...
        }
    """
    detailed_data = {}
    total_files = len(deputados_ids)
    
    print(f"📂 Carregando dados detalhados de {total_files} deputados...")
    
    for idx, dep_id in enumerate(deputados_ids, 1):
        if idx % 100 == 0:
            print(f"   Progresso: {idx}/{total_files} ({idx*100//total_files}%)")
        
        dep_file = deputados_dir / str(dep_id) / "dados_completos.json"
        if dep_file.exists():
            try:
                with open(dep_file, 'r', encoding='utf-8') as f:
                    detailed_data[dep_id] = json.load(f)
            except Exception as e:
                print(f"⚠️  Erro ao ler {dep_file}: {e}")
                continue
        
        # Limitar processamento para teste (remover em produção)
        # if idx >= 100:
        #     print(f"⚠️  Limitando a 100 deputados para teste")
        #     break
    
    print(f"✅ {len(detailed_data)} arquivos carregados com sucesso")
    return detailed_data


def process_detailed_data(detailed_data: Dict[int, Any]) -> Dict[str, Any]:
    """
    Processa dados detalhados para extrair:
    - Gastos por deputado por ano
    - Gastos por deputado por categoria
    - Gastos por deputado por categoria por ano
    - Transações por deputado por ano
    - Fornecedores por deputado por ano
    """
    print("🔄 Processando dados detalhados...")
    
    gastos_por_ano = defaultdict(lambda: defaultdict(float))
    gastos_por_categoria = defaultdict(lambda: defaultdict(float))
    gastos_por_categoria_ano = defaultdict(lambda: defaultdict(lambda: defaultdict(float)))
    transacoes_por_ano = defaultdict(lambda: defaultdict(int))
    fornecedores_por_ano = defaultdict(lambda: defaultdict(set))
    
    total_despesas_processadas = 0
    
    for dep_id, dados in detailed_data.items():
        for despesa in dados.get('despesas', []):
            ano = despesa.get('ano')
            categoria = despesa.get('tipoDespesa', '').strip().rstrip('.')
            valor = despesa.get('valorLiquido', 0)
            fornecedor = despesa.get('cnpjCpfFornecedor')
            
            if ano and categoria and valor:
                gastos_por_ano[ano][dep_id] += valor
                gastos_por_categoria[categoria][dep_id] += valor
                gastos_por_categoria_ano[ano][categoria][dep_id] += valor
                transacoes_por_ano[ano][dep_id] += 1
                total_despesas_processadas += 1
                
                if fornecedor:
                    fornecedores_por_ano[ano][dep_id].add(fornecedor)
    
    # Converter sets para contagens para JSON
    fornecedores_por_ano_count = {}
    for ano, deps in fornecedores_por_ano.items():
        fornecedores_por_ano_count[ano] = {
            dep_id: len(fornecedores) 
            for dep_id, fornecedores in deps.items()
        }
    
    print(f"✅ {total_despesas_processadas:,} despesas processadas")
    print(f"   Anos encontrados: {sorted(gastos_por_ano.keys())}")
    print(f"   Categorias encontradas: {len(gastos_por_categoria)}")
    
    return {
        'gastos_por_ano': dict(gastos_por_ano),
        'gastos_por_categoria': dict(gastos_por_categoria),
        'gastos_por_categoria_ano': dict(gastos_por_categoria_ano),
        'transacoes_por_ano': dict(transacoes_por_ano),
        'fornecedores_por_ano': fornecedores_por_ano_count
    }


def gerar_rankings_deputados(deputados: Sequence[Any]) -> Dict[str, Any]:
    """
    Gera rankings completos para deputados.
    
    Retorna:
        - geral: Ranking geral histórico
        - porAno: Rankings por ano
        - porCategoria: Rankings por categoria de despesa
        - porUf: Rankings por UF
    """
    rankings = {
        "geral": [],
        "porAno": {},
        "porCategoria": {},
        "porUf": {}
    }
    
    # Ranking Geral Histórico (todos os tempos)
    deputados_ordenados = sorted(
        deputados,
        key=lambda d: d.total_despesas,
        reverse=True
    )
    
    for posicao, dep in enumerate(deputados_ordenados, 1):
        rankings["geral"].append({
            "posicao": posicao,
            "id": dep.id,
            "nome": dep.nome,
            "partido": dep.partido,
            "uf": dep.uf,
            "totalDespesas": dep.total_despesas,
            "numeroDespesas": dep.numero_despesas,
            "fornecedoresIdentificados": dep.fornecedores_identificados
        })
    
    # Rankings por UF
    deputados_por_uf = defaultdict(list)
    for dep in deputados:
        if dep.uf:
            deputados_por_uf[dep.uf].append(dep)
    
    for uf, deps in deputados_por_uf.items():
        deps_ordenados = sorted(deps, key=lambda d: d.total_despesas, reverse=True)
        rankings["porUf"][uf] = [
            {
                "posicao": i + 1,
                "id": dep.id,
                "nome": dep.nome,
                "partido": dep.partido,
                "totalDespesas": dep.total_despesas
            }
            for i, dep in enumerate(deps_ordenados[:10])  # Top 10 por UF
        ]
    
    return rankings


def gerar_premiacoes_completas(
    deputados: Sequence[Any],
    dados_processados: Dict[str, Any],
    deputados_index: Dict[int, Any]
) -> Dict[str, Any]:
    """
    Gera TODAS as premiações com dados detalhados:
    
    👑 COROAS (Histórico):
    - Campeão Geral
    - Campeões por Categoria (15+)
    - Campeões por UF (27)
    - Campeão de Transações
    - Campeão de Diversificação
    
    🏆 TROFÉUS (Anuais):
    - Campeão Geral por Ano
    - Campeões por Categoria por Ano
    - Campeão de Transações por Ano
    
    🥈🥉 MEDALHAS (Pódios):
    - 2º e 3º lugares em todas as categorias
    """
    processed_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    
    premiacoes = {
        "coroas": [],
        "trofeus": [],
        "medalhas": [],
        "badges": [],
        "metadata": {
            "generatedAt": processed_at,
            "totalPremiacoes": 0
        }
    }
    
    print("🏆 Gerando premiações completas...")
    
    # 1. 👑 COROAS - Campeão Geral Histórico
    if deputados:
        campeao_geral = max(deputados, key=lambda d: d.total_despesas)
        premiacoes['coroas'].append({
            "tipo": "geral",
            "deputadoId": str(campeao_geral.id),
            "deputadoNome": campeao_geral.nome,
            "partido": campeao_geral.partido,
            "uf": campeao_geral.uf,
            "valor": campeao_geral.total_despesas,
            "titulo": "Campeão Geral Histórico",
            "descricao": f"Maior gastador de todos os tempos: R$ {campeao_geral.total_despesas:,.2f}",
            "icone": "👑",
            "dataConquista": processed_at
        })
    
    # 2. 👑 COROAS - Campeões por Categoria
    gastos_por_categoria = dados_processados.get('gastos_por_categoria', {})
    for categoria, gastos_deps in gastos_por_categoria.items():
        if gastos_deps:
            campeao_id = max(gastos_deps.items(), key=lambda x: x[1])[0]
            campeao = deputados_index.get(campeao_id)
            if campeao:
                premiacoes['coroas'].append({
                    "tipo": "categoria",
                    "categoria": categoria,
                    "deputadoId": str(campeao['id']),
                    "deputadoNome": campeao['nome'],
                    "partido": campeao.get('partido'),
                    "uf": campeao.get('uf'),
                    "valor": gastos_deps[campeao_id],
                    "titulo": f"Campeão de {categoria}",
                    "descricao": f"Maior gastador histórico em {categoria}: R$ {gastos_deps[campeao_id]:,.2f}",
                    "icone": "👑",
                    "dataConquista": processed_at
                })
    
    # 3. 🏆 TROFÉUS - Campeões por Ano
    gastos_por_ano = dados_processados.get('gastos_por_ano', {})
    for ano, gastos_deps in gastos_por_ano.items():
        if gastos_deps:
            campeao_id = max(gastos_deps.items(), key=lambda x: x[1])[0]
            campeao = deputados_index.get(campeao_id)
            if campeao:
                premiacoes['trofeus'].append({
                    "tipo": "anual",
                    "ano": ano,
                    "deputadoId": str(campeao['id']),
                    "deputadoNome": campeao['nome'],
                    "partido": campeao.get('partido'),
                    "uf": campeao.get('uf'),
                    "valor": gastos_deps[campeao_id],
                    "titulo": f"Campeão Geral de {ano}",
                    "descricao": f"Maior gastador do ano {ano}: R$ {gastos_deps[campeao_id]:,.2f}",
                    "icone": "🏆",
                    "dataConquista": processed_at
                })
    
    # 4. 🏆 TROFÉUS - Campeões por Categoria por Ano
    gastos_por_categoria_ano = dados_processados.get('gastos_por_categoria_ano', {})
    for ano, categorias in gastos_por_categoria_ano.items():
        for categoria, gastos_deps in categorias.items():
            if gastos_deps:
                campeao_id = max(gastos_deps.items(), key=lambda x: x[1])[0]
                campeao = deputados_index.get(campeao_id)
                if campeao:
                    premiacoes['trofeus'].append({
                        "tipo": "categoria_anual",
                        "ano": ano,
                        "categoria": categoria,
                        "deputadoId": str(campeao['id']),
                        "deputadoNome": campeao['nome'],
                        "partido": campeao.get('partido'),
                        "uf": campeao.get('uf'),
                        "valor": gastos_deps[campeao_id],
                        "titulo": f"Campeão de {categoria} em {ano}",
                        "descricao": f"Maior gastador em {categoria} no ano {ano}",
                        "icone": "🏆",
                        "dataConquista": processed_at
                    })
    
    # 5. 🥈🥉 MEDALHAS - 2º e 3º lugares geral
    if len(deputados) >= 3:
        top3 = sorted(deputados, key=lambda d: d.total_despesas, reverse=True)[:3]
        
        # Prata (2º lugar)
        segundo = top3[1]
        premiacoes['medalhas'].append({
            "tipo": "prata",
            "posicao": 2,
            "deputadoId": str(segundo.id),
            "deputadoNome": segundo.nome,
            "partido": segundo.partido,
            "uf": segundo.uf,
            "valor": segundo.total_despesas,
            "titulo": "2º Lugar Geral",
            "descricao": "Vice-campeão histórico de gastos",
            "icone": "🥈",
            "dataConquista": processed_at
        })
        
        # Bronze (3º lugar)
        terceiro = top3[2]
        premiacoes['medalhas'].append({
            "tipo": "bronze",
            "posicao": 3,
            "deputadoId": str(terceiro.id),
            "deputadoNome": terceiro.nome,
            "partido": terceiro.partido,
            "uf": terceiro.uf,
            "valor": terceiro.total_despesas,
            "titulo": "3º Lugar Geral",
            "descricao": "Terceiro colocado histórico de gastos",
            "icone": "🥉",
            "dataConquista": processed_at
        })
    
    # Atualizar total de premiações
    premiacoes["metadata"]["totalPremiacoes"] = (
        len(premiacoes["coroas"]) +
        len(premiacoes["trofeus"]) +
        len(premiacoes["medalhas"]) +
        len(premiacoes["badges"])
    )
    
    print(f"   👑 {len(premiacoes['coroas'])} coroas")
    print(f"   🏆 {len(premiacoes['trofeus'])} troféus")
    print(f"   🥈🥉 {len(premiacoes['medalhas'])} medalhas")
    print(f"   ✅ Total: {premiacoes['metadata']['totalPremiacoes']} premiações")
    
    return premiacoes


def gerar_premiacoes_deputados(
    deputados: Sequence[Any],
    rankings: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Gera premiações (coroas, troféus, medalhas) para deputados.
    
    Sistema de Premiações:
    - 👑 Coroas: Campeões históricos (todos os tempos)
    - 🏆 Troféus: Campeões anuais
    - 🥈🥉 Medalhas: 2º e 3º lugares
    """
    processed_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    
    premiacoes = {
        "coroas": [],
        "trofeus": [],
        "medalhas": [],
        "campeaoGeral": None,
        "metadata": {
            "generatedAt": processed_at,
            "totalPremiacoes": 0
        }
    }
    
    # 👑 COROAS - Campeões Históricos
    
    # 1. Campeão Geral Histórico (1º lugar geral)
    if rankings["geral"]:
        campeao = rankings["geral"][0]
        premiacoes["campeaoGeral"] = {
            "id": campeao["id"],
            "nome": campeao["nome"],
            "partido": campeao["partido"],
            "uf": campeao["uf"],
            "totalDespesas": campeao["totalDespesas"],
            "tipo": "CAMPEAO_GERAL_HISTORICO"
        }
        
        premiacoes["coroas"].append({
            "id": f"COROA-GERAL-{campeao['id']}",
            "tipo": "CAMPEAO_GERAL_HISTORICO",
            "deputadoId": campeao["id"],
            "deputado": campeao["nome"],
            "valor": campeao["totalDespesas"],
            "unidade": "R$",
            "descricao": f"👑 Campeão Geral Histórico - Maior gastador de todos os tempos",
            "dataConquista": processed_at,
            "categoria": "GERAL",
            "ano": "TODOS"
        })
    
    # 2. Campeões Regionais Históricos (1º por UF)
    for uf, ranking_uf in rankings["porUf"].items():
        if ranking_uf:
            campeao_uf = ranking_uf[0]
            premiacoes["coroas"].append({
                "id": f"COROA-UF-{uf}-{campeao_uf['id']}",
                "tipo": "CAMPEAO_REGIONAL_HISTORICO",
                "deputadoId": campeao_uf["id"],
                "deputado": campeao_uf["nome"],
                "valor": campeao_uf["totalDespesas"],
                "unidade": "R$",
                "descricao": f"👑 Campeão Regional de {uf} - Maior gastador histórico da UF",
                "dataConquista": processed_at,
                "categoria": "REGIONAL",
                "ano": "TODOS",
                "uf": uf
            })
    
    # 3. Campeão de Transações Históricas
    if deputados:
        campeao_transacoes = max(deputados, key=lambda d: d.numero_despesas)
        premiacoes["coroas"].append({
            "id": f"COROA-TRANSACOES-{campeao_transacoes.id}",
            "tipo": "CAMPEAO_TRANSACOES_HISTORICO",
            "deputadoId": campeao_transacoes.id,
            "deputado": campeao_transacoes.nome,
            "valor": campeao_transacoes.numero_despesas,
            "unidade": "transações",
            "descricao": f"👑 Campeão de Transações - Maior número de despesas registradas ({campeao_transacoes.numero_despesas:,})",
            "dataConquista": processed_at,
            "categoria": "TRANSACOES",
            "ano": "TODOS"
        })
    
    # 4. Campeão de Diversificação (mais fornecedores)
    if deputados:
        campeao_fornecedores = max(deputados, key=lambda d: d.fornecedores_identificados)
        premiacoes["coroas"].append({
            "id": f"COROA-FORNECEDORES-{campeao_fornecedores.id}",
            "tipo": "CAMPEAO_DIVERSIFICACAO_HISTORICO",
            "deputadoId": campeao_fornecedores.id,
            "deputado": campeao_fornecedores.nome,
            "valor": campeao_fornecedores.fornecedores_identificados,
            "unidade": "fornecedores",
            "descricao": f"👑 Campeão de Diversificação - Maior variedade de fornecedores ({campeao_fornecedores.fornecedores_identificados:,})",
            "dataConquista": processed_at,
            "categoria": "DIVERSIFICACAO",
            "ano": "TODOS"
        })
    
    # 🥈🥉 MEDALHAS - 2º e 3º lugares do ranking geral
    if len(rankings["geral"]) >= 2:
        segundo_lugar = rankings["geral"][1]
        premiacoes["medalhas"].append({
            "id": f"MEDALHA-PRATA-GERAL-{segundo_lugar['id']}",
            "tipo": "SEGUNDO_LUGAR_GERAL",
            "deputadoId": segundo_lugar["id"],
            "deputado": segundo_lugar["nome"],
            "valor": segundo_lugar["totalDespesas"],
            "unidade": "R$",
            "descricao": f"🥈 2º Lugar Geral - Vice-campeão histórico de gastos",
            "dataConquista": processed_at,
            "categoria": "GERAL",
            "ano": "TODOS",
            "posicao": 2
        })
    
    if len(rankings["geral"]) >= 3:
        terceiro_lugar = rankings["geral"][2]
        premiacoes["medalhas"].append({
            "id": f"MEDALHA-BRONZE-GERAL-{terceiro_lugar['id']}",
            "tipo": "TERCEIRO_LUGAR_GERAL",
            "deputadoId": terceiro_lugar["id"],
            "deputado": terceiro_lugar["nome"],
            "valor": terceiro_lugar["totalDespesas"],
            "unidade": "R$",
            "descricao": f"🥉 3º Lugar Geral - Terceiro colocado histórico",
            "dataConquista": processed_at,
            "categoria": "GERAL",
            "ano": "TODOS",
            "posicao": 3
        })
    
    # Atualizar total de premiações
    premiacoes["metadata"]["totalPremiacoes"] = (
        len(premiacoes["coroas"]) +
        len(premiacoes["trofeus"]) +
        len(premiacoes["medalhas"])
    )
    
    return premiacoes


def gerar_rankings_fornecedores(fornecedores: Sequence[Any]) -> Dict[str, Any]:
    """
    Gera rankings completos para fornecedores.
    
    Retorna:
        - geral: Ranking geral por total recebido
        - porCategoria: Rankings por categoria
        - porConexoes: Ranking por número de deputados atendidos
    """
    rankings = {
        "geral": [],
        "porCategoria": {},
        "porConexoes": []
    }
    
    # Ranking Geral (por total recebido)
    fornecedores_ordenados = sorted(
        fornecedores,
        key=lambda f: f.total_recebido,
        reverse=True
    )
    
    for posicao, forn in enumerate(fornecedores_ordenados, 1):
        rankings["geral"].append({
            "posicao": posicao,
            "id": forn.id,
            "nome": forn.nome,
            "cnpjCpf": forn.cnpj_cpf,
            "totalRecebido": forn.total_recebido,
            "numeroTransacoes": forn.numero_transacoes,
            "numeroDeputados": forn.numero_deputados,
            "scoreSuspeicao": forn.score_suspeicao
        })
    
    # Ranking por Conexões (deputados atendidos)
    fornecedores_por_conexoes = sorted(
        fornecedores,
        key=lambda f: f.numero_deputados,
        reverse=True
    )
    
    rankings["porConexoes"] = [
        {
            "posicao": i + 1,
            "id": forn.id,
            "nome": forn.nome,
            "numeroDeputados": forn.numero_deputados,
            "totalRecebido": forn.total_recebido
        }
        for i, forn in enumerate(fornecedores_por_conexoes[:20])  # Top 20
    ]
    
    return rankings


def gerar_premiacoes_fornecedores(
    fornecedores: Sequence[Any],
    rankings: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Gera premiações para fornecedores.
    """
    processed_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    
    premiacoes = {
        "coroas": [],
        "trofeus": [],
        "medalhas": [],
        "metadata": {
            "generatedAt": processed_at,
            "totalPremiacoes": 0
        }
    }
    
    # 👑 COROAS - Fornecedores Campeões
    
    # 1. Maior Recebedor Histórico
    if rankings["geral"]:
        campeao = rankings["geral"][0]
        premiacoes["coroas"].append({
            "id": f"COROA-FORNECEDOR-GERAL-{campeao['id']}",
            "tipo": "MAIOR_RECEBEDOR_HISTORICO",
            "fornecedorId": campeao["id"],
            "fornecedor": campeao["nome"],
            "valor": campeao["totalRecebido"],
            "unidade": "R$",
            "descricao": f"👑 Maior Recebedor Histórico - Fornecedor que mais recebeu recursos",
            "dataConquista": processed_at,
            "categoria": "GERAL"
        })
    
    # 2. Mais Conectado (atende mais deputados)
    if rankings["porConexoes"]:
        mais_conectado = rankings["porConexoes"][0]
        premiacoes["coroas"].append({
            "id": f"COROA-FORNECEDOR-CONEXOES-{mais_conectado['id']}",
            "tipo": "MAIS_CONECTADO",
            "fornecedorId": mais_conectado["id"],
            "fornecedor": mais_conectado["nome"],
            "valor": mais_conectado["numeroDeputados"],
            "unidade": "deputados",
            "descricao": f"👑 Mais Conectado - Atende {mais_conectado['numeroDeputados']} deputados",
            "dataConquista": processed_at,
            "categoria": "CONEXOES"
        })
    
    # 3. Maior Score de Suspeição
    if fornecedores:
        mais_suspeito = max(fornecedores, key=lambda f: f.score_suspeicao or 0)
        if mais_suspeito.score_suspeicao and mais_suspeito.score_suspeicao > 0:
            premiacoes["coroas"].append({
                "id": f"COROA-FORNECEDOR-SUSPEICAO-{mais_suspeito.id}",
                "tipo": "MAIOR_SUSPEICAO",
                "fornecedorId": mais_suspeito.id,
                "fornecedor": mais_suspeito.nome,
                "valor": mais_suspeito.score_suspeicao,
                "unidade": "score",
                "descricao": f"⚠️ Maior Score de Suspeição - Atenção redobrada necessária",
                "dataConquista": processed_at,
                "categoria": "SUSPEICAO"
            })
    
    # 🥈🥉 MEDALHAS - 2º e 3º lugares
    if len(rankings["geral"]) >= 2:
        segundo = rankings["geral"][1]
        premiacoes["medalhas"].append({
            "id": f"MEDALHA-FORNECEDOR-PRATA-{segundo['id']}",
            "tipo": "SEGUNDO_LUGAR_RECEBIMENTO",
            "fornecedorId": segundo["id"],
            "fornecedor": segundo["nome"],
            "valor": segundo["totalRecebido"],
            "unidade": "R$",
            "descricao": "🥈 2º Maior Recebedor",
            "dataConquista": processed_at,
            "posicao": 2
        })
    
    if len(rankings["geral"]) >= 3:
        terceiro = rankings["geral"][2]
        premiacoes["medalhas"].append({
            "id": f"MEDALHA-FORNECEDOR-BRONZE-{terceiro['id']}",
            "tipo": "TERCEIRO_LUGAR_RECEBIMENTO",
            "fornecedorId": terceiro["id"],
            "fornecedor": terceiro["nome"],
            "valor": terceiro["totalRecebido"],
            "unidade": "R$",
            "descricao": "🥉 3º Maior Recebedor",
            "dataConquista": processed_at,
            "posicao": 3
        })
    
    premiacoes["metadata"]["totalPremiacoes"] = (
        len(premiacoes["coroas"]) +
        len(premiacoes["trofeus"]) +
        len(premiacoes["medalhas"])
    )
    
    return premiacoes

