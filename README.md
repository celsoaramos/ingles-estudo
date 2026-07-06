# Inglês · Resumos de Estudo

App em React para leitura rápida de assuntos de inglês — explicações simples e diretas (estilo mapa mental), com filtros por categoria/busca e exercícios de múltipla escolha. Material de apoio para quem está fazendo curso de inglês; não substitui o curso.

## Rodando

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # build de produção (dist/)
```

## Arquitetura

O projeto segue uma separação em camadas para facilitar crescimento/migração futura:

```
src/
  domain/          # tipos do domínio (Topic, Block, Exercise) e categorias
  data/topics/     # "banco de dados" — um JSON por assunto
  repositories/    # acesso a dados (Repository pattern)
    TopicRepository.ts      # contrato (interface)
    JsonTopicRepository.ts  # implementação atual (JSON local)
    index.ts                # ponto único de troca da implementação
  hooks/           # useTopics / useTopic (dados), useTopicFilter (filtros)
  components/      # componentes de apresentação (blocos, filtros, quiz)
  pages/           # HomePage (lista + filtros), TopicPage (conteúdo + exercícios)
  styles/          # CSS global (tema dark, mobile-first)
```

- **Trocar o JSON por uma API no futuro:** crie uma `ApiTopicRepository`
  implementando `TopicRepository` e troque a instância em
  `src/repositories/index.ts`. Nada mais muda.
- **Rotas** com hash (`/#/topico/:id`), então o build estático funciona em
  qualquer hospedagem (GitHub Pages etc.) sem configuração de servidor.

## Adicionando um assunto novo

1. Crie `src/data/topics/<id>.json` seguindo o schema descrito em
   [docs/content-spec.md](docs/content-spec.md) (use `conditionals.json` como referência).
2. Pronto — o arquivo é carregado automaticamente (`import.meta.glob`), aparece
   na lista e nos filtros.
# ingles-estudo
