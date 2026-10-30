# Alíquota Simples

Calculadora estática da alíquota efetiva do Simples Nacional para o campo
**“Valor aproximado dos tributos”** (Passo 19) da NFS-e.

O cálculo segue a fórmula oficial:

```
alíquota efetiva = (RBT12 × alíquota nominal − parcela a deduzir) ÷ RBT12
```

## Como rodar

Não há build nem backend. Basta servir a pasta como arquivos estáticos:

```bash
cd simples-aliquota-site
python -m http.server 8765
```

Abra <http://localhost:8765>.

Abrir `index.html` direto pelo `file://` pode impedir o PDF.js de carregar o
worker; por isso o servidor local é o caminho recomendado.

## O que faz

- **Importar PGDAS-D:** lê o extrato digital em PDF no próprio navegador
  (PDF.js), extrai RBT12, RBT12p, receita do PA, Fator R, atividades e DAS.
  Nenhum arquivo é enviado a servidor.
- **Cálculo manual:** aceita ano, atividade/anexo, RBT12, RBT12p, receita do
  mês, Fator R e a opção de Simples híbrido.
- Mostra a alíquota **por atividade**, com o anexo editável quando a descrição
  do extrato não basta.
- Exibe a memória de cálculo e a partilha por tributo.
- Botão para copiar a alíquota já formatada (ex.: `10,23`).

## Períodos suportados

| Período de apuração | Tabela |
| --- | --- |
| Até 2026 | LC 123/2003, Anexos I a V |
| 2027 e 2028 | Resolução CGSN 190/2026, com CBS e IBS na partilha |
| 2029 em diante | Ainda não incluído — a ferramenta mostra um aviso |

Em 2027–2028, o modo **Simples híbrido** separa a parcela que permanece no DAS
da parcela de IBS/CBS recolhida fora. A alíquota principal continua sendo a
carga total, que é a que vai para a NFS-e.

## Limitações

- Só lê extratos **digitais** (texto selecionável), até 4 MB.
- A alíquota por atividade é a carga do anexo, antes de exclusões de ICMS ST,
  monofásico e retenção de ISS — o mesmo critério do extrato do PGDAS-D.
- Ferramenta de apoio. Não substitui o extrato oficial nem a orientação de um
  contador.

## Testes

```bash
node teste.js
```

Os testes cobrem os extratos de exemplo, a integridade das tabelas (partilha
somando 100%), o Simples híbrido e os limites de faixa.

## Arquivos

| Arquivo | Função |
| --- | --- |
| `index.html` | Estrutura da página |
| `styles.css` | Estilo e responsividade |
| `app.js` | Interface, formulário, importação e cópia |
| `parser.js` | Leitura do texto do PDF e extração dos dados |
| `tabelas.js` | Tabelas 2026/2027–2028 e motor de cálculo |
| `teste.js` | Testes de regressão |
| `pdf.min.js`, `pdf.worker.min.js` | PDF.js |
