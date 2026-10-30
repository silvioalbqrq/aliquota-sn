/* Teste de regressão do parser e do cálculo. Rode com: node teste.js */
const fs = require('fs');
const path = require('path');
const TAB = require('./tabelas.js');
const PGDAS = require('./parser.js');

const DIR = process.env.PDFTEXT || path.join(__dirname, 'test-data');

const casos = [
  { arquivo: 'PGDASD-EXTRATO-07202628032423115.pdf.txt', pa: '09/2026', rbt12: 540220.74, anexo: 'III', taxa: 10.23, cnpj: '08.932.805/0001-85' },
  { arquivo: 'PGDASD-EXTRATO-07202628032423115.pdf.txt', pa: '09/2026', rbt12: 540220.74, anexo: 'I', taxa: 6.93 },
  { arquivo: 'PGDASD-EXTRATO-07202625118128397_(3).pdf.txt', pa: '08/2026', rbt12: 1682717.94, anexo: 'I', taxa: 9.36 },
  { arquivo: 'PGDASD-EXTRATO-07202625118128397_(3).pdf.txt', pa: '08/2026', rbt12: 1682717.94, anexo: 'III', taxa: 13.88 },
  { arquivo: 'PGDASD-EXTRATO-07202622242449383.pdf.txt', pa: '07/2026', rbt12: 1626733.97, anexo: 'I', taxa: 9.32 },
  { arquivo: 'PGDASD-EXTRATO-07202622242449383.pdf.txt', pa: '07/2026', rbt12: 1626733.97, anexo: 'III', taxa: 13.81 },
  { arquivo: 'PGDASD-EXTRATO-07202625903869374.pdf.txt', pa: '08/2026', rbt12: 1552672.83, anexo: 'I', taxa: 9.25 },
  { arquivo: 'PGDASD-EXTRATO-07202626539921539.pdf.txt', pa: '08/2026', rbt12: 20179.99, base: 34594.27, anexo: 'I', taxa: 4.00 },
  { arquivo: 'PGDASD-EXTRATO-07202500700531059.pdf.txt', pa: '12/2024', rbt12: 92386.81, anexo: 'III', taxa: 6.00, fatorR: 0.61 },
  { arquivo: 'PGDASD-EXTRATO-07202623359956763.pdf.txt', pa: '07/2026', rbt12: 355802.78, anexo: 'III', taxa: 8.57 },
  { arquivo: 'PGDASD-EXTRATO-07202625308242425.pdf.txt', pa: '08/2026', rbt12: 449860.07, anexo: 'III', taxa: 9.58 },
  { arquivo: 'PGDASD-EXTRATO-07202627463085083 DEDETIZADORA.pdf.txt', pa: '09/2026', rbt12: 228201.99, anexo: 'IV', taxa: 5.45, cnpj: '03.602.402/0001-54' }
];

let falhas = 0;

function ok(condicao, mensagem) {
  if (condicao) {
    console.log('ok   ' + mensagem);
  } else {
    falhas++;
    console.error('FALHA ' + mensagem);
  }
}

function perto(a, b, tolerancia) {
  return Math.abs(a - b) <= tolerancia;
}

const casosDisponiveis = casos.filter(function (caso) {
  return fs.existsSync(path.join(DIR, caso.arquivo));
});

console.log('\n== Parser + cálculo nos extratos de exemplo ==');
if (!casosDisponiveis.length) console.log('Sem PDFs de exemplo locais; testes de parser ignorados.');
casosDisponiveis.forEach(function (caso) {
  const texto = fs.readFileSync(path.join(DIR, caso.arquivo), 'utf8');
  const dados = PGDAS.parseTexto(texto);

  if (dados.erro) {
    ok(false, caso.arquivo + ': ' + dados.erro);
    return;
  }

  ok(dados.pa === caso.pa, caso.arquivo + ' PA = ' + caso.pa + ' (lido: ' + dados.pa + ')');
  ok(perto(dados.rbt12, caso.rbt12, 0.005), caso.arquivo + ' RBT12 = ' + caso.rbt12 + ' (lido: ' + dados.rbt12 + ')');
  if (caso.base) ok(perto(dados.rbt12p, caso.base, 0.005), caso.arquivo + ' RBT12p = ' + caso.base + ' (lido: ' + dados.rbt12p + ')');
  if (caso.fatorR) ok(perto(dados.fatorR, caso.fatorR, 0.0001), caso.arquivo + ' Fator R = ' + caso.fatorR + ' (lido: ' + dados.fatorR + ')');
  if (caso.cnpj) ok(dados.cnpj === caso.cnpj, caso.arquivo + ' CNPJ = ' + caso.cnpj + ' (lido: ' + dados.cnpj + ')');

  const atividade = dados.atividades.find(function (a) { return a.anexo === caso.anexo; });
  if (!atividade) {
    ok(false, caso.arquivo + ' atividade do ' + caso.anexo + ' não encontrada');
    return;
  }

  const resultado = TAB.calcular({
    ano: dados.ano,
    anexo: atividade.anexo,
    rbt12: dados.rbt12,
    rbt12p: dados.rbt12p
  });

  ok(!resultado.erro, caso.arquivo + ' cálculo sem erro');
  if (resultado.erro) return;

  ok(perto(resultado.efetiva, caso.taxa, 0.01),
    caso.arquivo + ' ' + caso.anexo + ' efetiva = ' + caso.taxa + '% (calculado: ' + resultado.efetiva.toFixed(4) + '%)');
});

