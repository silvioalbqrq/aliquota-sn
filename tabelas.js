/* Tabelas do Simples Nacional (LC 123/2006 e LC 214/2025).
   Vigência até 2026 e 2027-2028. Percentuais de partilha incidem sobre a alíquota efetiva. */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TABELAS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var FAIXAS = [180000, 360000, 720000, 1800000, 3600000, 4800000];

  function f(ate, nominal, deduzir, partilha) {
    return { ate: ate, nominal: nominal, deduzir: deduzir, partilha: partilha };
  }

  var P26 = {
    I: [
      f(180000, 4.0, 0, { IRPJ: 5.5, CSLL: 3.5, COFINS: 12.74, PIS: 2.76, CPP: 41.5, ICMS: 34.0 }),
      f(360000, 7.3, 5940, { IRPJ: 5.5, CSLL: 3.5, COFINS: 12.74, PIS: 2.76, CPP: 41.5, ICMS: 34.0 }),
      f(720000, 9.5, 13860, { IRPJ: 5.5, CSLL: 3.5, COFINS: 12.74, PIS: 2.76, CPP: 42.0, ICMS: 33.5 }),
      f(1800000, 10.7, 22500, { IRPJ: 5.5, CSLL: 3.5, COFINS: 12.74, PIS: 2.76, CPP: 42.0, ICMS: 33.5 }),
      f(3600000, 14.3, 87300, { IRPJ: 5.5, CSLL: 3.5, COFINS: 12.74, PIS: 2.76, CPP: 42.0, ICMS: 33.5 }),
      f(4800000, 18.9, 378000, { IRPJ: 13.5, CSLL: 10.0, COFINS: 28.27, PIS: 6.13, CPP: 42.1 })
    ],
    II: [
      f(180000, 4.5, 0, { IRPJ: 5.5, CSLL: 3.5, COFINS: 11.51, PIS: 2.49, CPP: 37.5, IPI: 7.5, ICMS: 32.0 }),
      f(360000, 7.8, 5940, { IRPJ: 5.5, CSLL: 3.5, COFINS: 11.51, PIS: 2.49, CPP: 37.5, IPI: 7.5, ICMS: 32.0 }),
      f(720000, 10.0, 13860, { IRPJ: 5.5, CSLL: 3.5, COFINS: 11.51, PIS: 2.49, CPP: 37.5, IPI: 7.5, ICMS: 32.0 }),
      f(1800000, 11.2, 22500, { IRPJ: 5.5, CSLL: 3.5, COFINS: 11.51, PIS: 2.49, CPP: 37.5, IPI: 7.5, ICMS: 32.0 }),
      f(3600000, 14.7, 85500, { IRPJ: 5.5, CSLL: 3.5, COFINS: 11.51, PIS: 2.49, CPP: 37.5, IPI: 7.5, ICMS: 32.0 }),
      f(4800000, 30.0, 720000, { IRPJ: 8.5, CSLL: 7.5, COFINS: 20.96, PIS: 4.54, CPP: 23.5, IPI: 35.0 })
    ],
    III: [
      f(180000, 6.0, 0, { IRPJ: 4.0, CSLL: 3.5, COFINS: 12.82, PIS: 2.78, CPP: 43.4, ISS: 33.5 }),
      f(360000, 11.2, 9360, { IRPJ: 4.0, CSLL: 3.5, COFINS: 14.05, PIS: 3.05, CPP: 43.4, ISS: 32.0 }),
      f(720000, 13.5, 17640, { IRPJ: 4.0, CSLL: 3.5, COFINS: 13.64, PIS: 2.96, CPP: 43.4, ISS: 32.5 }),
      f(1800000, 16.0, 35640, { IRPJ: 4.0, CSLL: 3.5, COFINS: 13.64, PIS: 2.96, CPP: 43.4, ISS: 32.5 }),
      f(3600000, 21.0, 125640, { IRPJ: 4.0, CSLL: 3.5, COFINS: 12.82, PIS: 2.78, CPP: 43.4, ISS: 33.5 }),
      f(4800000, 33.0, 648000, { IRPJ: 35.0, CSLL: 15.0, COFINS: 16.03, PIS: 3.47, CPP: 30.5 })
    ],
    IV: [
      f(180000, 4.5, 0, { IRPJ: 18.8, CSLL: 15.2, COFINS: 17.67, PIS: 3.83, ISS: 44.5 }),
      f(360000, 9.0, 8100, { IRPJ: 19.8, CSLL: 15.2, COFINS: 20.55, PIS: 4.45, ISS: 40.0 }),
      f(720000, 10.2, 12420, { IRPJ: 20.8, CSLL: 15.2, COFINS: 19.73, PIS: 4.27, ISS: 40.0 }),
      f(1800000, 14.0, 39780, { IRPJ: 17.8, CSLL: 19.2, COFINS: 18.90, PIS: 4.10, ISS: 40.0 }),
      f(3600000, 22.0, 183780, { IRPJ: 18.8, CSLL: 19.2, COFINS: 18.08, PIS: 3.92, ISS: 40.0 }),
      f(4800000, 33.0, 828000, { IRPJ: 53.5, CSLL: 21.5, COFINS: 20.55, PIS: 4.45 })
    ],
    V: [
      f(180000, 15.5, 0, { IRPJ: 25.0, CSLL: 15.0, COFINS: 14.10, PIS: 3.05, CPP: 28.85, ISS: 14.0 }),
      f(360000, 18.0, 4500, { IRPJ: 23.0, CSLL: 15.0, COFINS: 14.10, PIS: 3.05, CPP: 27.85, ISS: 17.0 }),
      f(720000, 19.5, 9900, { IRPJ: 24.0, CSLL: 15.0, COFINS: 14.92, PIS: 3.23, CPP: 23.85, ISS: 19.0 }),
      f(1800000, 20.5, 17100, { IRPJ: 21.0, CSLL: 15.0, COFINS: 15.74, PIS: 3.41, CPP: 23.85, ISS: 21.0 }),
      f(3600000, 23.0, 62100, { IRPJ: 23.0, CSLL: 12.5, COFINS: 14.10, PIS: 3.05, CPP: 23.85, ISS: 23.5 }),
      f(4800000, 30.5, 540000, { IRPJ: 35.0, CSLL: 15.5, COFINS: 16.44, PIS: 3.56, CPP: 29.5 })
    ]
  };

  var P27 = {
    I: [
      f(180000, 4.0, 0, { IRPJ: 5.5, CSLL: 3.5, CBS: 15.33, CPP: 41.5, ICMS: 34.0, IBS: 0.17 }),
      f(360000, 7.3, 5940, { IRPJ: 5.5, CSLL: 3.5, CBS: 15.33, CPP: 41.5, ICMS: 34.0, IBS: 0.17 }),
      f(720000, 9.5, 13860, { IRPJ: 5.5, CSLL: 3.5, CBS: 15.33, CPP: 42.0, ICMS: 33.5, IBS: 0.17 }),
      f(1800000, 10.7, 22500, { IRPJ: 5.5, CSLL: 3.5, CBS: 15.33, CPP: 42.0, ICMS: 33.5, IBS: 0.17 }),
      f(3600000, 14.3, 87300, { IRPJ: 5.5, CSLL: 3.5, CBS: 15.33, CPP: 42.0, ICMS: 33.5, IBS: 0.17 }),
      f(4800000, 18.9, 378000, { IRPJ: 13.58, CSLL: 10.06, CBS: 34.02, CPP: 42.34 })
    ],
    II: [
      f(180000, 4.5, 0, { IRPJ: 5.5, CSLL: 3.5, CBS: 13.85, CPP: 37.5, IPI: 7.5, ICMS: 32.0, IBS: 0.15 }),
      f(360000, 7.8, 5940, { IRPJ: 5.5, CSLL: 3.5, CBS: 13.85, CPP: 37.5, IPI: 7.5, ICMS: 32.0, IBS: 0.15 }),
      f(720000, 10.0, 13860, { IRPJ: 5.5, CSLL: 3.5, CBS: 13.85, CPP: 37.5, IPI: 7.5, ICMS: 32.0, IBS: 0.15 }),
      f(1800000, 11.2, 22500, { IRPJ: 5.5, CSLL: 3.5, CBS: 13.85, CPP: 37.5, IPI: 7.5, ICMS: 32.0, IBS: 0.15 }),
      f(3600000, 14.7, 85500, { IRPJ: 5.5, CSLL: 3.5, CBS: 13.85, CPP: 37.5, IPI: 7.5, ICMS: 32.0, IBS: 0.15 }),
      f(4800000, 29.9, 720000, { IRPJ: 8.53, CSLL: 7.53, CBS: 25.22, CPP: 23.59, IPI: 35.13 })
    ],
    III: [
      f(180000, 6.0, 0, { IRPJ: 4.0, CSLL: 3.5, CBS: 15.43, CPP: 43.4, ISS: 33.5, IBS: 0.17 }),
      f(360000, 11.2, 9360, { IRPJ: 4.0, CSLL: 3.5, CBS: 16.91, CPP: 43.4, ISS: 32.0, IBS: 0.19 }),
      f(720000, 13.5, 17640, { IRPJ: 4.0, CSLL: 3.5, CBS: 16.41, CPP: 43.4, ISS: 32.5, IBS: 0.19 }),
      f(1800000, 16.0, 35640, { IRPJ: 4.0, CSLL: 3.5, CBS: 16.41, CPP: 43.4, ISS: 32.5, IBS: 0.19 }),
      f(3600000, 21.0, 125640, { IRPJ: 4.0, CSLL: 3.5, CBS: 15.43, CPP: 43.4, ISS: 33.5, IBS: 0.17 }),
      f(4800000, 32.9, 648000, { IRPJ: 35.09, CSLL: 15.04, CBS: 19.29, CPP: 30.58 })
    ],
    IV: [
      f(180000, 4.5, 0, { IRPJ: 18.80, CSLL: 15.20, CBS: 21.26, ISS: 44.50, IBS: 0.24 }),
      f(360000, 9.0, 8100, { IRPJ: 19.80, CSLL: 15.20, CBS: 24.73, ISS: 40.00, IBS: 0.27 }),
      f(720000, 10.2, 12420, { IRPJ: 20.80, CSLL: 15.20, CBS: 23.74, ISS: 40.00, IBS: 0.26 }),
      f(1800000, 14.0, 39780, { IRPJ: 17.80, CSLL: 19.20, CBS: 22.75, ISS: 40.00, IBS: 0.25 }),
      f(3600000, 22.0, 183780, { IRPJ: 18.80, CSLL: 19.20, CBS: 21.76, ISS: 40.00, IBS: 0.24 }),
      f(4800000, 32.9, 828000, { IRPJ: 53.71, CSLL: 21.59, CBS: 24.70 })
    ],
    V: [
      f(180000, 15.5, 0, { IRPJ: 25.0, CSLL: 15.0, CBS: 16.96, CPP: 28.85, ISS: 14.0, IBS: 0.19 }),
      f(360000, 18.0, 4500, { IRPJ: 23.0, CSLL: 15.0, CBS: 16.96, CPP: 27.85, ISS: 17.0, IBS: 0.19 }),
      f(720000, 19.5, 9900, { IRPJ: 24.0, CSLL: 15.0, CBS: 17.95, CPP: 23.85, ISS: 19.0, IBS: 0.20 }),
      f(1800000, 20.5, 17100, { IRPJ: 21.0, CSLL: 15.0, CBS: 18.94, CPP: 23.85, ISS: 21.0, IBS: 0.21 }),
      f(3600000, 23.0, 62100, { IRPJ: 23.0, CSLL: 12.5, CBS: 16.96, CPP: 23.85, ISS: 23.5, IBS: 0.19 }),
      f(4800000, 30.4, 540000, { IRPJ: 35.10, CSLL: 15.54, CBS: 19.78, CPP: 29.58 })
    ]
  };

  var ANEXOS = {
    I: { nome: 'Anexo I', tabelas: P26 },
    II: { nome: 'Anexo II', tabelas: P26 },
    III: { nome: 'Anexo III', tabelas: P26 },
    IV: { nome: 'Anexo IV', tabelas: P26 },
    V: { nome: 'Anexo V', tabelas: P26 }
  };

  function tabelasDoAno(ano) {
    return Number(ano) >= 2027 ? P27 : P26;
  }

  function vigencia(ano) {
    return Number(ano) >= 2027 ? '2027–2028' : 'até 2026';
  }

  function mesesDeAtividade(dataAbertura, anoPA, mesPA) {
    if (!dataAbertura || !anoPA || !mesPA) return null;
    var partes = dataAbertura.split('/');
    if (partes.length !== 3) return null;
    var anoAbertura = Number(partes[2]);
    var mesAbertura = Number(partes[1]);
    var meses = (Number(anoPA) - anoAbertura) * 12 + Number(mesPA) - mesAbertura + 1;
    return meses > 0 ? meses : null;
  }

  /* Base usada no cálculo conforme o mês de início de atividade.
     Meses 3 a 13 de 2027–2028 usam a RBT12p informada pelo PGDAS-D. */
  function baseDoExtrato(d) {
    var mesAtividade = mesesDeAtividade(d.dataAbertura, d.ano, d.mes);
    if (!mesAtividade) return { rbt12: d.rbt12, rbt12p: d.rbt12p };

    if (d.ano <= 2026 && mesAtividade <= 12) {
      var baseInicial2026 = Number(d.rbt12p) || (mesAtividade === 1 ? Number(d.rpa) * 12 : 0);
      if (!(baseInicial2026 > 0)) {
        return { erro: 'Para este mês de início de atividade, informe a RBT12p do extrato. No primeiro mês, ela pode ser calculada pela receita do PA multiplicada por 12.' };
      }
      return { rbt12: d.rbt12, rbt12p: baseInicial2026, usouRBT12p: true, mesAtividade: mesAtividade };
    }

    if (d.ano >= 2027 && mesAtividade <= 2) {
      return { primeiraFaixaForcada: true, rbt12: 0, mesAtividade: mesAtividade };
    }

    if (d.ano >= 2027 && mesAtividade <= 13) {
      var baseInicial2027 = Number(d.rbt12p) || Number(d.rbt12) || 0;
      if (!(baseInicial2027 > 0)) {
        return { erro: 'Não encontrei a base proporcionalizada do PGDAS-D para este mês de início de atividade.' };
      }
      return { rbt12: 0, rbt12p: baseInicial2027, usouRBT12p: true, mesAtividade: mesAtividade };
    }

    return { rbt12: d.rbt12, rbt12p: 0, mesAtividade: mesAtividade };
  }

  function rbt12pDaMedia(receitas) {
    if (!Array.isArray(receitas) || receitas.length === 0) return null;
    var soma = 0;
    for (var i = 0; i < receitas.length; i++) {
      var receita = Number(receitas[i]);
      if (!Number.isFinite(receita) || receita < 0) return null;
      soma += receita;
    }
    return soma / receitas.length * 12;
  }

  function calcular(opcoes) {
    var ano = Number(opcoes.ano) || 2026;
    var anexo = opcoes.anexo;
    var tabelas = tabelasDoAno(ano);
    var faixas = tabelas[anexo];

    if (!faixas) return { erro: 'Selecione um anexo válido.' };

    if (ano > 2028) return { erro: 'As tabelas a partir de 2029 ainda não estão incluídas nesta versão.' };

    var rbt12 = Number(opcoes.rbt12) || 0;
    var rbt12p = Number(opcoes.rbt12p) || 0;
    var primeiraFaixaForcada = !!opcoes.primeiraFaixaForcada;
    var base = rbt12p > 0 ? rbt12p : rbt12;

    if (!primeiraFaixaForcada && !(base > 0)) {
      return { erro: 'Informe a RBT12 ou a base proporcionalizada (RBT12p) usada no período.' };
    }
    if ((rbt12 > 4800000 || base > 4800000) && !primeiraFaixaForcada) {
      return { erro: 'Receita acima de R$ 4.800.000,00: a empresa está fora do Simples Nacional.' };
    }

    var indice = primeiraFaixaForcada ? 0 : -1;
    if (!primeiraFaixaForcada) {
      for (var i = 0; i < faixas.length; i++) {
        if (base <= faixas[i].ate) { indice = i; break; }
      }
    }
    if (indice < 0) return { erro: 'Receita fora das faixas do Simples Nacional.' };

    var faixa = faixas[indice];
    var efetiva = primeiraFaixaForcada
      ? faixa.nominal
      : ((base * faixa.nominal / 100) - faixa.deduzir) / base * 100;
    if (efetiva < 0) efetiva = 0;

    // O ISS efetivo não pode exceder 5%. A diferença é redistribuída
    // proporcionalmente entre os demais tributos da partilha da mesma faixa.
    var aliquotasTributos = {};
    Object.keys(faixa.partilha).forEach(function (tributo) {
      aliquotasTributos[tributo] = efetiva * faixa.partilha[tributo] / 100;
    });
    var aliquotaISS = aliquotasTributos.ISS || 0;
    if (aliquotaISS > 5 && faixa.partilha.ISS != null) {
      var excesso = efetiva - 5;
      var somaDemaisPartilhas = Object.keys(faixa.partilha).reduce(function (soma, tributo) {
        return soma + (tributo === 'ISS' ? 0 : faixa.partilha[tributo]);
      }, 0);
      Object.keys(faixa.partilha).forEach(function (tributo) {
        aliquotasTributos[tributo] = tributo === 'ISS'
          ? 5
          : excesso * faixa.partilha[tributo] / somaDemaisPartilhas;
      });
    }

    var partilha = {};
    Object.keys(aliquotasTributos).forEach(function (tributo) {
      partilha[tributo] = efetiva > 0 ? aliquotasTributos[tributo] / efetiva * 100 : 0;
    });

    var hibrido = !!opcoes.hibrido && ano >= 2027;
    var fora = hibrido ? (aliquotasTributos.CBS || 0) + (aliquotasTributos.IBS || 0) : 0;

    return {
      ano: ano,
      vigencia: vigencia(ano),
      anexo: anexo,
      anexoNome: ANEXOS[anexo].nome,
      base: primeiraFaixaForcada ? null : base,
      usouRBT12p: !!opcoes.usouRBT12p || rbt12p > 0,
      primeiraFaixaForcada: primeiraFaixaForcada,
      faixa: indice + 1,
      nominal: faixa.nominal,
      deduzir: faixa.deduzir,
      efetiva: efetiva,
      partilha: partilha,
      aliquotasTributos: aliquotasTributos,
      hibrido: hibrido,
      fora: fora,
      dentro: efetiva - fora
    };
  }

  return {
    FAIXAS: FAIXAS,
    ANEXOS: ANEXOS,
    calcular: calcular,
    baseDoExtrato: baseDoExtrato,
    rbt12pDaMedia: rbt12pDaMedia,
    tabelasDoAno: tabelasDoAno
  };
});
