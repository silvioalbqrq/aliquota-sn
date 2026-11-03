(function () {
  'use strict';

  var estado = {
    modo: 'pdf',
    dados: null,
    anexos: {},
    hibridoPDF: false,
    ultimoManual: null
  };

  var ICONE_DOC = '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>';
  var ICONE_ALERTA = '<svg viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>';
  var ICONE_ALERTA_CIRC = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v4m0 4h.01"/></svg>';

  var ANEXOS_CURTOS = {
    I: 'I — Comércio',
    II: 'II — Indústria',
    III: 'III — Serviços',
    IV: 'IV — Serviços',
    V: 'V — Serviços'
  };

  var NOMES_TRIBUTOS = {
    IRPJ: 'IRPJ',
    CSLL: 'CSLL',
    COFINS: 'COFINS',
    PIS: 'PIS/Pasep',
    CBS: 'CBS',
    CPP: 'INSS/CPP',
    IPI: 'IPI',
    ICMS: 'ICMS',
    ISS: 'ISS',
    IBS: 'IBS'
  };

  var ORDEM_TRIBUTOS = ['IRPJ', 'CSLL', 'COFINS', 'PIS', 'CBS', 'CPP', 'IPI', 'ICMS', 'ISS', 'IBS'];

  function $(id) { return document.getElementById(id); }

  function num(valor, casas) {
    var c = casas == null ? 2 : casas;
    return Number(valor).toLocaleString('pt-BR', {
      minimumFractionDigits: c,
      maximumFractionDigits: c
    });
  }

  function moeda(valor) {
    return 'R$ ' + num(valor);
  }

  function pct(valor, casas) {
    return num(valor, casas) + '%';
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
      var baseInicial2027 = Number(d.rbt12) || Number(d.rbt12p) || 0;
      if (!(baseInicial2027 > 0)) {
        return { erro: 'Não encontrei a base proporcionalizada do PGDAS-D para este mês de início de atividade.' };
      }
      return { rbt12: 0, rbt12p: baseInicial2027, usouRBT12p: true, mesAtividade: mesAtividade };
    }

    return { rbt12: d.rbt12, rbt12p: 0, mesAtividade: mesAtividade };
  }

  function esc(texto) {
    return String(texto == null ? '' : texto).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function valorInput(texto) {
    var s = String(texto || '').trim().replace(/[R$%\s]/g, '');
    if (!s) return 0;
    if (s.indexOf(',') >= 0) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
      s = s.replace(/\./g, '');
    }
    return Number(s) || 0;
  }

  function listaReceitas(texto) {
    if (!String(texto || '').trim()) return { valores: [] };
    var partes = String(texto).trim().split(/[;\n]+/);
    var valores = [];
    for (var i = 0; i < partes.length; i++) {
      var parte = partes[i].trim().replace(/[R$\s]/g, '');
      if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(parte)) {
        return { erro: 'Revise a lista de receitas. Use valores em reais separados por ponto e vírgula, por exemplo: 10.000,00; 12.500,00; 0,00.' };
      }
      valores.push(valorInput(parte));
    }
    return { valores: valores };
  }

  function chip(rotulo, principal, complemento) {
    return '<div class="chip"><span>' + esc(rotulo) + '</span><strong>' + principal + '</strong>' +
      (complemento ? '<small>' + complemento + '</small>' : '') + '</div>';
  }

  function meta(rotulo, principal, complemento) {
    return '<div class="meta"><span>' + esc(rotulo) + '</span><strong>' + principal + '</strong>' +
      (complemento ? '<small class="hint">' + complemento + '</small>' : '') + '</div>';
  }

  function rotuloAtividade(descricao) {
    var d = String(descricao || '').toLowerCase();
    var base;
    if (/revenda de mercadorias/.test(d)) base = 'Revenda de mercadorias';
    else if (/loca[cç][aã]o de bens m[óo]veis/.test(d)) base = 'Locação de bens móveis';
    else if (/presta[cç][aã]o de servi[cç]os/.test(d)) base = 'Prestação de serviços';
    else if (/ind[uú]stria|industrializa/.test(d)) base = 'Industrialização';
    else base = String(descricao || '').slice(0, 90);

    if (/monof[aá]sica/.test(d)) base += ' · monofásico';
    // Substituição tributária de ICMS (não de ISS)
    if (/substitui[cç][aã]o tribut[aá]ria(?! de iss)/.test(d)) base += ' · ICMS ST';
    // Retenção de ISS: só quando diz "com retenção/... de ISS"
    if (/com reten[cç][aã]o[\s\/]*substitui[cç][aã]o tribut[aá]ria de iss/.test(d)) base += ' · ISS retido';
    return base;
  }

  function ehMercadoria(descricao) {
    return /revenda de mercadorias|com[ée]rcio|industrializa|ind[uú]stria/i.test(descricao || '');
  }

  function temST(descricao) {
    var d = String(descricao || '');
    return /substitui[cç][aã]o tribut[aá]ria/i.test(d) && !/reten[cç][aã]o[\s\/]*substitui[cç][aã]o tribut[aá]ria de iss/i.test(d);
  }

  function temMonofasico(descricao) {
    return /monof[aá]sica/i.test(descricao || '');
  }

  function issRetido(descricao) {
    return /com reten[cç][aã]o[\s\/]*substitui[cç][aã]o tribut[aá]ria de iss/i.test(descricao || '');
  }

  /* Tributos que o PGDAS tira da base do DAS (ST, monofásico e ISS retido).
     O restante da alíquota do anexo é o que aparece como DAS. */
  function foraDoDAS(descricao, resultado) {
    var chaves = [];
    if (temST(descricao)) chaves.push('ICMS');
    if (temMonofasico(descricao)) chaves.push('PIS', 'COFINS');
    if (issRetido(descricao)) chaves.push('ISS');
    var total = 0;
    if (resultado && !resultado.erro) {
      chaves.forEach(function (chave) { total += resultado.aliquotasTributos[chave] || 0; });
    }
    return { chaves: chaves, total: total };
  }

  function notaForaDoDAS(descricao, fora, dasPct) {
    var itens = [];
    if (temST(descricao)) itens.push('ICMS (substituição tributária)');
    if (temMonofasico(descricao)) itens.push('PIS/COFINS (monofásico)');
    if (issRetido(descricao)) itens.push('ISS (retido pelo tomador)');
    if (!itens.length) return '';
    var texto = 'Fora do DAS: ' + itens.join(', ') + ' — ' + pct(fora.total, 5) + ' da receita.';
    if (dasPct != null) texto += ' Por isso o DAS efetivo é ' + pct(dasPct, 5) + '.';
    return texto;
  }

  /* Último PA cujo DAS já venceu (dia 20 do mês seguinte). */
  function paMaisRecente(hoje) {
    var dia = hoje.getDate();
    var mes = hoje.getMonth() + 1;
    var ano = hoje.getFullYear();
    mes -= dia >= 20 ? 1 : 2;
    while (mes < 1) { mes += 12; ano -= 1; }
    return { mes: mes, ano: ano };
  }

  function fmtPA(p) {
    return (p.mes < 10 ? '0' + p.mes : p.mes) + '/' + p.ano;
  }

  function mesesDeDiferenca(de, para) {
    return (para.ano - de.ano) * 12 + (para.mes - de.mes);
  }

  /* ---------- estados do painel ---------- */

  function renderVazio(titulo, texto) {
    $('resultado').innerHTML =
      '<div class="vazio">' +
        '<span class="vazio-icon" aria-hidden="true">' + ICONE_DOC + '</span>' +
        '<h2>' + esc(titulo) + '</h2>' +
        '<p>' + esc(texto) + '</p>' +
      '</div>';
  }

  function renderErro(mensagem) {
    $('resultado').innerHTML =
      '<div class="vazio">' +
        '<span class="vazio-icon erro" aria-hidden="true">' + ICONE_ALERTA_CIRC + '</span>' +
        '<h2>Não foi possível calcular</h2>' +
        '<p>' + esc(mensagem) + '</p>' +
      '</div>';
  }

  function renderCarregando(nome) {
    $('resultado').innerHTML =
      '<div class="loading">' +
        '<span class="spinner" aria-hidden="true"></span>' +
        '<strong>Lendo o extrato…</strong>' +
        '<span>' + esc(nome) + '</span>' +
      '</div>';
  }

  /* ---------- resultado do PDF ---------- */

  function renderPDF() {
    var d = estado.dados;
    if (!d) { renderVazio('Importe o extrato do PGDAS-D para começar.', 'O PDF é lido no seu navegador e não sai do computador.'); return; }

    if (d.ano > 2028) {
      renderErro('Este extrato é de ' + d.ano + '. As tabelas de transição a partir de 2029 ainda não estão incluídas nesta versão.');
      return;
    }
    var dadosBase = baseDoExtrato(d);
    if (dadosBase.erro) { renderErro(dadosBase.erro); return; }
    if (!dadosBase.primeiraFaixaForcada && (!dadosBase.rbt12 && !dadosBase.rbt12p)) {
      renderErro('Não encontrei RBT12 ou RBT12p no extrato. Verifique o PDF ou informe os dados manualmente.');
      return;
    }
    var baseSelecionada = Number(dadosBase.rbt12p) || Number(dadosBase.rbt12) || 0;
    if (baseSelecionada > 4800000) {
      renderErro('A base usada no cálculo (' + moeda(baseSelecionada) + ') supera R$ 4.800.000,00.');
      return;
    }

    var baseNota = dadosBase.primeiraFaixaForcada
      ? 'Regra de início de atividade: primeira faixa'
      : (dadosBase.usouRBT12p ? 'Base proporcionalizada: ' + moeda(baseSelecionada) : 'Base: RBT12 ' + moeda(baseSelecionada));

    var html = '';
    html += '<div class="empresa">';
    html +=   '<div>';
    html +=     '<p class="eyebrow" style="color:#067a54">Extrato importado</p>';
    html +=     '<h2>' + esc(d.nome || 'Contribuinte') + '</h2>';
    html +=     '<p>CNPJ ' + esc(d.cnpj || '—') + ' · ' + d.atividades.length + ' atividade' + (d.atividades.length > 1 ? 's' : '') + ' no extrato</p>';
    html +=   '</div>';
    html +=   '<div class="pa"><span>Período de apuração</span>' + esc(d.pa || '—') + '</div>';
    html += '</div>';

    html += '<div class="chips">';
    html += chip(dadosBase.primeiraFaixaForcada ? 'Enquadramento' : 'Base de cálculo', dadosBase.primeiraFaixaForcada ? '1ª faixa' : moeda(baseSelecionada), baseNota);
    html += chip('Receita do PA', moeda(d.rpa || 0), 'competência ' + esc(d.pa || '—'));
    if (d.fatorR != null) {
      html += chip('Fator R', pct(d.fatorR * 100, 0), 'Anexo ' + esc(d.fatorAnexo || '—') + (d.folha ? ' · folha ' + moeda(d.folha) : ''));
    } else {
      html += chip('Fator R', 'Não se aplica', 'nenhuma atividade sujeita ao fator');
    }
    html += '</div>';

    var totalReceita = 0;
    var totalDAS = 0;
    d.atividades.forEach(function (atividade) {
      if (atividade.receita != null) totalReceita += Number(atividade.receita);
      if (atividade.totalDAS != null) totalDAS += Number(atividade.totalDAS);
    });
    var aliquotaGeral = totalReceita > 0 ? (totalDAS / totalReceita) * 100 : 0;

    html += '<div class="geral">';
    html +=   '<div>';
    html +=     '<span class="geral-label">Alíquota geral do DAS — média do mês</span>';
    html +=     '<small>DAS total ' + moeda(totalDAS) + ' ÷ receita total ' + moeda(totalReceita) + '</small>';
    html +=   '</div>';
    html +=   '<strong>' + pct(aliquotaGeral, 5) + '</strong>';
    html += '</div>';
    html += '<p class="geral-hint">Média ponderada das atividades do extrato. Serve para conferir o DAS total — não use este percentual em uma nota individual.</p>';

    var referencia = paMaisRecente(new Date());
    if (d.mes && d.ano && mesesDeDiferenca(d, referencia) > 0) {
      html += '<div class="alerta">' + ICONE_ALERTA +
        '<div><strong>Extrato de um período anterior.</strong> Este é o PA ' + esc(d.pa || '—') +
        ', mas o PA ' + fmtPA(referencia) + ' já está disponível. A alíquota muda quando a RBT12 muda — ' +
        'importe o extrato mais recente antes de emitir.</div></div>';
    }

    html += '<div class="section-mini">';
    html +=   '<div><h3>Alíquota por atividade</h3><p>Efetiva, nominal da faixa e o DAS cobrado, lado a lado.</p></div>';
    if (d.ano >= 2027) {
      html += '<label class="toggle-hibrido"><input type="checkbox" id="hibrido-pdf"' + (estado.hibridoPDF ? ' checked' : '') + '> Simples híbrido</label>';
    }
    html += '</div>';

    html += '<div class="alerta">' + ICONE_ALERTA +
      '<div><strong>Efetiva ou nominal?</strong> O guia oficial do Emissor Nacional manda preencher o campo ' +
      '“Alíquota no Simples Nacional” com a alíquota <strong>nominal</strong> da faixa (13,50% no Anexo III, ' +
      '9,50% no Anexo I). A <strong>efetiva</strong> é a carga real do período. Confirme a ajuda do campo no ' +
      'seu portal — os dois valores estão na tabela.</div></div>';

    html += '<div class="ativ-head"><span>Atividade</span><span>Anexo</span><span>Efetiva</span><span>Nominal</span><span>DAS pago</span></div>';

    d.atividades.forEach(function (atividade, i) {
      var anexo = Object.prototype.hasOwnProperty.call(estado.anexos, i)
        ? estado.anexos[i]
        : (atividade.anexo || '');

      var resultado = null;
      if (anexo) {
        resultado = TABELAS.calcular({
          ano: d.ano,
          anexo: anexo,
          rbt12: dadosBase.rbt12,
          rbt12p: dadosBase.rbt12p,
          usouRBT12p: dadosBase.usouRBT12p,
          primeiraFaixaForcada: dadosBase.primeiraFaixaForcada,
          hibrido: estado.hibridoPDF
        });
      }

      var descricao = atividade.descricao || '';
      var dasPct = (atividade.receita != null && atividade.totalDAS != null && atividade.receita > 0)
        ? (atividade.totalDAS / atividade.receita) * 100
        : null;
      var fora = (resultado && !resultado.erro) ? foraDoDAS(descricao, resultado) : null;

      var dadosAtividade = [];
      if (atividade.receita != null) dadosAtividade.push('Receita ' + moeda(atividade.receita));
      if (atividade.totalDAS != null) dadosAtividade.push('DAS ' + moeda(atividade.totalDAS));

      var tags = '';
      if (ehMercadoria(descricao)) tags += ' <span class="tag tag-warn">Não gera NFS-e</span>';
      if (issRetido(descricao)) tags += ' <span class="tag tag-info">ISS retido</span>';

      html += '<div class="ativ">';
      html +=   '<div class="ativ-main">';
      html +=     '<p class="ativ-desc">' + esc(rotuloAtividade(descricao)) + tags + '</p>';
      html +=     '<p class="ativ-meta">' + esc(dadosAtividade.join(' · ')) + '</p>';
      if (fora) {
        var nota = notaForaDoDAS(descricao, fora, dasPct);
        if (ehMercadoria(descricao)) {
          nota = 'Venda de mercadoria sai por NF-e, não por NFS-e. ' + nota;
        }
        if (nota) html += '<p class="ativ-nota">' + esc(nota) + '</p>';
      }
      html +=   '</div>';

      html += '<select class="ativ-anexo" data-idx="' + i + '" aria-label="Anexo da atividade ' + (i + 1) + '">';
      html += '<option value="">Selecione</option>';
      ['I', 'II', 'III', 'IV', 'V'].forEach(function (k) {
        html += '<option value="' + k + '"' + (k === anexo ? ' selected' : '') + '>' + ANEXOS_CURTOS[k] + '</option>';
      });
      html += '</select>';

      if (resultado && !resultado.erro) {
        var complemento = '';
        if (resultado.hibrido) {
          complemento = pct(resultado.dentro, 5) + ' no DAS · ' + pct(resultado.fora, 5) + ' IBS/CBS';
        } else {
          complemento = resultado.anexoNome + ' · ' + resultado.faixa + 'ª faixa';
        }
        var confere = dasPct != null && Math.abs((resultado.efetiva - fora.total) - dasPct) <= 0.001;
        html += '<div class="ativ-rate">' +
          '<strong>' + pct(resultado.efetiva, 5) + '</strong>' +
          '<span>' + esc(complemento) + '</span>' +
          '<button class="link-copy" data-copiar="' + num(resultado.efetiva, 5) + '">copiar</button>' +
          '</div>';
        html += '<div class="ativ-rate nominal-rate">' +
          '<strong>' + pct(resultado.nominal, 2) + '</strong>' +
          '<span>nominal · ' + resultado.faixa + 'ª faixa</span>' +
          '<button class="link-copy" data-copiar="' + num(resultado.nominal, 2) + '">copiar</button>' +
          '</div>';
        html += '<div class="ativ-rate das-rate">' + (dasPct != null ? pct(dasPct, 5) : '—') +
          (confere ? '<span class="das-check">✓ confere</span>' : '') + '</div>';
      } else {
        html += '<div class="ativ-rate is-empty"><strong>—</strong><span>selecione o anexo</span></div>';
        html += '<div class="ativ-rate is-empty"><strong>—</strong><span></span></div>';
        html += '<div class="ativ-rate das-rate">—</div>';
      }
      html += '</div>';
    });

    if (estado.hibridoPDF && d.ano >= 2027) {
      html += '<div class="hibrido-info"><strong>Simples híbrido</strong>A parcela de IBS/CBS mostrada em cada atividade sai do DAS. No regime regular, IBS e CBS são apurados separadamente; o campo da NFS-e deve refletir a carga total.</div>';
    }

    html += '<p class="rodape-nota"><strong>Como usar:</strong> “Efetiva” é a alíquota do art. 18, §1º-A da LC 123/2006 (carga real do período); “Nominal” é a da faixa, que o guia do emissor indica para o campo “Alíquota no Simples Nacional”; “DAS” é o que o extrato cobrou, já sem ST, monofásico e retenção de ISS. Confirme o rótulo e a ajuda do campo no seu portal antes de copiar. Reimporte o extrato a cada apuração — a alíquota muda quando a RBT12 muda.</p>';

    html += '<div class="acoes-resultado">';
    html +=   '<button class="btn btn-soft" data-acao="imprimir">Imprimir</button>';
    html +=   '<button class="btn btn-soft" data-acao="importar">Importar outro extrato</button>';
    html +=   '<button class="btn btn-soft" data-acao="limpar">Limpar</button>';
    html += '</div>';

    $('resultado').innerHTML = html;
  }

  /* ---------- resultado manual ---------- */

  function renderManual(entrada) {
    var resultado = TABELAS.calcular({
      ano: entrada.ano,
      anexo: entrada.anexo,
      rbt12: entrada.rbt12,
      rbt12p: entrada.rbt12p,
      usouRBT12p: entrada.usouRBT12p,
      primeiraFaixaForcada: entrada.primeiraFaixaForcada,
      hibrido: entrada.hibrido
    });

    if (resultado.erro) { renderErro(resultado.erro); return; }

    var html = '';

    html += '<div class="ratecard">';
    html +=   '<div>';
    html +=     '<p class="rate-label">Alíquota efetiva do período</p>';
    html +=     '<div class="rate-value">' + num(resultado.efetiva, 5) + '<small>%</small></div>';
    html +=     '<p class="rate-sub">' + esc(resultado.anexoNome) + ' · ' + resultado.faixa + 'ª faixa · vigência ' + esc(resultado.vigencia) + (resultado.hibrido ? ' · Simples híbrido' : '') + '</p>';
    html +=     '<p class="rate-sub">Alíquota nominal da faixa: <b>' + pct(resultado.nominal, 2) + '</b> — guia do emissor para o campo “Alíquota no Simples Nacional”.</p>';
    html +=   '</div>';
    html +=   '<div class="rate-acoes">';
    html +=     '<button class="btn btn-copy" data-copiar="' + num(resultado.efetiva, 5) + '">Copiar efetiva</button>';
    html +=     '<button class="btn btn-copy" data-copiar="' + num(resultado.nominal, 2) + '">Copiar nominal</button>';
    html +=   '</div>';
    html += '</div>';

    html += '<div class="alerta">' + ICONE_ALERTA +
      '<div><strong>Efetiva ou nominal?</strong> O guia oficial do Emissor Nacional manda preencher o campo ' +
      '“Alíquota no Simples Nacional” com a alíquota <strong>nominal</strong> da faixa. A <strong>efetiva</strong> ' +
      'é a carga real do período. Confirme a ajuda do campo no seu portal.</div></div>';

    html += '<div class="meta-grid">';
    html += meta(resultado.primeiraFaixaForcada ? 'Base de enquadramento' : (resultado.usouRBT12p ? 'Base proporcionalizada' : 'Base (RBT12)'), resultado.primeiraFaixaForcada ? '1ª faixa' : moeda(resultado.base), resultado.primeiraFaixaForcada ? 'regra dos 1º e 2º meses de atividade em 2027+' : (resultado.usouRBT12p ? 'início de atividade' : '12 meses de referência'));
    html += meta('Faixa', resultado.faixa + 'ª', 'até ' + moeda(TABELAS.FAIXAS[resultado.faixa - 1]));
    html += meta('Alíquota nominal', pct(resultado.nominal), 'tabela do ' + resultado.anexoNome.toLowerCase());
    html += meta('Parcela a deduzir', moeda(resultado.deduzir), 'da faixa ' + resultado.faixa);
    html += '</div>';

    if (resultado.primeiraFaixaForcada) {
      html += '<div class="formula">Regra de início de atividade: aplica-se a alíquota nominal da 1ª faixa — <b>' + pct(resultado.efetiva, 5) + '</b>.</div>';
    } else {
      html += '<div class="formula">(' + num(resultado.base) + ' × ' + pct(resultado.nominal) + ' − ' + num(resultado.deduzir) + ') ÷ ' + num(resultado.base) + ' = <b>' + pct(resultado.efetiva, 5) + '</b></div>';
    }

    if (entrada.rpa > 0) {
      var baseDas = resultado.hibrido ? resultado.dentro : resultado.efetiva;
      var rotuloDas = resultado.hibrido ? 'DAS estimado (sem IBS/CBS) sobre ' : 'DAS estimado sobre ';
      html += '<div class="das-linha"><span>' + rotuloDas + moeda(entrada.rpa) + '</span><strong>' + moeda(entrada.rpa * baseDas / 100) + '</strong></div>';
    }

    if (resultado.hibrido) {
      html += '<div class="hibrido-info"><strong>Simples híbrido</strong>Do total de ' + pct(resultado.efetiva, 5) + ', ' + pct(resultado.dentro, 5) + ' permanece no DAS e ' + pct(resultado.fora, 5) + ' corresponde à parcela de IBS/CBS recolhida fora. No regime regular, IBS e CBS são apurados separadamente.</div>';
    }

    html += '<table class="partilha">';
    html += '<thead><tr><th>Tributo</th><th>% da partilha</th><th>Alíquota</th>' + (entrada.rpa > 0 ? '<th>Valor estimado</th>' : '') + '</tr></thead><tbody>';

    ORDEM_TRIBUTOS.forEach(function (chave) {
      if (resultado.partilha[chave] == null) return;
      var aliquota = resultado.aliquotasTributos[chave] || 0;
      var fatia = resultado.efetiva > 0 ? aliquota / resultado.efetiva * 100 : 0;
      var fora = resultado.hibrido && (chave === 'CBS' || chave === 'IBS');
      html += '<tr' + (fora ? ' class="fora"' : '') + '>';
      html += '<td>' + NOMES_TRIBUTOS[chave] + '</td>';
      html += '<td>' + pct(fatia) + '</td>';
      html += '<td>' + pct(aliquota, 5) + '</td>';
      if (entrada.rpa > 0) html += '<td>' + moeda(entrada.rpa * aliquota / 100) + '</td>';
      html += '</tr>';
    });

    html += '<tr class="total"><td>Total</td><td>100,00%</td><td>' + pct(resultado.efetiva, 5) + '</td>' +
      (entrada.rpa > 0 ? '<td>' + moeda(entrada.rpa * resultado.efetiva / 100) + '</td>' : '') + '</tr>';
    html += '</tbody></table>';

    html += '<p class="rodape-nota"><strong>Partilha:</strong> os percentuais vêm da tabela do ' + esc(resultado.anexoNome) + '. Eles mostram como a alíquota efetiva se distribui entre os tributos.</p>';

    html += '<div class="acoes-resultado"><button class="btn btn-soft" data-acao="limpar-manual">Novo cálculo</button></div>';

    $('resultado').innerHTML = html;
  }

  function atualizar() {
    if (estado.modo === 'pdf') {
      if (estado.dados) renderPDF();
      else renderVazio('Importe o extrato do PGDAS-D para começar.', 'O PDF é lido no seu navegador e não sai do computador.');
    } else if (estado.ultimoManual) {
      renderManual(estado.ultimoManual);
    } else {
      renderVazio('Preencha os dados para calcular.', 'Informe a RBT12 e a atividade. O resultado aparece aqui com a memória de cálculo.');
    }
  }

  /* ---------- leitura do PDF ---------- */

  async function processarArquivo(arquivo) {
    if (!arquivo) return;
    if (!/\.pdf$/i.test(arquivo.name) && arquivo.type !== 'application/pdf') {
      renderErro('Selecione um arquivo PDF do extrato do PGDAS-D.');
      return;
    }
    if (arquivo.size > 4 * 1024 * 1024) {
      renderErro('O arquivo tem mais de 4 MB. Use o PDF original gerado pelo PGDAS-D.');
      return;
    }

    estado.modo = 'pdf';
    ativarAba('pdf');
    renderCarregando(arquivo.name);

    try {
      var texto = await PGDAS.extrairPDF(arquivo);
      var dados = PGDAS.parseTexto(texto);

      if (dados.erro) { renderErro(dados.erro); return; }

      estado.dados = dados;
      estado.anexos = {};
      estado.hibridoPDF = false;
      renderPDF();
    } catch (erro) {
      console.error(erro);
      renderErro('Não foi possível ler este PDF. Confirme se é o extrato digital do PGDAS-D (texto selecionável) e tente novamente.');
    } finally {
      $('arquivo').value = '';
    }
  }

  /* ---------- navegação e formulário ---------- */

  function ativarAba(modo) {
    estado.modo = modo;
    document.querySelectorAll('.tab').forEach(function (tab) {
      var ativo = tab.dataset.tab === modo;
      tab.classList.toggle('is-active', ativo);
      tab.setAttribute('aria-selected', ativo ? 'true' : 'false');
    });
    $('painel-pdf').hidden = modo !== 'pdf';
    $('painel-manual').hidden = modo !== 'manual';
  }

  function configurarFormulario() {
    var atividade = $('atividade');
    var campoFator = $('campo-fator');
    var campoHibrido = $('campo-hibrido');
    var campoInicio = $('campo-mes-atividade');
    var inicioCheck = $('inicio-atividade');
    var mesAtividade = $('mes-atividade');
    var helpInicio = $('inicio-help');
    var campoHistorico = $('campo-receitas-historicas');
    var receitasHistoricas = $('receitas-historicas');
    var helpHistorico = $('historico-help');
    var helpFator = $('fator-help');

    function atualizarCampos() {
      var fator = atividade.value === 'R';
      campoFator.hidden = !fator;

      if (fator) {
        var valor = valorInput($('fator').value);
        if (valor > 0 && valor <= 1) valor = valor * 100;
        helpFator.textContent = valor > 0
          ? (valor >= 28 ? 'Fator R ' + pct(valor, 0) + ' ≥ 28% → Anexo III.' : 'Fator R ' + pct(valor, 0) + ' < 28% → Anexo V.')
          : 'Fator R ≥ 28% → Anexo III · abaixo de 28% → Anexo V.';
      }

      var hibrido = Number($('ano').value) >= 2027;
      campoHibrido.hidden = !hibrido;
      if (!hibrido) $('hibrido').checked = false;
      campoInicio.hidden = !inicioCheck.checked;
      var anoApuracao = Number($('ano').value);
      var mes = Number(mesAtividade.value);
      var mesesHistorico = anoApuracao <= 2026 ? mes - 1 : mes - 2;
      var precisaHistorico = inicioCheck.checked && (anoApuracao <= 2026
        ? mes >= 2 && mes <= 12
        : mes >= 3 && mes <= 13);
      campoHistorico.hidden = !precisaHistorico;
      if (inicioCheck.checked) {
        if (anoApuracao <= 2026) {
          helpInicio.textContent = mes === 1
            ? '1º mês: RBT12p = receita do PA × 12 (preencha a receita do mês ou informe a RBT12p).'
            : (mes <= 12 ? '2º ao 12º mês: informe a RBT12p do PGDAS-D, calculada pela média dos meses anteriores × 12.' : '13º mês ou posterior: use a RBT12 normal.');
        } else {
          helpInicio.textContent = mes <= 2
            ? '1º e 2º mês: aplica-se a alíquota da 1ª faixa.'
            : (mes <= 13 ? '3º ao 13º mês: informe a base do PGDAS-D, pela média dos meses antecedentes ao mês anterior × 12.' : '14º mês ou posterior: use a RBT12 normal (12 meses antecedentes ao mês anterior ao PA).');
        }
      }
      if (precisaHistorico) {
        helpHistorico.textContent = 'Opcional: informe exatamente ' + mesesHistorico + ' valor(es), do 1º ao ' + mesesHistorico + 'º mês de atividade, incluindo 0,00 nos meses sem receita. A média será multiplicada por 12. Se preferir, deixe em branco e informe a RBT12p acima.';
      }
    }

    atividade.addEventListener('change', atualizarCampos);
    $('ano').addEventListener('change', atualizarCampos);
    $('fator').addEventListener('input', atualizarCampos);
    inicioCheck.addEventListener('change', atualizarCampos);
    mesAtividade.addEventListener('change', atualizarCampos);
    atualizarCampos();

    $('form-manual').addEventListener('submit', function (evento) {
      evento.preventDefault();
      var erroEl = $('form-erro');
      erroEl.hidden = true;

      var ano = Number($('ano').value);
      var base = $('atividade').value;
      var rbt12 = valorInput($('rbt12').value);
      var rbt12p = valorInput($('rbt12p').value);
      var rpa = valorInput($('rpa').value);
      var fator = valorInput($('fator').value);
      if (fator > 0 && fator <= 1) fator = fator * 100;
      var inicio = inicioCheck.checked;
      var mesInicio = inicio ? Number(mesAtividade.value) : null;
      var primeiraFaixaForcada = inicio && ano >= 2027 && mesInicio <= 2;
      var baseProporcional = rbt12p;
      var historicoTexto = $('receitas-historicas').value;
      var erroHistorico = null;

      if (inicio && ano <= 2026 && mesInicio === 1 && !(baseProporcional > 0) && rpa > 0) {
        baseProporcional = rpa * 12;
      }

      function falhar(mensagem) {
        erroEl.textContent = mensagem;
        erroEl.hidden = false;
        renderErro(mensagem);
      }

      var precisaHistorico = inicio && (ano <= 2026
        ? mesInicio >= 2 && mesInicio <= 12
        : mesInicio >= 3 && mesInicio <= 13);
      if (precisaHistorico && historicoTexto.trim()) {
        var lista = listaReceitas(historicoTexto);
        var mesesHistorico = ano <= 2026 ? mesInicio - 1 : mesInicio - 2;
        if (lista.erro) {
          erroHistorico = lista.erro;
        } else if (lista.valores.length !== mesesHistorico) {
          erroHistorico = 'Informe exatamente ' + mesesHistorico + ' valores mensais anteriores ou use a RBT12p do PGDAS-D.';
        } else {
          baseProporcional = TABELAS.rbt12pDaMedia(lista.valores);
        }
      }
      if (erroHistorico) { falhar(erroHistorico); return; }

      var precisaRBT12 = !inicio || (ano <= 2026 ? mesInicio >= 13 : mesInicio >= 14);
      var precisaBaseProporcional = inicio && (ano <= 2026 ? mesInicio <= 12 && !(mesInicio === 1 && baseProporcional > 0) : mesInicio >= 3 && mesInicio <= 13);
      if (precisaRBT12 && rbt12 <= 0) { falhar('Informe a RBT12 normal do período.'); return; }
      if (precisaBaseProporcional && baseProporcional <= 0) { falhar('Informe a base proporcionalizada (RBT12p) indicada pelo PGDAS-D para este mês.'); return; }
      if (!inicio && rbt12 <= 0) { falhar('Informe a RBT12 — a receita bruta de referência para o cálculo.'); return; }
      if (base === 'R' && fator <= 0) { falhar('Informe o Fator R para definir entre Anexo III e Anexo V.'); return; }

      var anexo = base === 'R' ? (fator >= 28 ? 'III' : 'V') : base;

      estado.ultimoManual = {
        ano: ano,
        anexo: anexo,
        anexoBase: base,
        rbt12: precisaRBT12 ? rbt12 : 0,
        rbt12p: precisaBaseProporcional || (inicio && ano <= 2026 && mesInicio === 1) ? baseProporcional : 0,
        usouRBT12p: precisaBaseProporcional || (inicio && ano <= 2026 && mesInicio === 1),
        primeiraFaixaForcada: primeiraFaixaForcada,
        inicioAtividade: inicio,
        mesAtividade: mesInicio,
        rpa: rpa,
        fator: fator,
        hibrido: $('hibrido').checked
      };

      renderManual(estado.ultimoManual);
    });
  }

  function copiarTexto(texto, botao) {
    function feedback() {
      var original = botao.textContent;
      botao.textContent = 'Copiado';
      setTimeout(function () { botao.textContent = original; }, 1500);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(feedback).catch(function () { fallback(); });
    } else {
      fallback();
    }

    function fallback() {
      var campo = document.createElement('textarea');
      campo.value = texto;
      campo.setAttribute('readonly', '');
      campo.style.position = 'fixed';
      campo.style.opacity = '0';
      document.body.appendChild(campo);
      campo.select();
      try { document.execCommand('copy'); feedback(); } catch (e) { /* sem cópia automática */ }
      document.body.removeChild(campo);
    }
  }

  function iniciar() {
    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        ativarAba(tab.dataset.tab);
        atualizar();
      });
    });

    var dropzone = $('dropzone');
    var arquivo = $('arquivo');

    dropzone.addEventListener('keydown', function (evento) {
      if (evento.key === 'Enter' || evento.key === ' ') {
        evento.preventDefault();
        arquivo.click();
      }
    });

    arquivo.addEventListener('change', function () {
      processarArquivo(arquivo.files && arquivo.files[0]);
    });

    ['dragenter', 'dragover'].forEach(function (nome) {
      dropzone.addEventListener(nome, function (evento) {
        evento.preventDefault();
        dropzone.classList.add('is-drag');
      });
    });

    ['dragleave', 'dragend'].forEach(function (nome) {
      dropzone.addEventListener(nome, function () { dropzone.classList.remove('is-drag'); });
    });

    dropzone.addEventListener('drop', function (evento) {
      evento.preventDefault();
      dropzone.classList.remove('is-drag');
      var lista = evento.dataTransfer && evento.dataTransfer.files;
      processarArquivo(lista && lista[0]);
    });

    document.addEventListener('dragover', function (evento) { evento.preventDefault(); });
    document.addEventListener('drop', function (evento) { evento.preventDefault(); });

    configurarFormulario();

    $('resultado').addEventListener('change', function (evento) {
      if (evento.target.classList.contains('ativ-anexo')) {
        estado.anexos[Number(evento.target.dataset.idx)] = evento.target.value;
        renderPDF();
      }
      if (evento.target.id === 'hibrido-pdf') {
        estado.hibridoPDF = evento.target.checked;
        renderPDF();
      }
    });

    document.addEventListener('click', function (evento) {
      var copiar = evento.target.closest('[data-copiar]');
      if (copiar) {
        copiarTexto(copiar.getAttribute('data-copiar'), copiar);
        return;
      }

      var acao = evento.target.closest('[data-acao]');
      if (!acao) return;

      var nome = acao.getAttribute('data-acao');
      if (nome === 'importar') {
        $('arquivo').click();
      } else if (nome === 'imprimir') {
        window.print();
      } else if (nome === 'limpar') {
        estado.dados = null;
        estado.anexos = {};
        estado.hibridoPDF = false;
        renderVazio('Importe o extrato do PGDAS-D para começar.', 'O PDF é lido no seu navegador e não sai do computador.');
      } else if (nome === 'limpar-manual') {
        estado.ultimoManual = null;
        $('form-manual').reset();
        $('form-erro').hidden = true;
        $('campo-fator').hidden = true;
        $('campo-hibrido').hidden = true;
        $('campo-mes-atividade').hidden = true;
        $('campo-receitas-historicas').hidden = true;
        renderVazio('Preencha os dados para calcular.', 'Informe a RBT12 e a atividade. O resultado aparece aqui com a memória de cálculo.');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
