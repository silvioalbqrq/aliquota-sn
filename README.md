# Alíquota Simples

Calculadora estática de alíquotas do Simples Nacional para a emissão de NFS-e.
Mostra, por atividade, três números lado a lado:

- **alíquota nominal** (coluna principal, com botão de cópia) — a da faixa, que é
  o valor do campo **“Alíquota no Simples Nacional”**. O Guia do Emissor Público
  Nacional Web da NFS-e (v. 1.2.1, p. 82 e 84) manda informar “a alíquota nominal
  a qual está sujeita”, com base no art. 9º do Decreto 8.264/2014;
- **alíquota efetiva** — `(RBT12 × alíquota nominal − parcela a deduzir) ÷ RBT12`
  (art. 18, §1º-A da LC 123/2006), a carga real do período, para conferir o DAS;
- **DAS pago** — o que o extrato efetivamente cobrou, já sem ICMS ST, monofásico e
  ISS retido.

O art. 9º do Decreto 8.264/2014 também manda somar ao percentual uma estimativa de
IPI, substituição tributária e incidência monofásica eventualmente embutida no
preço. A ferramenta sinaliza quando a atividade tem essas incidências, mas não
estima o adicional.

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
  do extrato não basta, e sinaliza o que não gera NFS-e (mercadoria) e o que tem
  ISS retido.
- A alíquota nominal aparece em cartão verde marcado “Portal Contribuinte”, com
  botão de cópia — é o valor que vai no campo “Alíquota no Simples Nacional”. Em
  atividades de comércio (que não geram NFS-e), o cartão fica neutro e sem botão.
- Confere o DAS calculado contra o DAS do extrato (marca “✓ confere”) e avisa
  quando o extrato importado está de um PA anterior ao último disponível.
- Exibe a memória de cálculo e a partilha por tributo. Na 5ª faixa do Anexo III,
  limita o ISS efetivo a 5% e redistribui a diferença entre os demais tributos.
- Botões para copiar a alíquota nominal (valor do campo, ex.: `13,50`) e a
  efetiva (ex.: `10,23467`), já formatadas.

## Períodos suportados

| Período de apuração | Tabela |
| --- | --- |
| Até 2026 | LC 123/2006, Anexos I a V |
| 2027 e 2028 | Resolução CGSN 190/2026, com CBS e IBS na partilha |
| 2029 em diante | Ainda não incluído — a ferramenta mostra um aviso |

Em 2027–2028, o modo **Simples híbrido** separa a parcela que permanece no DAS
da parcela de IBS/CBS recolhida fora. O valor do campo segue a alíquota nominal
da faixa; a tela mostra também a carga total e a parcela que fica no DAS.

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
- A alíquota nominal é a da faixa, antes de qualquer adicional de IPI, ST ou
  monofásico embutido no preço — o art. 9º do Decreto 8.264/2014 manda somar esse
  adicional, e a ferramenta não o estima.
- A alíquota efetiva é a carga do anexo, antes de exclusões de ICMS ST,
  monofásico e retenção de ISS. A coluna “DAS pago” mostra o valor depois dessas
  exclusões, calculado a partir do extrato.
- As alíquotas mudam a cada apuração, porque a RBT12 muda. Reimporte o extrato
  do PA mais recente antes de emitir.
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
