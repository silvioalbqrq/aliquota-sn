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
    if (!d.rbt12 || d.rbt12 <= 0) {
      renderErro('Não encontrei a RBT12 no extrato. Verifique se o PDF está completo ou use o cálculo manual.');
      return;
    }
    var basePDF = d.rbt12p && d.rbt12p > 0 ? d.rbt12p : d.rbt12;
    if (basePDF > 4800000) {
      renderErro('A receita do extrato (' + moeda(basePDF) + ') supera R$ 4.800.000,00. A empresa está fora do Simples Nacional.');
      return;
    }

    var baseNota = d.rbt12p && d.rbt12p > 0 ? 'Base: RBT12p ' + moeda(d.rbt12p) : 'Receita dos 12 meses anteriores';

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
    html += chip('RBT12', moeda(d.rbt12), baseNota);
    html += chip('Receita do PA', moeda(d.rpa || 0), 'competência ' + esc(d.pa || '—'));
    if (d.fatorR != null) {
      html += chip('Fator R', pct(d.fatorR * 100, 0), 'Anexo ' + esc(d.fatorAnexo || '—') + (d.folha ? ' · folha ' + moeda(d.folha) : ''));
    } else {
      html += chip('Fator R', 'Não se aplica', 'nenhuma atividade sujeita ao fator');
    }
    html += '</div>';

    html += '<div class="section-mini">';
    html +=   '<div><h3>Alíquota por atividade</h3><p>Copie o percentual da coluna à direita para o campo da NFS-e.</p></div>';
    if (d.ano >= 2027) {
      html += '<label class="toggle-hibrido"><input type="checkbox" id="hibrido-pdf"' + (estado.hibridoPDF ? ' checked' : '') + '> Simples híbrido</label>';
    }
    html += '</div>';

    html += '<div class="ativ-head"><span>Atividade</span><span>Anexo</span><span>Alíquota NFS-e</span><span></span></div>';

    d.atividades.forEach(function (atividade, i) {
      var anexo = Object.prototype.hasOwnProperty.call(estado.anexos, i)
        ? estado.anexos[i]
        : (atividade.anexo || '');

      var resultado = null;
      if (anexo) {
        resultado = TABELAS.calcular({
          ano: d.ano,
          anexo: anexo,
          rbt12: d.rbt12,
          rbt12p: d.rbt12p,
          hibrido: estado.hibridoPDF
        });
      }

      var dadosAtividade = [];
      if (atividade.receita != null) dadosAtividade.push('Receita ' + moeda(atividade.receita));
      if (atividade.totalDAS != null) dadosAtividade.push('DAS ' + moeda(atividade.totalDAS));

      html += '<div class="ativ">';
      html +=   '<div class="ativ-main">';
      html +=     '<p class="ativ-desc">' + esc(rotuloAtividade(atividade.descricao)) + '</p>';
      html +=     '<p class="ativ-meta">' + esc(dadosAtividade.join(' · ')) + '</p>';
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
          complemento = pct(resultado.dentro) + ' no DAS · ' + pct(resultado.fora) + ' IBS/CBS';
        } else {
          complemento = resultado.anexoNome + ' · ' + resultado.faixa + 'ª faixa';
        }
        html += '<div class="ativ-rate"><strong>' + pct(resultado.efetiva) + '</strong><span>' + esc(complemento) + '</span></div>';
        html += '<button class="btn btn-copy" data-copiar="' + num(resultado.efetiva) + '">Copiar</button>';
      } else {
        html += '<div class="ativ-rate is-empty"><strong>—</strong><span>selecione o anexo</span></div><span></span>';
      }
      html += '</div>';
    });

    if (estado.hibridoPDF && d.ano >= 2027) {
      html += '<div class="hibrido-info"><strong>Simples híbrido</strong>A parcela de IBS/CBS mostrada em cada atividade sai do DAS. No regime regular, IBS e CBS são apurados separadamente; o campo da NFS-e deve refletir a carga total.</div>';
    }

    html += '<p class="rodape-nota"><strong>Como usar:</strong> informe o percentual no campo “Alíquota no Simples Nacional” (Passo 19). A alíquota do anexo é a carga aproximada da atividade, antes de exclusões de ST, monofásico e retenção de ISS — o mesmo critério do extrato.</p>';

    html += '<div class="acoes-resultado">';
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
      hibrido: entrada.hibrido
    });

    if (resultado.erro) { renderErro(resultado.erro); return; }

    var html = '';

    html += '<div class="ratecard">';
    html +=   '<div>';
    html +=     '<p class="rate-label">Alíquota efetiva para a NFS-e</p>';
    html +=     '<div class="rate-value">' + num(resultado.efetiva) + '<small>%</small></div>';
    html +=     '<p class="rate-sub">' + esc(resultado.anexoNome) + ' · ' + resultado.faixa + 'ª faixa · vigência ' + esc(resultado.vigencia) + (resultado.hibrido ? ' · Simples híbrido' : '') + '</p>';
    html +=   '</div>';
    html +=   '<button class="btn btn-copy" data-copiar="' + num(resultado.efetiva) + '">Copiar alíquota</button>';
    html += '</div>';

    html += '<div class="meta-grid">';
    html += meta(resultado.usouRBT12p ? 'Base (RBT12p)' : 'Base (RBT12)', moeda(resultado.base), resultado.usouRBT12p ? 'início de atividade' : '12 meses anteriores');
    html += meta('Faixa', resultado.faixa + 'ª', 'até ' + moeda(TABELAS.FAIXAS[resultado.faixa - 1]));
    html += meta('Alíquota nominal', pct(resultado.nominal), 'tabela do ' + resultado.anexoNome.toLowerCase());
    html += meta('Parcela a deduzir', moeda(resultado.deduzir), 'da faixa ' + resultado.faixa);
    html += '</div>';

    html += '<div class="formula">(' + num(resultado.base) + ' × ' + pct(resultado.nominal) + ' − ' + num(resultado.deduzir) + ') ÷ ' + num(resultado.base) + ' = <b>' + pct(resultado.efetiva, 4) + '</b></div>';

    if (entrada.rpa > 0) {
      var baseDas = resultado.hibrido ? resultado.dentro : resultado.efetiva;
      var rotuloDas = resultado.hibrido ? 'DAS estimado (sem IBS/CBS) sobre ' : 'DAS estimado sobre ';
      html += '<div class="das-linha"><span>' + rotuloDas + moeda(entrada.rpa) + '</span><strong>' + moeda(entrada.rpa * baseDas / 100) + '</strong></div>';
    }

    if (resultado.hibrido) {
      html += '<div class="hibrido-info"><strong>Simples híbrido</strong>Do total de ' + pct(resultado.efetiva) + ', ' + pct(resultado.dentro) + ' permanece no DAS e ' + pct(resultado.fora) + ' corresponde à parcela de IBS/CBS recolhida fora. No regime regular, IBS e CBS são apurados separadamente.</div>';
    }

    html += '<table class="partilha">';
    html += '<thead><tr><th>Tributo</th><th>% da partilha</th><th>Alíquota</th>' + (entrada.rpa > 0 ? '<th>Valor estimado</th>' : '') + '</tr></thead><tbody>';

    ORDEM_TRIBUTOS.forEach(function (chave) {
      if (resultado.partilha[chave] == null) return;
      var fatia = resultado.partilha[chave];
      var aliquota = resultado.efetiva * fatia / 100;
      var fora = resultado.hibrido && (chave === 'CBS' || chave === 'IBS');
      html += '<tr' + (fora ? ' class="fora"' : '') + '>';
      html += '<td>' + NOMES_TRIBUTOS[chave] + '</td>';
      html += '<td>' + pct(fatia) + '</td>';
      html += '<td>' + pct(aliquota, 4) + '</td>';
      if (entrada.rpa > 0) html += '<td>' + moeda(entrada.rpa * aliquota / 100) + '</td>';
      html += '</tr>';
    });

    html += '<tr class="total"><td>Total</td><td>100,00%</td><td>' + pct(resultado.efetiva, 4) + '</td>' +
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
    }

    atividade.addEventListener('change', atualizarCampos);
    $('ano').addEventListener('change', atualizarCampos);
    $('fator').addEventListener('input', atualizarCampos);
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

      function falhar(mensagem) {
        erroEl.textContent = mensagem;
        erroEl.hidden = false;
        return;
      }

      if (rbt12 <= 0) { falhar('Informe a RBT12 — a receita bruta dos 12 meses anteriores.'); return; }
      if (base === 'R' && fator <= 0) { falhar('Informe o Fator R para definir entre Anexo III e Anexo V.'); return; }

      var anexo = base === 'R' ? (fator >= 28 ? 'III' : 'V') : base;

      estado.ultimoManual = {
        ano: ano,
        anexo: anexo,
        anexoBase: base,
        rbt12: rbt12,
        rbt12p: rbt12p,
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
        renderVazio('Preencha os dados para calcular.', 'Informe a RBT12 e a atividade. O resultado aparece aqui com a memória de cálculo.');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
