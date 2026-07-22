const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'public')));

// Uploads (Multer para importação de CSV)
const upload = multer({ dest: 'uploads/' });

// Inicialização do Banco de Dados SQLite
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar no banco SQLite:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite local.');
  }
});

// Criar tabela de Propostas
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nrProposta TEXT UNIQUE,
      objeto TEXT,
      situacao TEXT,
      valorTotal REAL,
      valorTransferencia REAL,
      valorContrapartida REAL,
      justificativa TEXT,
      dataCadastro TEXT,
      dataEnvio TEXT,
      proponente TEXT,
      cnpj TEXT,
      municipio TEXT,
      uf TEXT,
      orgaoConcedente TEXT,
      ministerio TEXT,
      modalidade TEXT,
      ano INTEGER,
      responsavel TEXT,
      telefone TEXT,
      email TEXT,
      observacoes TEXT,
      programa TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Erro ao criar tabela:', err.message);
    } else {
      console.log('Tabela de propostas criada/verificada.');
      bootstrapData();
    }
  });
});

// Carga de dados iniciais se o banco estiver vazio
function bootstrapData() {
  db.get('SELECT COUNT(*) as count FROM proposals', (err, row) => {
    if (err) return console.error(err.message);
    
    if (row.count === 0) {
      console.log('Banco vazio. Populando com dados iniciais...');
      
      // Importar dados simulados do data.js
      const INITIAL_PROPOSALS = [
        {
          id: 32924,
          nrProposta: "56000005874/2023",
          objeto: "Urbanização de Vias Públicas",
          situacao: "SELECIONADA",
          valorTotal: 160586943.35,
          valorTransferencia: 152557596.18,
          valorContrapartida: 8029347.17,
          justificativa: "A área do município necessita de drenagem, pavimentação urbana e acessibilidade para integração dos bairros periféricos.",
          dataCadastro: "2023-04-12",
          dataEnvio: "2023-05-10",
          proponente: "Prefeitura Municipal de Salvador",
          cnpj: "13.927.801/0001-58",
          municipio: "Salvador",
          uf: "BA",
          orgaoConcedente: "MINISTERIO DAS CIDADES",
          ministerio: "Cidades",
          modalidade: "Contrato de Repasse",
          ano: 2023,
          responsavel: "Carlos Eduardo Santos",
          telefone: "(71) 3202-1200",
          email: "planejamento@salvador.ba.gov.br",
          observacoes: "Proposta prioritária do PAC - Plano de Aceleração do Crescimento.",
          programa: "Apoio a Projetos de Desenvolvimento Urbano"
        },
        {
          id: 17298,
          nrProposta: "56000002551/2023",
          objeto: "DIAGNÓSTICO SETORIAL DE MOBILIDADE",
          situacao: "SELECIONADA",
          valorTotal: 2625000.00,
          valorTransferencia: 2493750.00,
          valorContrapartida: 131250.00,
          justificativa: "O Plano de Mobilidade Urbana exige diagnóstico detalhado das linhas de ônibus e fluxo de ciclistas.",
          dataCadastro: "2023-03-15",
          dataEnvio: "2023-04-05",
          proponente: "Prefeitura Municipal de Belo Horizonte",
          cnpj: "18.715.383/0001-40",
          municipio: "Belo Horizonte",
          uf: "MG",
          orgaoConcedente: "MINISTERIO DAS CIDADES",
          ministerio: "Cidades",
          modalidade: "Contrato de Repasse",
          ano: 2023,
          responsavel: "Mariana Alvarenga",
          telefone: "(31) 3277-1000",
          email: "mobilidade@pbh.gov.br",
          observacoes: "Estudo base para plano diretor de ciclovias.",
          programa: "Mobilidade Urbana Eficiente"
        },
        {
          id: 13248,
          nrProposta: "36000004986/2023",
          objeto: "Aquisição de Equipamentos de Saúde",
          situacao: "NAO_HABILITADA",
          valorTotal: 4500000.00,
          valorTransferencia: 4500000.00,
          valorContrapartida: 0.00,
          justificativa: "A aquisição visa reforçar os atendimentos de atenção primária do Hospital Municipal Zona Sul.",
          dataCadastro: "2023-02-10",
          dataEnvio: "2023-03-12",
          proponente: "Consórcio Intermunicipal de Saúde do Vale do Aço",
          cnpj: "05.412.981/0001-90",
          municipio: "Ipatinga",
          uf: "MG",
          orgaoConcedente: "MINISTERIO DA SAUDE",
          ministerio: "Saúde",
          modalidade: "Convênio",
          ano: 2023,
          responsavel: "José Silva Pereira",
          telefone: "(31) 3829-8000",
          email: "saude@valedoaco.mg.gov.br",
          observacoes: "Rejeitada por pendência na certidão previdenciária do consórcio.",
          programa: "Apoio à Manutenção de Unidades de Saúde"
        },
        {
          id: 94047,
          nrProposta: "26298010457/2023",
          objeto: "CONSTRUÇÃO DE CRECHE INFANTIL",
          situacao: "HABILITADA",
          valorTotal: 182160000.00,
          valorTransferencia: 173052000.00,
          valorContrapartida: 9108000.00,
          justificativa: "AUMENTO DA DEMANDA POR VAGAS NA EDUCAÇÃO INFANTIL NO DISTRITO INDUSTRIAL E PERIFERIAS.",
          dataCadastro: "2023-06-20",
          dataEnvio: "2023-07-15",
          proponente: "Prefeitura Municipal de Manaus",
          cnpj: "04.312.401/0001-02",
          municipio: "Manaus",
          uf: "AM",
          orgaoConcedente: "MINISTERIO DA EDUCACAO",
          ministerio: "Educação",
          modalidade: "Termo de Compromisso",
          ano: 2023,
          responsavel: "Ana Julia Valente",
          telefone: "(92) 3622-4400",
          email: "semed@manaus.am.gov.br",
          observacoes: "Meta física de 15 novas creches padrão FNDE.",
          programa: "Pró-Infância - Construção de Escolas"
        },
        {
          id: 20858,
          nrProposta: "56000003289/2023",
          objeto: "OBTENÇÃO DE MÁQUINAS AGRÍCOLAS",
          situacao: "SELECIONADA",
          valorTotal: 27262879.34,
          valorTransferencia: 25899735.37,
          valorContrapartida: 1363143.97,
          justificativa: "ESTE PLEITO VISA O DESENVOLVIMENTO DA AGRICULTURA FAMILIAR ATRAVÉS DO FORNECIMENTO DE TRATORES E IMPLEMENTOS.",
          dataCadastro: "2023-05-02",
          dataEnvio: "2023-05-25",
          proponente: "Consórcio de Desenvolvimento da Região Sul da Bahia",
          cnpj: "12.876.543/0001-88",
          municipio: "Itabuna",
          uf: "BA",
          orgaoConcedente: "MINISTERIO DO DESENVOLVIMENTO AGRARIO",
          ministerio: "Desenvolvimento Agrário",
          modalidade: "Convênio",
          ano: 2023,
          responsavel: "Marcos Antonio Vieira",
          telefone: "(73) 3214-9000",
          email: "agricultura@suldabahia.ba.gov.br",
          observacoes: "Emenda de bancada estadual.",
          programa: "Fomento ao Setor Agropecuário"
        },
        {
          id: 29298,
          nrProposta: "56000005049/2023",
          objeto: "Urbanização e Saneamento Integrado",
          situacao: "HABILITADA",
          valorTotal: 91814889.49,
          valorTransferencia: 87224145.02,
          valorContrapartida: 4590744.47,
          justificativa: "O assentamento precário do rio Iguaçu necessita de rede coletora de esgoto e regularização urbana.",
          dataCadastro: "2023-08-01",
          dataEnvio: "2023-08-20",
          proponente: "Prefeitura Municipal de Nova Iguaçu",
          cnpj: "29.138.278/0001-01",
          municipio: "Nova Iguaçu",
          uf: "RJ",
          orgaoConcedente: "MINISTERIO DAS CIDADES",
          ministerio: "Cidades",
          modalidade: "Contrato de Repasse",
          ano: 2023,
          responsavel: "Julio Cesar Lemos",
          telefone: "(21) 2666-4900",
          email: "infra@novaiguacu.rj.gov.br",
          observacoes: "Inclui intervenções de reassentamento habitacional.",
          programa: "Apoio a Projetos de Desenvolvimento Urbano"
        },
        {
          id: 32014,
          nrProposta: "36000011981/2023",
          objeto: "CONSTRUÇÃO DE UNIDADE BÁSICA DE SAÚDE - PORTE III",
          situacao: "SELECIONADA",
          valorTotal: 6584873.85,
          valorTransferencia: 6255630.16,
          valorContrapartida: 329243.69,
          justificativa: "Esta solicitação destina-se a expandir a cobertura da saúde da família nos bairros da zona leste.",
          dataCadastro: "2023-09-10",
          dataEnvio: "2023-10-01",
          proponente: "Prefeitura Municipal de Campinas",
          cnpj: "46.362.480/0001-20",
          municipio: "Campinas",
          uf: "SP",
          orgaoConcedente: "MINISTERIO DA SAUDE",
          ministerio: "Saúde",
          modalidade: "Fundo a Fundo",
          ano: 2023,
          responsavel: "Dr. Fernando Henrique",
          telefone: "(19) 2116-0100",
          email: "saude@campinas.sp.gov.br",
          observacoes: "Construção de UBS de grande porte com 4 equipes completas.",
          programa: "Estruturação da Rede de Atenção Básica"
        },
        {
          id: 33682,
          nrProposta: "51000003866/2023",
          objeto: "Espaço Esportivo Multifuncional Arena Jovem",
          situacao: "HABILITADA",
          valorTotal: 1500000.00,
          valorTransferencia: 1425000.00,
          valorContrapartida: 75000.00,
          justificativa: "A prefeitura visa a implantação de praça esportiva com quadra coberta e pista de skate para inclusão social.",
          dataCadastro: "2023-07-15",
          dataEnvio: "2023-08-05",
          proponente: "Prefeitura Municipal de Chapecó",
          cnpj: "83.021.808/0001-09",
          municipio: "Chapecó",
          uf: "SC",
          orgaoConcedente: "MINISTERIO DO ESPORTE",
          ministerio: "Esporte",
          modalidade: "Convênio",
          ano: 2023,
          responsavel: "Gerson Martins",
          telefone: "(49) 3321-8400",
          email: "esportes@chapeco.sc.gov.br",
          observacoes: "Projeto padrão da Secretaria Nacional de Esporte e Lazer.",
          programa: "Implantação de Infraestrutura Esportiva"
        },
        {
          id: 29367,
          nrProposta: "56000005066/2023",
          objeto: "Execução de Obras de Macrodrenagem",
          situacao: "EM_ANALISE",
          valorTotal: 164915194.41,
          valorTransferencia: 156669434.69,
          valorContrapartida: 8245759.72,
          justificativa: "A prefeitura busca mitigar os efeitos das enchentes anuais nas bacias hidrográficas centrais.",
          dataCadastro: "2023-08-03",
          dataEnvio: "2023-08-30",
          proponente: "Prefeitura Municipal de Porto Alegre",
          cnpj: "92.787.265/0001-40",
          municipio: "Porto Alegre",
          uf: "RS",
          orgaoConcedente: "MINISTERIO DAS CIDADES",
          ministerio: "Cidades",
          modalidade: "Contrato de Repasse",
          ano: 2023,
          responsavel: "Rodrigo Dutra",
          telefone: "(51) 3289-0100",
          email: "obras@portoalegre.rs.gov.br",
          observacoes: "Em análise detalhada na Caixa Econômica Federal.",
          programa: "Gestão de Riscos e Prevenção de Desastres"
        },
        {
          id: 32551,
          nrProposta: "36000012142/2023",
          objeto: "CONSTRUÇÃO DE CENTRO DE ATENÇÃO PSICOSSOCIAL",
          situacao: "HABILITADA",
          valorTotal: 2765371.03,
          valorTransferencia: 2627102.48,
          valorContrapartida: 138268.55,
          justificativa: "Esta solicitação destina-se a expandir a rede de atendimento CAPS AD III para suporte a dependentes químicos.",
          dataCadastro: "2023-09-18",
          dataEnvio: "2023-10-10",
          proponente: "Prefeitura Municipal de Sobral",
          cnpj: "07.598.634/0001-37",
          municipio: "Sobral",
          uf: "CE",
          orgaoConcedente: "MINISTERIO DA SAUDE",
          ministerio: "Saúde",
          modalidade: "Convênio",
          ano: 2023,
          responsavel: "Gerardo Filho",
          telefone: "(88) 3677-1100",
          email: "saude@sobral.ce.gov.br",
          observacoes: "Projeto arquitetônico aprovado pela Vigilância Sanitária.",
          programa: "Apoio a Redes de Atenção Psicossocial"
        },
        {
          id: 93701,
          nrProposta: "36000022499/2025",
          objeto: "MODERNIZAÇÃO DE LEITOS DE UTI ADULTO",
          situacao: "HABILITADA",
          valorTotal: 60000000.00,
          valorTransferencia: 57000000.00,
          valorContrapartida: 3000000.00,
          justificativa: "Melhoria e ampliação da infraestrutura hospitalar de alta complexidade com novos respiradores e monitores.",
          dataCadastro: "2025-01-10",
          dataEnvio: "2025-02-05",
          proponente: "Secretaria Estadual de Saúde do Ceará",
          cnpj: "07.954.544/0001-00",
          municipio: "Fortaleza",
          uf: "CE",
          orgaoConcedente: "MINISTERIO DA SAUDE",
          ministerio: "Saúde",
          modalidade: "Fundo a Fundo",
          ano: 2025,
          responsavel: "Dra. Tânia Coelho",
          telefone: "(85) 3101-5100",
          email: "gabinete@saude.ce.gov.br",
          observacoes: "Emenda parlamentar impositiva de bancada.",
          programa: "Fortalecimento do Sistema Único de Saúde (SUS)"
        },
        {
          id: 85031,
          nrProposta: "36000021086/2025",
          objeto: "Centro de Atenção Especializada",
          situacao: "NAO_HABILITADA",
          valorTotal: 8500000.00,
          valorTransferencia: 8075000.00,
          valorContrapartida: 425000.00,
          justificativa: "O CAPS é a referência microregional e carece de salas de acolhimento adequadas.",
          dataCadastro: "2025-03-01",
          dataEnvio: "2025-03-20",
          proponente: "Prefeitura Municipal de Parnaíba",
          cnpj: "06.554.409/0001-04",
          municipio: "Parnaíba",
          uf: "PI",
          orgaoConcedente: "MINISTERIO DA SAUDE",
          ministerio: "Saúde",
          modalidade: "Convênio",
          ano: 2025,
          responsavel: "Felipe Siqueira",
          telefone: "(86) 3321-1500",
          email: "saude@parnaiba.pi.gov.br",
          observacoes: "Documento de propriedade do terreno não atendeu aos critérios formais.",
          programa: "Apoio a Redes de Atenção Psicossocial"
        },
        {
          id: 82913,
          nrProposta: "56000001799/2025",
          objeto: "O objetivo é requalificar o Centro Histórico",
          situacao: "HABILITADA",
          valorTotal: 99624176.38,
          valorTransferencia: 94642967.56,
          valorContrapartida: 4981208.82,
          justificativa: "A urbanização e fomento do comércio local visa preservar patrimônio histórico nacional e atrair turismo.",
          dataCadastro: "2025-02-12",
          dataEnvio: "2025-03-05",
          proponente: "Prefeitura Municipal de Olinda",
          cnpj: "10.404.184/0001-09",
          municipio: "Olinda",
          uf: "PE",
          orgaoConcedente: "MINISTERIO DAS CIDADES",
          ministerio: "Cidades",
          modalidade: "Contrato de Repasse",
          ano: 2025,
          responsavel: "Renata Amorim",
          telefone: "(81) 3439-4400",
          email: "turismo@olinda.pe.gov.br",
          observacoes: "Convênio com anuência do IPHAN.",
          programa: "Apoio a Projetos de Desenvolvimento Urbano"
        },
        {
          id: 80273,
          nrProposta: "56000001464/2025",
          objeto: "Urbanização de Assentamentos Vulneráveis",
          situacao: "NAO_HABILITADA",
          valorTotal: 99802514.38,
          valorTransferencia: 94812388.66,
          valorContrapartida: 4990125.72,
          justificativa: "O assentamento necessita de redes de esgoto pluvial, escadarias corrimão e áreas verdes.",
          dataCadastro: "2025-02-05",
          dataEnvio: "2025-02-28",
          proponente: "Prefeitura Municipal de Salvador",
          cnpj: "13.927.801/0001-58",
          municipio: "Salvador",
          uf: "BA",
          orgaoConcedente: "MINISTERIO DAS CIDADES",
          ministerio: "Cidades",
          modalidade: "Contrato de Repasse",
          ano: 2025,
          responsavel: "Carlos Eduardo Santos",
          telefone: "(71) 3202-1200",
          email: "planejamento@salvador.ba.gov.br",
          observacoes: "Arquivada devido a restrições no Cadastro Único de Convênios do Estado.",
          programa: "Apoio a Projetos de Desenvolvimento Urbano"
        },
        {
          id: 32990,
          nrProposta: "36000000117/2023",
          objeto: "Implantação de Unidade de Pronto Atendimento UPA",
          situacao: "NAO_HABILITADA",
          valorTotal: 12000000.00,
          valorTransferencia: 11400000.00,
          valorContrapartida: 600000.00,
          justificativa: "Justifica-se a ampliação do atendimento de urgência e emergência 24h na zona sul da metrópole.",
          dataCadastro: "2023-01-20",
          dataEnvio: "2023-02-15",
          proponente: "Prefeitura Municipal de São Paulo",
          cnpj: "46.395.000/0001-39",
          municipio: "São Paulo",
          uf: "SP",
          orgaoConcedente: "MINISTERIO DA SAUDE",
          ministerio: "Saúde",
          modalidade: "Fundo a Fundo",
          ano: 2023,
          responsavel: "Dr. Marcos Vinicius",
          telefone: "(11) 3010-4000",
          email: "atencao24h@prefeitura.sp.gov.br",
          observacoes: "Divergência na planta aprovada pelo ministério contra as diretrizes locais.",
          programa: "Estruturação de Redes de Urgência e Emergência"
        },
        {
          id: 80297,
          nrProposta: "36000018832/2023",
          objeto: "CONSTRUÇÃO DE UBS CENTRAL",
          situacao: "SELECIONADA",
          valorTotal: 4306000.00,
          valorTransferencia: 4090700.00,
          valorContrapartida: 215300.00,
          justificativa: "A solicitação visa centralizar especialidades médicas básicas e exames laboratoriais.",
          dataCadastro: "2023-11-05",
          dataEnvio: "2023-11-20",
          proponente: "Prefeitura Municipal de Caruaru",
          cnpj: "10.307.509/0001-29",
          municipio: "Caruaru",
          uf: "PE",
          orgaoConcedente: "MINISTERIO DA SAUDE",
          ministerio: "Saúde",
          modalidade: "Convênio",
          ano: 2023,
          responsavel: "Licia Maria Souza",
          telefone: "(81) 3721-3000",
          email: "saude@caruaru.pe.gov.br",
          observacoes: "Excelente proposta com planta padrão ministerial.",
          programa: "Estruturação da Rede de Atenção Básica"
        },
        {
          id: 34091,
          nrProposta: "36000012549/2023",
          objeto: "CONSTRUÇÃO DE POSTO DE SAÚDE FLUVIAL",
          situacao: "CADASTRADA",
          valorTotal: 7800000.00,
          valorTransferencia: 7410000.00,
          valorContrapartida: 390000.00,
          justificativa: "Esta solicitação visa atender a populações ribeirinhas do Rio Solimões com consultas e vacinas.",
          dataCadastro: "2023-10-15",
          dataEnvio: null,
          proponente: "Prefeitura Municipal de Coari",
          cnpj: "04.225.409/0001-09",
          municipio: "Coari",
          uf: "AM",
          orgaoConcedente: "MINISTERIO DA SAUDE",
          ministerio: "Saúde",
          modalidade: "Fundo a Fundo",
          ano: 2023,
          responsavel: "Elmer Pinheiro",
          telefone: "(92) 3551-1200",
          email: "saudecoari@coari.am.gov.br",
          observacoes: "Em fase de execução física pelo proponente.",
          programa: "Estruturação da Rede de Atenção Básica"
        },
        {
          id: 64220,
          nrProposta: "36000010242/2025",
          objeto: "Aquisição de Ambulâncias do SAMU",
          situacao: "NAO_HABILITADA",
          valorTotal: 1200000.00,
          valorTransferencia: 1140000.00,
          valorContrapartida: 60000.00,
          justificativa: "A aquisição é fundamental para substituir a frota desgastada e que opera acima da capacidade recomendada.",
          dataCadastro: "2025-04-12",
          dataEnvio: "2025-04-30",
          proponente: "Prefeitura Municipal de Joinville",
          cnpj: "83.187.054/0001-99",
          municipio: "Joinville",
          uf: "SC",
          orgaoConcedente: "MINISTERIO DA SAUDE",
          ministerio: "Saúde",
          modalidade: "Convênio",
          ano: 2025,
          responsavel: "Valter Muller",
          telefone: "(47) 3431-3000",
          email: "samu@joinville.sc.gov.br",
          observacoes: "Não habilitada devido a irregularidades cadastrais no CAUC.",
          programa: "Estruturação de Redes de Urgência e Emergência"
        },
        {
          id: 39931,
          nrProposta: "36000001384/2024",
          objeto: "RENOVAÇÃO DE EQUIPAMENTOS ODONTOLÓGICOS",
          situacao: "HABILITADA",
          valorTotal: 289000.00,
          valorTransferencia: 274550.00,
          valorContrapartida: 14450.00,
          justificativa: "Melhorar e ampliar a capacidade operacional dos postos de saúde bucal e consultórios móveis nas escolas rurais.",
          dataCadastro: "2024-02-15",
          dataEnvio: "2024-03-01",
          proponente: "Prefeitura Municipal de Juazeiro do Norte",
          cnpj: "07.600.809/0001-09",
          municipio: "Juazeiro do Norte",
          uf: "CE",
          orgaoConcedente: "MINISTERIO DA SAUDE",
          ministerio: "Saúde",
          modalidade: "Fundo a Fundo",
          ano: 2024,
          responsavel: "Patricia Ferreira",
          telefone: "(88) 3566-1000",
          email: "saudebucal@juazeiro.ce.gov.br",
          observacoes: "Aprovada e aguardando empenho financeiro.",
          programa: "Brasil Sorridente - Saúde Bucal"
        },
        {
          id: 31188,
          nrProposta: "56000005448/2023",
          objeto: "OBRAS DE CONTENÇÃO DE ENCOSTAS",
          situacao: "SELECIONADA",
          valorTotal: 26142484.24,
          valorTransferencia: 24835360.03,
          valorContrapartida: 1307124.21,
          justificativa: "DADO A QUANTIDADE DE ÁREAS DE ALTO RISCO GEOLÓGICO NO MUNICÍPIO QUE SOFREM COM DESLIZAMENTOS NA ÉPOCA DE CHUVAS.",
          dataCadastro: "2023-09-02",
          dataEnvio: "2023-09-25",
          proponente: "Prefeitura Municipal de Petrópolis",
          cnpj: "29.138.302/0001-99",
          municipio: "Petrópolis",
          uf: "RJ",
          orgaoConcedente: "MINISTERIO DAS CIDADES",
          ministerio: "Cidades",
          modalidade: "Contrato de Repasse",
          ano: 2023,
          responsavel: "Luiz Fernando Souza",
          telefone: "(24) 2246-9000",
          email: "defesacivil@petropolis.rj.gov.br",
          observacoes: "Enquadramento emergencial no PAC Prevenção de Desastres.",
          programa: "Gestão de Riscos e Prevenção de Desastres"
        },
        {
          id: 84902,
          nrProposta: "56000002099/2025",
          objeto: "Projeto de Canalização de Córrego",
          situacao: "HABILITADA",
          valorTotal: 87216441.70,
          valorTransferencia: 82855619.61,
          valorContrapartida: 4360822.09,
          justificativa: "O Córrego do Limoeiro causa inundações em áreas residenciais densamente povoadas a cada período chuvoso.",
          dataCadastro: "2025-03-05",
          dataEnvio: "2025-03-25",
          proponente: "Prefeitura Municipal de Londrina",
          cnpj: "75.773.805/0001-09",
          municipio: "Londrina",
          uf: "PR",
          orgaoConcedente: "MINISTERIO DAS CIDADES",
          ministerio: "Cidades",
          modalidade: "Contrato de Repasse",
          ano: 2025,
          responsavel: "Mauro Ramos",
          telefone: "(43) 3372-4000",
          email: "obras@londrina.pr.gov.br",
          observacoes: "Licenciamento ambiental preliminar emitido pelo IAT.",
          programa: "Gestão de Riscos e Prevenção de Desastres"
        },
        {
          id: 84110,
          nrProposta: "56000001947/2025",
          objeto: "Urbanização de Favelas Integradas",
          situacao: "SELECIONADA",
          valorTotal: 99994613.46,
          valorTransferencia: 94994882.79,
          valorContrapartida: 4999730.67,
          justificativa: "O assentamento denominado 'Vila Esperança' receberá infraestrutura completa de pavimentação, esgoto e iluminação.",
          dataCadastro: "2025-02-28",
          dataEnvio: "2025-03-15",
          proponente: "Prefeitura Municipal de Recife",
          cnpj: "11.123.409/0001-99",
          municipio: "Recife",
          uf: "PE",
          orgaoConcedente: "MINISTERIO DAS CIDADES",
          ministerio: "Cidades",
          modalidade: "Contrato de Repasse",
          ano: 2025,
          responsavel: "Gisela Albuquerque",
          telefone: "(81) 3355-8000",
          email: "urbanismo@recife.pe.gov.br",
          observacoes: "Ação conjunta com o programa municipal de regularização fundiária.",
          programa: "Apoio a Projetos de Desenvolvimento Urbano"
        },
        {
          id: 31467,
          nrProposta: "56000005506/2023",
          objeto: "Urbanização do Bairro Novo Horizonte",
          situacao: "HABILITADA",
          valorTotal: 70485679.54,
          valorTransferencia: 66961395.56,
          valorContrapartida: 3524283.98,
          justificativa: "O assentamento necessita de infraestrutura básica como água encanada, asfalto e rede pluvial.",
          dataCadastro: "2023-09-08",
          dataEnvio: "2023-10-02",
          proponente: "Prefeitura Municipal de Cuiabá",
          cnpj: "03.507.415/0001-44",
          municipio: "Cuiabá",
          uf: "MT",
          orgaoConcedente: "MINISTERIO DAS CIDADES",
          ministerio: "Cidades",
          modalidade: "Contrato de Repasse",
          ano: 2023,
          responsavel: "Nelson Spindola",
          telefone: "(65) 3645-6000",
          email: "planejamento@cuiaba.mt.gov.br",
          observacoes: "Aprovado tecnicamente na GIGOV/Caixa.",
          programa: "Apoio a Projetos de Desenvolvimento Urbano"
        },
        {
          id: 33514,
          nrProposta: "51000003848/2023",
          objeto: "Espaço Esportivo do Centenário",
          situacao: "SELECIONADA",
          valorTotal: 1500000.00,
          valorTransferencia: 1425000.00,
          valorContrapartida: 75000.00,
          justificativa: "A prefeitura de Rio Branco planeja uma quadra poliesportiva equipada com acessibilidade para jovens.",
          dataCadastro: "2023-07-12",
          dataEnvio: "2023-08-01",
          proponente: "Prefeitura Municipal de Rio Branco",
          cnpj: "84.307.265/0001-09",
          municipio: "Rio Branco",
          uf: "AC",
          orgaoConcedente: "MINISTERIO DO ESPORTE",
          ministerio: "Esporte",
          modalidade: "Convênio",
          ano: 2023,
          responsavel: "Renato Albuquerque",
          telefone: "(68) 3212-7000",
          email: "esporte@riobranco.ac.gov.br",
          observacoes: "Aprovado no orçamento de emendas individuais do relator.",
          programa: "Implantação de Infraestrutura Esportiva"
        },
        {
          id: 77250,
          nrProposta: "36000011132/2025",
          objeto: "Obtenção de Mamógrafos Digitais",
          situacao: "HABILITADA",
          valorTotal: 65025391.65,
          valorTransferencia: 61774122.07,
          valorContrapartida: 3251269.58,
          justificativa: "A área de saúde da mulher no sertão necessita de expansão nos diagnósticos preventivos do câncer de mama.",
          dataCadastro: "2025-02-18",
          dataEnvio: "2025-03-10",
          proponente: "Secretaria Estadual de Saúde de Pernambuco",
          cnpj: "10.572.048/0001-20",
          municipio: "Recife",
          uf: "PE",
          orgaoConcedente: "MINISTERIO DA SAUDE",
          ministerio: "Saúde",
          modalidade: "Fundo a Fundo",
          ano: 2025,
          responsavel: "Glauber Cavalcanti",
          telefone: "(81) 3184-0000",
          email: "saude@pe.gov.br",
          observacoes: "Serão adquiridos 18 mamógrafos móveis para atendimento itinerante.",
          programa: "Fortalecimento do Sistema Único de Saúde (SUS)"
        },
        {
          id: 68366,
          nrProposta: "51000002431/2025",
          objeto: "Espaço Esportivo do Amanhã",
          situacao: "CADASTRADA",
          valorTotal: 1500000.00,
          valorTransferencia: 1425000.00,
          valorContrapartida: 75000.00,
          justificativa: "Espaço Esportivo voltado a crianças carentes, com pistas de corrida e quadras poliesportivas.",
          dataCadastro: "2025-05-15",
          dataEnvio: null,
          proponente: "Prefeitura Municipal de Curitiba",
          cnpj: "76.417.005/0001-86",
          municipio: "Curitiba",
          uf: "PR",
          orgaoConcedente: "MINISTERIO DO ESPORTE",
          ministerio: "Esporte",
          modalidade: "Convênio",
          ano: 2025,
          responsavel: "Luciana Santos",
          telefone: "(41) 3350-8484",
          email: "esporte@curitiba.pr.gov.br",
          observacoes: "Rascunho criado pelo setor de engenharia esportiva municipal.",
          programa: "Implantação de Infraestrutura Esportiva"
        },
        {
          id: 84791,
          nrProposta: "56000002076/2025",
          objeto: "Adotar pavimentação asfáltica ecológica",
          situacao: "HABILITADA",
          valorTotal: 124000000.00,
          valorTransferencia: 117800000.00,
          valorContrapartida: 6200000.00,
          justificativa: "As questões ambientais e o desgaste das rodovias vicinais requerem asfalto de borracha de alta durabilidade.",
          dataCadastro: "2025-03-02",
          dataEnvio: "2025-03-24",
          proponente: "Secretaria de Infraestrutura de Santa Catarina",
          cnpj: "82.951.310/0001-02",
          municipio: "Florianópolis",
          uf: "SC",
          orgaoConcedente: "MINISTERIO DAS CIDADES",
          ministerio: "Cidades",
          modalidade: "Contrato de Repasse",
          ano: 2025,
          responsavel: "Bernardo Silva",
          telefone: "(48) 3664-2000",
          email: "gabinete@sie.sc.gov.br",
          observacoes: "Projeto experimental aprovado pelo DNIT e Ministério das Cidades.",
          programa: "Apoio a Projetos de Desenvolvimento Urbano"
        },
        {
          id: 28893,
          nrProposta: "56000004961/2023",
          objeto: "Execução de Canalização e Contenção de Enchentes",
          situacao: "ENVIADA",
          valorTotal: 64915194.41,
          valorTransferencia: 61669434.69,
          valorContrapartida: 3245759.72,
          justificativa: "A prefeitura de Joinville busca contenção de encostas e alargamento de canais fluviais contra cheias periódicas.",
          dataCadastro: "2023-08-01",
          dataEnvio: "2023-08-10",
          proponente: "Prefeitura Municipal de Joinville",
          cnpj: "83.187.054/0001-99",
          municipio: "Joinville",
          uf: "SC",
          orgaoConcedente: "MINISTERIO DAS CIDADES",
          ministerio: "Cidades",
          modalidade: "Contrato de Repasse",
          ano: 2023,
          responsavel: "Eduardo Souza",
          telefone: "(47) 3431-3000",
          email: "seinfra@joinville.sc.gov.br",
          observacoes: "Enviada para análise final de mérito pela Secretaria Nacional de Saneamento.",
          programa: "Gestão de Riscos e Prevenção de Desastres"
        }
      ];

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO proposals (
          id, nrProposta, objeto, situacao, valorTotal, valorTransferencia, valorContrapartida,
          justificativa, dataCadastro, dataEnvio, proponente, cnpj, municipio, uf,
          orgaoConcedente, ministerio, modalidade, ano, responsavel, telefone, email, observacoes, programa
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      INITIAL_PROPOSALS.forEach((p) => {
        stmt.run([
          p.id, p.nrProposta, p.objeto, p.situacao, p.valorTotal, p.valorTransferencia, p.valorContrapartida,
          p.justificativa, p.dataCadastro, p.dataEnvio, p.proponente, p.cnpj, p.municipio, p.uf,
          p.orgaoConcedente, p.ministerio, p.modalidade, p.ano, p.responsavel, p.telefone, p.email, p.observacoes, p.programa
        ]);
      });
      stmt.finalize();
      console.log('Banco de dados semeado com propostas iniciais.');
    }
  });
}

// --------------------------------------------------------------------------
// API ENDPOINTS
// --------------------------------------------------------------------------

// 1. Obter todas as Propostas
app.get('/api/proposals', (req, res) => {
  db.all('SELECT * FROM proposals', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 2. Criar Nova Proposta
app.post('/api/proposals', (req, res) => {
  const p = req.body;
  
  // Garantir cálculos corretos
  const valorTotal = (parseFloat(p.valorTransferencia) || 0) + (parseFloat(p.valorContrapartida) || 0);

  const sql = `
    INSERT INTO proposals (
      nrProposta, objeto, situacao, valorTotal, valorTransferencia, valorContrapartida,
      justificativa, dataCadastro, dataEnvio, proponente, cnpj, municipio, uf,
      orgaoConcedente, ministerio, modalidade, ano, responsavel, telefone, email, observacoes, programa
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    p.nrProposta, p.objeto, p.situacao, valorTotal, parseFloat(p.valorTransferencia) || 0, parseFloat(p.valorContrapartida) || 0,
    p.justificativa, p.dataCadastro || new Date().toISOString().split('T')[0], p.dataEnvio || null,
    p.proponente, p.cnpj, p.municipio, p.uf, p.orgaoConcedente, p.ministerio, p.modalidade,
    parseInt(p.ano) || 2026, p.responsavel, p.telefone, p.email, p.observacoes, p.programa
  ];

  db.run(sql, params, function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, ...p, valorTotal });
  });
});

// 3. Atualizar Proposta Existente
app.put('/api/proposals/:id', (req, res) => {
  const id = req.params.id;
  const p = req.body;
  const valorTotal = (parseFloat(p.valorTransferencia) || 0) + (parseFloat(p.valorContrapartida) || 0);

  const sql = `
    UPDATE proposals SET
      nrProposta = ?, objeto = ?, situacao = ?, valorTotal = ?, valorTransferencia = ?, valorContrapartida = ?,
      justificativa = ?, dataCadastro = ?, dataEnvio = ?, proponente = ?, cnpj = ?, municipio = ?, uf = ?,
      orgaoConcedente = ?, ministerio = ?, modalidade = ?, ano = ?, responsavel = ?, telefone = ?, email = ?,
      observacoes = ?, programa = ?
    WHERE id = ?
  `;

  const params = [
    p.nrProposta, p.objeto, p.situacao, valorTotal, parseFloat(p.valorTransferencia) || 0, parseFloat(p.valorContrapartida) || 0,
    p.justificativa, p.dataCadastro, p.dataEnvio, p.proponente, p.cnpj, p.municipio, p.uf,
    p.orgaoConcedente, p.ministerio, p.modalidade, parseInt(p.ano), p.responsavel, p.telefone, p.email,
    p.observacoes, p.programa, id
  ];

  db.run(sql, params, function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: 'Proposta atualizada.', changes: this.changes });
  });
});

// 4. Excluir Proposta
app.delete('/api/proposals/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM proposals WHERE id = ?', id, function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: 'Proposta excluída.', changes: this.changes });
  });
});

// 5. Importar Dados de Planilha (CSV)
app.post('/api/proposals/import', upload.single('csvfile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const filePath = req.file.path;
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Apagar o arquivo temporário
  fs.unlinkSync(filePath);

  const lines = content.split('\n');
  if (lines.length <= 1) {
    return res.status(400).json({ error: 'Arquivo CSV vazio ou sem cabeçalhos.' });
  }

  // Detectar separador (vírgula ou ponto e vírgula)
  const headerLine = lines[0];
  const separator = headerLine.includes(';') ? ';' : ',';
  const headers = headerLine.split(separator).map(h => h.trim().replace(/^"|"$/g, ''));

  // Mapear colunas básicas
  const colIndex = {
    nrProposta: headers.findIndex(h => h.includes('NR_PROPOSTA') || h.includes('nrProposta') || h.includes('Numero')),
    objeto: headers.findIndex(h => h.includes('OBJETO') || h.includes('objeto') || h.includes('Objeto')),
    situacao: headers.findIndex(h => h.includes('SITUAC') || h.includes('situacao') || h.includes('Situacao')),
    valorTotal: headers.findIndex(h => h.includes('VALOR_TOTAL') || h.includes('valorTotal') || h.includes('ValorTotal') || h.includes('VALOR_TOTAL_PROPOSTA_SELECAO_PAC')),
    justificativa: headers.findIndex(h => h.includes('JUSTIFICATIVA') || h.includes('justificativa')),
    proponente: headers.findIndex(h => h.includes('PROPONENTE') || h.includes('proponente')),
    uf: headers.findIndex(h => h.includes('UF') || h.includes('uf')),
    municipio: headers.findIndex(h => h.includes('MUNICIPIO') || h.includes('municipio')),
    programa: headers.findIndex(h => h.includes('PROGRAMA') || h.includes('programa')),
    ministerio: headers.findIndex(h => h.includes('MINISTERIO') || h.includes('ministerio'))
  };

  let importedCount = 0;
  let errorCount = 0;

  db.serialize(() => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO proposals (
        nrProposta, objeto, situacao, valorTotal, valorTransferencia, valorContrapartida,
        justificativa, dataCadastro, dataEnvio, proponente, cnpj, municipio, uf,
        orgaoConcedente, ministerio, modalidade, ano, responsavel, telefone, email, observacoes, programa
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Dividir linha respeitando aspas
      const columns = line.split(new RegExp(`${separator}(?=(?:(?:[^"]*"){2})*[^"]*$)`)).map(c => c.trim().replace(/^"|"$/g, ''));
      
      const getVal = (col) => col !== -1 && columns[col] ? columns[col] : null;

      const nrProposta = getVal(colIndex.nrProposta) || `IMP-${Date.now()}-${i}`;
      const objeto = getVal(colIndex.objeto) || 'Importado sem objeto';
      const situacao = (getVal(colIndex.situacao) || 'CADASTRADA').toUpperCase();
      
      // Parse de Valor Financeiro
      let rawVal = getVal(colIndex.valorTotal) || '0';
      // Remover pontos de milhar e trocar vírgula por ponto decimal
      rawVal = rawVal.replace(/\./g, '').replace(',', '.');
      const valorTotal = parseFloat(rawVal) || 0;

      // Padrão de importação: se não definidos, assumimos 95% de transferência e 5% de contrapartida
      const valorTransferencia = valorTotal * 0.95;
      const valorContrapartida = valorTotal * 0.05;

      const justificativa = getVal(colIndex.justificativa) || 'Importado via planilha.';
      const proponente = getVal(colIndex.proponente) || 'Proponente Indefinido';
      const uf = (getVal(colIndex.uf) || 'DF').toUpperCase();
      const municipio = getVal(colIndex.municipio) || 'Brasília';
      const programa = getVal(colIndex.programa) || 'Programa Governamental Importado';
      const ministerio = getVal(colIndex.ministerio) || 'Cidades';

      try {
        stmt.run([
          nrProposta, objeto, situacao, valorTotal, valorTransferencia, valorContrapartida,
          justificativa, new Date().toISOString().split('T')[0], null, proponente, '00.000.000/0001-00', municipio, uf,
          `MINISTERIO DE ${ministerio.toUpperCase()}`, ministerio, 'Convênio', 2026, 'Responsável Técnico', '', '', '', programa
        ]);
        importedCount++;
      } catch (e) {
        errorCount++;
      }
    }
    stmt.finalize();

    res.json({
      success: true,
      message: `Processamento concluído. ${importedCount} propostas importadas/atualizadas. Erros: ${errorCount}.`
    });
  });
});

// Reset do Banco
app.post('/api/config/reset', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM proposals', [], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      bootstrapData();
      res.json({ message: 'Banco de dados restaurado ao padrão de fábrica.' });
    });
  });
});

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse localmente em: http://localhost:${PORT}`);
});
