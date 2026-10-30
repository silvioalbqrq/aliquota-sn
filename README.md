# Alíquota Simples

Calculadora estática da alíquota efetiva do Simples Nacional para o campo
**“Valor aproximado dos tributos”** (Passo 19) da NFS-e.

O cálculo segue a fórmula oficial:

```
alíquota efetiva = (RBT12 × alíquota nominal − parcela a deduzir) ÷ RBT12
```

Nos meses iniciais de atividade, a regra de escolha da base/faixa varia conforme o ano-calendário.

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
- **Cálculo manual:** aceita ano, atividade/anexo, RBT12, RBT12p ou receitas
  mensais anteriores, receita do PA, Fator R, mês de atividade e Simples híbrido.
- Mostra a alíquota **por atividade**, com o anexo editável quando a descrição
  do extrato não basta.
- Exibe a memória de cálculo e a partilha por tributo. Na 5ª faixa do Anexo III,
  limita o ISS efetivo a 5% e redistribui a diferença entre os demais tributos.
- Botão para copiar a alíquota já formatada (ex.: `10,23`).

## Períodos suportados

| Período de apuração | Tabela |
| --- | --- |
| Até 2026 | LC 123/2006, Anexos I a V |
| 2027 e 2028 | Resolução CGSN 190/2026, com CBS e IBS na partilha |
| 2029 em diante | Ainda não incluído — a ferramenta mostra um aviso |

Em 2027–2028, o modo **Simples híbrido** separa a parcela que permanece no DAS
da parcela de IBS/CBS recolhida fora. A alíquota principal continua sendo a
carga total, que é a que vai para a NFS-e.

O início de atividade segue períodos diferentes: até 2026, a base proporcionalizada
é usada até o 12º mês e a RBT12 normal a partir do 13º; em 2027–2028, aplica-se
a primeira faixa nos dois primeiros meses, a base proporcionalizada do 3º ao 13º
mês e a RBT12 normal a partir do 14º. No cálculo manual, informe a base conforme
o PGDAS-D ou informe as receitas mensais anteriores para a ferramenta calcular
a média e anualizá-la. Para o primeiro mês de 2026, a receita do PA é anualizada.

## Limitações

- Só lê extratos **digitais** (texto selecionável), até 4 MB.
- O histórico mensal é digitado pelo usuário; a ferramenta não importa livros ou
  arquivos contábeis para reconstruir as receitas.
- A alíquota por atividade é a carga do anexo, antes de exclusões de ICMS ST,
  monofásico e retenção de ISS — o mesmo critério do extrato do PGDAS-D.
- Ferramenta de apoio. Não substitui o extrato oficial nem a orientação de um
  contador.

## Testes

```bash
node teste.js
```

Os testes cobrem os extratos de exemplo disponíveis, a integridade das tabelas (partilha
somando 100%), início de atividade, teto de ISS no Anexo III, Simples híbrido e limites de faixa.

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
