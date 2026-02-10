# Guia de Instalação

## Pré-requisitos

- Ambiente Antigravity instalado
- Git instalado
- Conhecimento básico de agentes e skills

## Métodos de Instalação

### Método 1: Clonar o Repositório

```bash
# Clone o kit
git clone https://github.com/luanps2/antigravity-plus.git

# Navegue até seu projeto
cd seu-projeto-antigravity

# Copie o diretório .agent
cp -r ../antigravity-plus/.agent .
```

### Método 2: Baixar Release

```bash
# Baixe o release mais recente
curl -L https://github.com/luanps2/antigravity-plus/archive/refs/heads/main.zip -o agent-kit.zip

# Extraia
unzip agent-kit.zip

# Copie para seu projeto
cp -r antigravity-plus-main/. seu-projeto/.agent/
```

### Método 3: Git Submodule (Avançado)

```bash
# Adicione como submódulo
git submodule add https://github.com/luanps2/antigravity-plus.git .agent/kit

# Inicialize e atualize
git submodule init
git submodule update
```

## Estrutura do Projeto Após Instalação

```
seu-projeto/
├── .agent/
│   ├── agents/           # Definições de agentes
│   ├── skills/           # Skills reutilizáveis
│   └── workflows/        # Workflows padrão
├── src/                  # Código da sua aplicação
├── docs/                 # Sua documentação
└── README.md
```

## Verificação

Verifique a instalação checando se estes arquivos existem:

```bash
ls .agent/agents/frontend_ui_ux/AGENT.md
ls .agent/skills/create_component/SKILL.md  
ls .agent/workflows/create_feature.md
```

## Configuração

### 1. Personalizar Definições de Agentes (Opcional)

Você pode personalizar as definições dos agentes em `.agent/agents/*/AGENT.md` para corresponder às necessidades do seu projeto.

### 2. Adicionar Skills Customizadas (Opcional)

Adicione suas próprias skills em `.agent/skills/sua_skill/SKILL.md`.

### 3. Ajustar Workflows (Opcional)

Modifique workflows em `.agent/workflows/*.md` para adequar ao seu processo.

## Atualizando o Kit

### Se instalado via clone/download:

```bash
cd antigravity-plus
git pull origin main
cp -r .agent/* seu-projeto/.agent/
```

### Se instalado como submódulo:

```bash
git submodule update --remote .agent/kit
```

## Próximos Passos

1. Leia [USAGE.md](USAGE.md) para aprender como usar os agentes
2. Revise [COMMUNICATION_PATTERNS.md](COMMUNICATION_PATTERNS.md) para regras de interação
```markdown
3. Explore as definições de agentes em `.agent/agents/`
```

## Solução de Problemas

### Problema: Arquivos não encontrados após instalação

**Solução:** Certifique-se de que copiou toda a estrutura do diretório `.agent`.

### Problema: Agentes não reconhecendo skills

**Solução:** Verifique se os arquivos de skill estão no formato `.agent/skills/*/SKILL.md`.

### Problema: Workflows não funcionando

**Solução:** Certifique-se de que os workflows estão no formato `.agent/workflows/*.md`.

## Suporte

Para problemas, por favor:
1. Verifique o [FAQ](docs/FAQ.md)
2. Abra uma issue no GitHub
3. Junte-se às nossas discussões da comunidade