const textoSintetico = [
  'Extrato do Simples Nacional',
  'CNPJ Estabelecimento: 12.345.678/0001-99',
  'Nome Empresarial: Empresa Teste Data de Abertura: 10/01/2026',
  'Período de Apuração (PA): 02/2026',
  'Receita Bruta do PA (RPA): R$ 5.000,00',
  '(RBT12): R$ 0,00',
  '(RBT12p): R$ 60.000,00',
  'Valor do Débito por Tributo para a Atividade (R$):',
  'Revenda de mercadorias',
  'Receita Bruta Informada: R$ 5.000,00',
  'Informações por Estabelecimento'
].join('\n');
const parseSintetico = PGDAS.parseTexto(textoSintetico);
ok(!parseSintetico.erro && parseSintetico.dataAbertura === '10/01/2026' && parseSintetico.mes === 2,
  'parser extrai data de abertura e período para identificar mês de atividade');

console.log('\n== Integridade das tabelas (partilha soma 100%) ==');
[2026, 2027].forEach(function (ano) {
  const tabelas = TAB.tabelasDoAno(ano);
  Object.keys(tabelas).forEach(function (anexo) {
    tabelas[anexo].forEach(function (faixa, i) {
      const soma = Object.keys(faixa.partilha).reduce(function (s, k) { return s + faixa.partilha[k]; }, 0);
      ok(perto(soma, 100, 0.001), ano + ' Anexo ' + anexo + ' faixa ' + (i + 1) + ' soma ' + soma + '%');
    });
  });
});

console.log('\n== Simples híbrido 2027 ==');
const hib = TAB.calcular({ ano: 2027, anexo: 'III', rbt12: 540220.74, hibrido: true });
ok(perto(hib.efetiva, 10.2347, 0.001), 'efetiva cheia 2027 = ' + hib.efetiva.toFixed(4) + '%');
ok(perto(hib.fora, hib.efetiva * (16.41 + 0.19) / 100, 0.0001), 'parcela CBS+IBS fora do DAS = ' + hib.fora.toFixed(4) + '%');
ok(perto(hib.dentro, hib.efetiva - hib.fora, 0.0001), 'parcela no DAS = ' + hib.dentro.toFixed(4) + '%');

console.log('\n== Início de atividade ==');
const primeira2027 = TAB.calcular({ ano: 2027, anexo: 'III', primeiraFaixaForcada: true });
ok(!primeira2027.erro && primeira2027.faixa === 1 && perto(primeira2027.efetiva, 6, 0.0001),
  '2027: primeira faixa forçada sem RBT12 nos meses 1 e 2');
const rbt12p2026 = TAB.calcular({ ano: 2026, anexo: 'I', rbt12: 0, rbt12p: 108000, usouRBT12p: true });
ok(!rbt12p2026.erro && rbt12p2026.faixa === 1 && rbt12p2026.usouRBT12p,
  '2026: usa base anualizada/proporcionalizada RBT12p');
const rbt12p2027 = TAB.calcular({ ano: 2027, anexo: 'III', rbt12: 0, rbt12p: 120000, usouRBT12p: true });
ok(!rbt12p2027.erro && rbt12p2027.faixa === 1,
  '2027: usa a base do PGDAS-D entre os meses 3 e 13');
ok(perto(TAB.rbt12pDaMedia([10000]), 120000, 0.001), 'um mês de receita é anualizado por 12');
ok(perto(TAB.rbt12pDaMedia([10000, 20000]), 180000, 0.001), 'média de vários meses é anualizada por 12');
ok(TAB.rbt12pDaMedia([]) === null, 'lista vazia não gera base proporcionalizada');

console.log('\n== Limite de ISS no Anexo III ==');
const issLimitado = TAB.calcular({ ano: 2027, anexo: 'III', rbt12: 3600000, hibrido: true });
const issLimitado2026 = TAB.calcular({ ano: 2026, anexo: 'III', rbt12: 3600000 });
const somaTributos = Object.keys(issLimitado.aliquotasTributos).reduce(function (soma, tributo) {
  return soma + issLimitado.aliquotasTributos[tributo];
}, 0);
ok(perto(issLimitado.aliquotasTributos.ISS, 5, 0.0001), 'ISS efetivo limitado a 5%');
ok(perto(issLimitado2026.aliquotasTributos.ISS, 5, 0.0001), 'ISS efetivo limitado a 5% também na tabela até 2026');
ok(perto(somaTributos, issLimitado.efetiva, 0.0001), 'redistribuição mantém a soma igual à alíquota efetiva total');
ok(perto(Object.keys(issLimitado.partilha).reduce(function (soma, tributo) { return soma + issLimitado.partilha[tributo]; }, 0), 100, 0.001),
  'partilha após redistribuição soma 100%');
ok(perto(issLimitado.fora, (issLimitado.aliquotasTributos.CBS || 0) + (issLimitado.aliquotasTributos.IBS || 0), 0.0001),
  'híbrido deduz CBS e IBS após aplicar o teto de ISS');

console.log('\n== Limites de faixa ==');
ok(TAB.calcular({ ano: 2026, anexo: 'I', rbt12: 180000 }).faixa === 1, 'R$ 180.000,00 = faixa 1');
ok(TAB.calcular({ ano: 2026, anexo: 'I', rbt12: 180000.01 }).faixa === 2, 'R$ 180.000,01 = faixa 2');
ok(TAB.calcular({ ano: 2026, anexo: 'I', rbt12: 4800000 }).faixa === 6, 'R$ 4.800.000,00 = faixa 6');
ok(!!TAB.calcular({ ano: 2026, anexo: 'I', rbt12: 4800000.01 }).erro, 'acima de R$ 4.800.000,00 = fora do Simples');

console.log('\n' + (falhas ? falhas + ' falha(s).' : 'Todos os testes passaram.'));
process.exit(falhas ? 1 : 0);
