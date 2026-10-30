/* Leitura do extrato PGDAS-D (PDF digital) e extração dos dados da apuração. */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PGDAS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var RE_NUMERO = /\d{1,3}(?:\.\d{3})*,\d{2}/g;

  function numero(txt) {
    return Number(txt.replace(/\./g, '').replace(',', '.'));
  }

  function numeros(txt) {
    var achados = txt.match(RE_NUMERO);
    return achados ? achados.map(numero) : [];
  }

  function limparLinha(txt) {
    return txt.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function valorNaLinha(linhas, teste) {
    for (var i = 0; i < linhas.length; i++) {
      if (!teste(linhas[i])) continue;
      var ns = numeros(linhas[i]);
      return ns.length ? ns[ns.length - 1] : null;
    }
    return null;
  }

  /* Valor de um rótulo que pode estar antes ou depois dos números na mesma linha.
     PDF.js às vezes joga o rótulo para a linha seguinte; por isso olha a linha
     anterior apenas para a RBT12. Nunca atravessa para o rótulo seguinte (RBA). */
  function valorRotulo(linhas, rotulo, olharAnterior) {
    for (var i = 0; i < linhas.length; i++) {
      if (linhas[i].indexOf(rotulo) < 0) continue;
      var ns = numeros(linhas[i]);
      if (ns.length) return ns[ns.length - 1];
      if (olharAnterior && i > 0) {
        ns = numeros(linhas[i - 1]);
        if (ns.length) return ns[ns.length - 1];
      }
      if (i + 1 < linhas.length && !/\(RBA\)|\(RBAA\)|Receita bruta acumulada/i.test(linhas[i + 1])) {
        ns = numeros(linhas[i + 1]);
        if (ns.length) return ns[ns.length - 1];
      }
      return null;
    }
    return null;
  }

  function anexoDaDescricao(descricao, fatorAnexo) {
    var d = descricao.toLowerCase();
    if (/anexo\s+iv\b/.test(d)) return 'IV';
    if (/anexo\s+v\b/.test(d)) return 'V';
    if (/anexo\s+iii\b/.test(d)) return 'III';
    if (/anexo\s+ii\b/.test(d)) return 'II';
    if (/anexo\s+i\b/.test(d)) return 'I';
    if (/sujeitos?\s+ao\s+fator/.test(d) && !/n[ãa]o\s+sujeitos?/.test(d)) return fatorAnexo || 'III';
    if (/revenda de mercadorias|com[ée]rcio/.test(d)) return 'I';
    if (/ind[uú]stria|industrializa/.test(d)) return 'II';
    if (/loca[cç][aã]o de bens m[óo]veis/.test(d)) return 'III';
    return null;
  }

  function descricaoDoBloco(bloco) {
    var linhas = bloco.split('\n')
      .map(limparLinha)
      .filter(function (l) {
        return l && !/^\.+$/.test(l) && !/^p[áa]gina\s+\d+$/i.test(l) && !/^\d+\)/.test(l);
      });
    return linhas.join(' ');
  }

  function parseTexto(textoOriginal) {
    var texto = String(textoOriginal || '').replace(/\r\n?/g, '\n');
    var linhas = texto.split('\n').map(limparLinha).filter(Boolean);

    if (/Extrato do Simples Nacional/i.test(texto) === false) {
      return { erro: 'O arquivo não parece ser um extrato do Simples Nacional (PGDAS-D).' };
    }

    var cnpj = (texto.match(/CNPJ Estabelecimento:\s*([\d.\/-]+)/i) || texto.match(/CNPJ B[áa]sico:\s*([\d.\/-]+)/i) || [])[1] || null;

    var nome = null;
    var linhaNome = texto.match(/Nome Empresarial:\s*([^\n]+)/i);
    if (linhaNome) {
      nome = linhaNome[1].replace(/\s*Data de Abertura.*$/i, '').trim();
    }

    var pa = texto.match(/Per[íi]odo de Apura[çc][ãa]o\s*\(PA\):\s*(\d{2})\/(\d{4})/i);
    var mes = pa ? Number(pa[1]) : null;
    var ano = pa ? Number(pa[2]) : null;

    var rpa = valorNaLinha(linhas, function (l) { return /Receita Bruta do PA\s*\(RPA\)/i.test(l); });
    var rbt12 = valorRotulo(linhas, '(RBT12)', true);
    var rbt12p = valorRotulo(linhas, '(RBT12p)', false);
    var folha = valorRotulo(linhas, 'Total de Folhas', false);

    var fatorR = null;
    var fatorAnexo = null;
    var mFator = texto.match(/Fator\s*r\s*=\s*([\d]+,[\d]+)\s*-\s*Anexo\s*(III|V)/i);
    if (mFator) {
      fatorR = numero(mFator[1]);
      fatorAnexo = mFator[2].toUpperCase();
    }

    var blocos = texto.split(/Valor do D[ée]bito por Tributo para a Atividade\s*\(R\$\)\s*:/i);
    blocos.shift();

    var atividades = [];
    blocos.forEach(function (bloco) {
      var fim = bloco.search(/Informa[çc][õo]es por Estabelecimento|Total do D[ée]bito Declarado/i);
      if (fim >= 0) bloco = bloco.slice(0, fim);
      if (!/Receita Bruta Informada/i.test(bloco)) return;

      var partes = bloco.split(/Receita Bruta Informada\s*:\s*R\$\s*/i);
      var descricao = descricaoDoBloco(partes[0]);
      var valorReceita = (partes[1] || '').match(/^([\d.]+,\d{2})/);
      var receita = valorReceita ? numero(valorReceita[1]) : null;

      var totalDAS = null;
      var linhasBloco = bloco.split('\n');
      for (var i = 0; i < linhasBloco.length; i++) {
        if (!/IRPJ\s+CSLL\s+COFINS/i.test(linhasBloco[i])) continue;
        var ns = numeros(linhasBloco[i]);
        if (ns.length >= 9) { totalDAS = ns[8]; break; }
        for (var j = i + 1; j < Math.min(i + 4, linhasBloco.length); j++) {
          ns = numeros(linhasBloco[j]);
          if (ns.length >= 9) { totalDAS = ns[8]; break; }
        }
        break;
      }

      atividades.push({
        descricao: descricao,
        receita: receita,
        totalDAS: totalDAS,
        anexo: anexoDaDescricao(descricao, fatorAnexo)
      });
    });

    if (!atividades.length) {
      return { erro: 'Não encontrei as atividades no extrato. Verifique se o PDF é o extrato completo do PGDAS-D.' };
    }

    return {
      cnpj: cnpj,
      nome: nome,
      mes: mes,
      ano: ano,
      pa: mes && ano ? (mes < 10 ? '0' + mes : mes) + '/' + ano : null,
      rpa: rpa,
      rbt12: rbt12,
      rbt12p: rbt12p,
      folha: folha,
      fatorR: fatorR,
      fatorAnexo: fatorAnexo,
      atividades: atividades
    };
  }

  function linhasDaPagina(textContent) {
    var grupos = {};
    textContent.items.forEach(function (item) {
      if (!item.str || !item.str.trim()) return;
      var y = Math.round(item.transform[5] * 2) / 2;
      var chave = String(y);
      if (!grupos[chave]) grupos[chave] = [];
      grupos[chave].push(item);
    });

    return Object.keys(grupos)
      .map(Number)
      .sort(function (a, b) { return b - a; })
      .map(function (y) {
        var itens = grupos[String(y)].sort(function (a, b) { return a.transform[4] - b.transform[4]; });
        var linha = '';
        var fim = null;
        itens.forEach(function (item) {
          if (fim !== null) {
            var espaco = item.transform[4] - fim;
            linha += espaco > 1.2 ? ' ' : '';
          }
          linha += item.str;
          fim = item.transform[4] + (item.width || 0);
        });
        return limparLinha(linha);
      })
      .filter(Boolean);
  }

  async function extrairPDF(file) {
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('Biblioteca PDF.js não carregada.');
    }
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
    }

    var buffer = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    var linhas = [];

    for (var p = 1; p <= pdf.numPages; p++) {
      var pagina = await pdf.getPage(p);
      var conteudo = await pagina.getTextContent();
      linhas = linhas.concat(linhasDaPagina(conteudo));
    }

    await pdf.destroy();
    return linhas.join('\n');
  }

  return {
    parseTexto: parseTexto,
    extrairPDF: extrairPDF,
    linhasDaPagina: linhasDaPagina,
    numero: numero
  };
});
