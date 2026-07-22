// App Controller - Gestão de Propostas TransfereGov (Node.js REST API Client)

// Estado Global da Aplicação
const appState = {
  currentView: "dashboard",
  proposals: [],
  filteredProposals: [],
  currentPage: 1,
  pageSize: 10,
  sortColumn: "nrProposta",
  sortDirection: "asc",
  activeDetailProposal: null,
  activeProposalIdForDelete: null,
  
  // Gráficos (Instâncias do Chart.js)
  charts: {
    situacao: null,
    programas: null,
    evolucao: null,
    financeiroMinisterios: null,
    financeiroProponentes: null,
    financeiroSituacoes: null
  },
  
  // Notificações ativas
  notifications: [
    { id: 1, text: "Proposta 56000005066/2023 mudou para EM ANÁLISE", time: "Há 10 minutos", unread: true },
    { id: 2, text: "Documentação pendente para proposta de IPATINGA", time: "Há 2 horas", unread: true },
    { id: 3, text: "Nova proposta cadastrada: Posto de Saúde Fluvial", time: "Há 1 dia", unread: false }
  ]
};

// API Base URL
const API_URL = ""; // Usa caminhos relativos pois o Express serve a pasta public

// Inicialização da Aplicação
document.addEventListener("DOMContentLoaded", async () => {
  // Carregar dados iniciais do Backend
  await fetchProposals();
  
  // Setup de Componentes de Layout
  setupSidebar();
  setupNotifications();
  setupAutocompleteSearch();
  setupDragAndDrop();
  setupTheme();
  
  // Popular Dropdowns nos Formulários
  populateDropdowns();
  
  // Renderizar a tela inicial (Dashboard)
  renderDashboard();
  renderTable();
  renderAdminUsers();
  
  // Listener do Teclado para Atalhos
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      switchView('cadastro');
    }
  });

  // Verificar Rascunhos
  checkFormDraft();
});

// Buscar Propostas do Servidor
async function fetchProposals() {
  try {
    const res = await fetch('/api/proposals');
    if (!res.ok) throw new Error('Falha ao obter propostas do servidor.');
    appState.proposals = await res.json();
    appState.filteredProposals = [...appState.proposals];
  } catch (error) {
    showToast(error.message, 'error');
  }
}

/* ==========================================================================
   1. LAYOUT, SIDEBAR & TEMA
   ========================================================================== */

function setupSidebar() {
  const sidebar = document.getElementById("appSidebar");
  const collapseBtn = document.getElementById("sidebarCollapseBtn");
  
  collapseBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    const icon = collapseBtn.querySelector(".material-symbols-outlined");
    if (sidebar.classList.contains("collapsed")) {
      icon.textContent = "chevron_right";
    } else {
      icon.textContent = "chevron_left";
    }
    setTimeout(updateAllCharts, 300);
  });
  
  document.querySelectorAll(".sidebar-menu .menu-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const targetView = item.getAttribute("data-view");
      switchView(targetView);
    });
  });
}

async function switchView(viewName) {
  appState.currentView = viewName;
  
  document.querySelectorAll(".sidebar-menu .menu-item").forEach(i => i.classList.remove("active"));
  document.querySelectorAll(".view-container").forEach(v => v.classList.remove("active"));
  
  const activeMenu = document.querySelector(`.sidebar-menu .menu-item[data-view="${viewName}"]`);
  if (activeMenu) activeMenu.classList.add("active");
  
  const targetContainer = document.getElementById(`view-${viewName}`);
  if (targetContainer) targetContainer.classList.add("active");
  
  document.getElementById("notificationDrawer").classList.remove("open");
  
  // Atualizar dados antes de exibir telas com gráficos/tabelas
  if (viewName === "dashboard" || viewName === "financeiro" || viewName === "propostas" || viewName === "relatorios") {
    await fetchProposals();
  }

  if (viewName === "dashboard") {
    renderDashboard();
  } else if (viewName === "financeiro") {
    renderFinanceView();
  } else if (viewName === "propostas") {
    applyFilters();
  } else if (viewName === "relatorios") {
    generateReportData();
  }
}

function setupTheme() {
  const themeToggle = document.getElementById("themeToggleBtn");
  const savedTheme = localStorage.getItem("app_theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
  
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("app_theme", newTheme);
    updateThemeIcon(newTheme);
    updateAllCharts();
  });
}

function updateThemeIcon(theme) {
  const icon = document.getElementById("themeToggleBtn").querySelector(".material-symbols-outlined");
  if (theme === "dark") {
    icon.textContent = "light_mode";
  } else {
    icon.textContent = "dark_mode";
  }
}

/* ==========================================================================
   2. NOTIFICAÇÕES & ALERTAS
   ========================================================================== */

function setupNotifications() {
  const drawer = document.getElementById("notificationDrawer");
  const toggleBtn = document.getElementById("notificationToggleBtn");
  const closeBtn = document.getElementById("closeNotificationDrawerBtn");
  
  toggleBtn.addEventListener("click", () => {
    drawer.classList.toggle("open");
    renderNotificationsList();
  });
  
  closeBtn.addEventListener("click", () => {
    drawer.classList.remove("open");
  });
  
  renderNotificationsList();
}

function renderNotificationsList() {
  const listContainer = document.getElementById("notificationList");
  const badge = document.getElementById("notificationCount");
  
  const unreadCount = appState.notifications.filter(n => n.unread).length;
  badge.textContent = unreadCount;
  badge.style.display = unreadCount > 0 ? "flex" : "none";
  
  listContainer.innerHTML = "";
  if (appState.notifications.length === 0) {
    listContainer.innerHTML = `<div style="text-align:center; padding:32px; color:var(--md-sys-color-on-surface-variant);">Nenhuma notificação nova.</div>`;
    return;
  }
  
  appState.notifications.forEach(n => {
    const div = document.createElement("div");
    div.className = `notification-item ${n.unread ? 'unread' : ''}`;
    div.innerHTML = `
      <div>${n.text}</div>
      <div class="notification-time">${n.time}</div>
    `;
    div.addEventListener("click", () => {
      n.unread = false;
      renderNotificationsList();
      showToast("Notificação marcada como lida", "success");
    });
    listContainer.appendChild(div);
  });
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="material-symbols-outlined">
      ${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}
    </span>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ==========================================================================
   3. PESQUISA GLOBAL & AUTO-COMPLETE
   ========================================================================== */

function setupAutocompleteSearch() {
  const input = document.getElementById("globalSearchInput");
  const dropdown = document.getElementById("globalSearchDropdown");
  
  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      dropdown.style.display = "none";
      return;
    }
    
    const matches = appState.proposals.filter(p => 
      p.nrProposta.toLowerCase().includes(query) ||
      p.objeto.toLowerCase().includes(query) ||
      p.proponente.toLowerCase().includes(query) ||
      p.uf.toLowerCase().includes(query) ||
      (p.ministerio && p.ministerio.toLowerCase().includes(query))
    ).slice(0, 5);
    
    dropdown.innerHTML = "";
    if (matches.length === 0) {
      dropdown.innerHTML = `<div style="padding:10px 16px; font-size:12px; color:var(--md-sys-color-on-surface-variant)">Nenhum resultado encontrado</div>`;
    } else {
      matches.forEach(m => {
        const item = document.createElement("div");
        item.className = "autocomplete-item";
        item.innerHTML = `
          <span class="match-title">Nº ${m.nrProposta} - ${m.municipio}/${m.uf}</span>
          <span class="match-desc">${m.objeto.substring(0, 60)}...</span>
        `;
        item.addEventListener("click", () => {
          dropdown.style.display = "none";
          input.value = "";
          showProposalDetail(m.id);
        });
        dropdown.appendChild(item);
      });
    }
    dropdown.style.display = "block";
  });
  
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-box")) {
      dropdown.style.display = "none";
    }
  });
}

/* ==========================================================================
   4. DASHBOARD & GRÁFICOS (CHART.JS)
   ========================================================================== */

function renderDashboard() {
  const totalPropostas = appState.filteredProposals.length;
  const valorTotal = appState.filteredProposals.reduce((acc, curr) => acc + (curr.valorTotal || 0), 0);
  const contrapartidaTotal = appState.filteredProposals.reduce((acc, curr) => acc + (curr.valorContrapartida || 0), 0);
  const valorMedio = totalPropostas > 0 ? (valorTotal / totalPropostas) : 0;
  
  document.getElementById("kpi-total-propostas").textContent = totalPropostas;
  document.getElementById("kpi-valor-total").textContent = formatCurrency(valorTotal);
  document.getElementById("kpi-contrapartida-total").textContent = formatCurrency(contrapartidaTotal);
  document.getElementById("kpi-valor-medio").textContent = formatCurrency(valorMedio);
  
  updateGauges();
  updateDashboardCharts();
  renderInsights();
}

function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function updateGauges() {
  const total = appState.filteredProposals.length;
  if (total === 0) return;
  
  const habilitadas = appState.filteredProposals.filter(p => p.situacao === "HABILITADA" || p.situacao === "SELECIONADA").length;
  const selecionadas = appState.filteredProposals.filter(p => p.situacao === "SELECIONADA").length;
  
  const pctHabilitadas = Math.round((habilitadas / total) * 100);
  const pctSelecionadas = Math.round((selecionadas / total) * 100);
  
  document.getElementById("gaugeHabilitadasText").textContent = `${pctHabilitadas}%`;
  document.getElementById("gaugeHabilitadasPath").setAttribute("stroke-dasharray", `${pctHabilitadas}, 100`);
  
  document.getElementById("gaugeSelecionadasText").textContent = `${pctSelecionadas}%`;
  document.getElementById("gaugeSelecionadasPath").setAttribute("stroke-dasharray", `${pctSelecionadas}, 100`);
}

function updateDashboardCharts() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const textColor = isDark ? "#e3e3e3" : "#1f1f1f";
  const gridColor = isDark ? "#444746" : "#f1f3f4";
  
  const situacaoCounts = {};
  appState.filteredProposals.forEach(p => {
    situacaoCounts[p.situacao] = (situacaoCounts[p.situacao] || 0) + 1;
  });
  
  const sitLabels = Object.keys(situacaoCounts);
  const sitData = Object.values(situacaoCounts);
  const sitColors = sitLabels.map(s => {
    switch (s) {
      case "SELECIONADA": return "#1e88e5";
      case "HABILITADA": return "#2e7d32";
      case "NAO_HABILITADA": return "#d32f2f";
      case "EM_ANALISE": return "#ed6c02";
      case "CADASTRADA": return "#757575";
      case "ENVIADA": return "#9c27b0";
      default: return "#444444";
    }
  });

  if (appState.charts.situacao) appState.charts.situacao.destroy();
  const ctxSit = document.getElementById("chartSituacao").getContext("2d");
  appState.charts.situacao = new Chart(ctxSit, {
    type: 'doughnut',
    data: {
      labels: sitLabels,
      datasets: [{
        data: sitData,
        backgroundColor: sitColors,
        borderWidth: 2,
        borderColor: isDark ? "#1e1f20" : "#ffffff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor } }
      }
    }
  });

  const progCounts = {};
  appState.filteredProposals.forEach(p => {
    const prog = p.programa || "Outros";
    progCounts[prog] = (progCounts[prog] || 0) + 1;
  });
  
  const progLabels = Object.keys(progCounts).map(l => l.length > 25 ? l.substring(0, 25) + "..." : l);
  const progData = Object.values(progCounts);

  if (appState.charts.programas) appState.charts.programas.destroy();
  const ctxProg = document.getElementById("chartProgramas").getContext("2d");
  appState.charts.programas = new Chart(ctxProg, {
    type: 'bar',
    data: {
      labels: progLabels,
      datasets: [{
        label: 'Qtd de Propostas',
        data: progData,
        backgroundColor: '#0b57d0',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor } },
        y: { grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 } }
      }
    }
  });

  const anosCounts = {};
  appState.filteredProposals.forEach(p => {
    const ano = p.ano || 2023;
    anosCounts[ano] = (anosCounts[ano] || 0) + p.valorTotal;
  });
  
  const anosLabels = Object.keys(anosCounts).sort();
  const anosData = anosLabels.map(a => anosCounts[a]);

  if (appState.charts.evolucao) appState.charts.evolucao.destroy();
  const ctxEv = document.getElementById("chartEvolucao").getContext("2d");
  appState.charts.evolucao = new Chart(ctxEv, {
    type: 'line',
    data: {
      labels: anosLabels,
      datasets: [{
        label: 'Investimento Anual (R$)',
        data: anosData,
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        fill: true,
        tension: 0.3,
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: textColor } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor } },
        y: { 
          grid: { color: gridColor }, 
          ticks: { 
            color: textColor,
            callback: value => 'R$ ' + (value / 1e6) + 'M'
          } 
        }
      }
    }
  });
}

function updateAllCharts() {
  if (appState.currentView === "dashboard") {
    updateDashboardCharts();
  } else if (appState.currentView === "financeiro") {
    renderFinanceView();
  }
}

function renderInsights() {
  const items = appState.filteredProposals;
  if (items.length === 0) {
    document.getElementById("insight-maior-investimento").innerHTML = "Nenhuma proposta";
    document.getElementById("insight-uf-recursos").innerHTML = "Nenhuma proposta";
    document.getElementById("insight-media-contrapartida").innerHTML = "Nenhuma proposta";
    return;
  }
  
  const maior = items.reduce((prev, current) => (prev.valorTotal > current.valorTotal) ? prev : current);
  document.getElementById("insight-maior-investimento").innerHTML = `${formatCurrency(maior.valorTotal)} <br> <small style="color:var(--md-sys-color-on-surface-variant); font-size:11px;">Prop: ${maior.proponente}</small>`;
  
  const ufMap = {};
  items.forEach(p => {
    ufMap[p.uf] = (ufMap[p.uf] || 0) + p.valorTotal;
  });
  let topUF = "";
  let maxRecurso = 0;
  Object.keys(ufMap).forEach(uf => {
    if (ufMap[uf] > maxRecurso) {
      maxRecurso = ufMap[uf];
      topUF = uf;
    }
  });
  document.getElementById("insight-uf-recursos").innerHTML = `${topUF || 'N/A'} - ${formatCurrency(maxRecurso)}`;
  
  const totalVal = items.reduce((acc, curr) => acc + curr.valorTotal, 0);
  const totalContra = items.reduce((acc, curr) => acc + curr.valorContrapartida, 0);
  const pctMedia = totalVal > 0 ? ((totalContra / totalVal) * 100).toFixed(2) : 0;
  document.getElementById("insight-media-contrapartida").innerHTML = `${pctMedia}% <br> <small style="color:var(--md-sys-color-on-surface-variant); font-size:11px;">Média nacional de contrapartidas</small>`;
}

/* ==========================================================================
   5. PAINEL FINANCEIRO
   ========================================================================== */

function renderFinanceView() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const textColor = isDark ? "#e3e3e3" : "#1f1f1f";
  const gridColor = isDark ? "#444746" : "#f1f3f4";
  const items = appState.filteredProposals;

  const minMap = {};
  items.forEach(p => {
    const min = p.ministerio || "Outros";
    minMap[min] = (minMap[min] || 0) + p.valorTotal;
  });
  
  if (appState.charts.financeiroMinisterios) appState.charts.financeiroMinisterios.destroy();
  const ctxMin = document.getElementById("chartFinanceiroMinisterios").getContext("2d");
  appState.charts.financeiroMinisterios = new Chart(ctxMin, {
    type: 'pie',
    data: {
      labels: Object.keys(minMap),
      datasets: [{
        data: Object.values(minMap),
        backgroundColor: ['#0b57d0', '#2e7d32', '#ed6c02', '#9c27b0', '#e53935', '#00acc1']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: textColor } }
      }
    }
  });

  const propMap = {};
  items.forEach(p => {
    propMap[p.proponente] = (propMap[p.proponente] || 0) + p.valorTotal;
  });
  const sortedProps = Object.keys(propMap).sort((a,b) => propMap[b] - propMap[a]).slice(0, 5);
  const propVals = sortedProps.map(pr => propMap[pr]);

  if (appState.charts.financeiroProponentes) appState.charts.financeiroProponentes.destroy();
  const ctxProp = document.getElementById("chartFinanceiroProponentes").getContext("2d");
  appState.charts.financeiroProponentes = new Chart(ctxProp, {
    type: 'bar',
    data: {
      labels: sortedProps.map(l => l.length > 20 ? l.substring(0, 20) + "..." : l),
      datasets: [{
        label: 'Volume Financeiro (R$)',
        data: propVals,
        backgroundColor: '#ed6c02',
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { 
          grid: { color: gridColor }, 
          ticks: { 
            color: textColor,
            callback: value => 'R$ ' + (value / 1e6) + 'M'
          } 
        },
        y: { ticks: { color: textColor } }
      }
    }
  });

  const sitFinMap = {};
  items.forEach(p => {
    sitFinMap[p.situacao] = (sitFinMap[p.situacao] || 0) + p.valorTotal;
  });

  if (appState.charts.financeiroSituacoes) appState.charts.financeiroSituacoes.destroy();
  const ctxSitFin = document.getElementById("chartFinanceiroSituacoes").getContext("2d");
  appState.charts.financeiroSituacoes = new Chart(ctxSitFin, {
    type: 'bar',
    data: {
      labels: Object.keys(sitFinMap),
      datasets: [{
        label: 'Valor Total Acumulado (R$)',
        data: Object.values(sitFinMap),
        backgroundColor: '#1e88e5',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor } },
        y: { 
          grid: { color: gridColor }, 
          ticks: { 
            color: textColor,
            callback: value => 'R$ ' + (value / 1e6) + 'M'
          } 
        }
      }
    }
  });
}

/* ==========================================================================
   6. TABELA E FILTROS AVANÇADOS
   ========================================================================== */

function toggleFiltersPanel() {
  const panel = document.getElementById("filtersBody");
  const icon = document.getElementById("filterToggleIcon");
  
  if (panel.style.display === "none" || panel.style.display === "") {
    panel.style.display = "grid";
    icon.textContent = "expand_less";
  } else {
    panel.style.display = "none";
    icon.textContent = "expand_more";
  }
}

function applyFilters() {
  const nr = document.getElementById("filterNrProposta").value.trim().toLowerCase();
  const sit = document.getElementById("filterSituacao").value;
  const uf = document.getElementById("filterUF").value;
  const min = document.getElementById("filterMinisterio").value;
  const ano = document.getElementById("filterAno").value;
  
  appState.filteredProposals = appState.proposals.filter(p => {
    if (nr && !p.nrProposta.toLowerCase().includes(nr)) return false;
    if (sit && p.situacao !== sit) return false;
    if (uf && p.uf !== uf) return false;
    if (min && p.ministerio !== min) return false;
    if (ano && p.ano.toString() !== ano) return false;
    return true;
  });
  
  appState.currentPage = 1;
  renderTable();
}

function clearFilters() {
  document.getElementById("filterNrProposta").value = "";
  document.getElementById("filterSituacao").value = "";
  document.getElementById("filterUF").value = "";
  document.getElementById("filterMinisterio").value = "";
  document.getElementById("filterAno").value = "";
  
  appState.filteredProposals = [...appState.proposals];
  appState.currentPage = 1;
  renderTable();
  showToast("Filtros limpos com sucesso", "success");
}

function saveFavoriteFilter() {
  const filterObj = {
    nr: document.getElementById("filterNrProposta").value,
    sit: document.getElementById("filterSituacao").value,
    uf: document.getElementById("filterUF").value,
    min: document.getElementById("filterMinisterio").value,
    ano: document.getElementById("filterAno").value
  };
  localStorage.setItem("transferegov_favorite_filter", JSON.stringify(filterObj));
  showToast("Filtro favoritado e salvo no navegador!", "success");
}

function renderTable() {
  const tbody = document.getElementById("proposalsTableBody");
  tbody.innerHTML = "";
  
  const sorted = [...appState.filteredProposals].sort((a, b) => {
    let valA = a[appState.sortColumn];
    let valB = b[appState.sortColumn];
    
    if (typeof valA === "string") {
      return appState.sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      return appState.sortDirection === "asc" ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    }
  });
  
  const total = sorted.length;
  const startIdx = (appState.currentPage - 1) * appState.pageSize;
  const endIdx = Math.min(startIdx + appState.pageSize, total);
  const pageItems = sorted.slice(startIdx, endIdx);
  
  document.getElementById("paginationInfo").textContent = `Mostrando ${total > 0 ? startIdx + 1 : 0}-${endIdx} de ${total} propostas`;
  
  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 24px; color: var(--md-sys-color-on-surface-variant);">Nenhuma proposta localizada.</td></tr>`;
    return;
  }
  
  pageItems.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight:600; color:var(--md-sys-color-primary); cursor:pointer;" onclick="showProposalDetail(${p.id})">${p.nrProposta}</td>
      <td title="${p.objeto}">${p.objeto.length > 30 ? p.objeto.substring(0, 30) + '...' : p.objeto}</td>
      <td>${p.proponente.length > 25 ? p.proponente.substring(0, 25) + '...' : p.proponente}</td>
      <td>${p.uf}</td>
      <td><span class="status-badge ${p.situacao.toLowerCase()}">${p.situacao.replace('_', ' ')}</span></td>
      <td>${formatCurrency(p.valorTotal)}</td>
      <td>${formatCurrency(p.valorContrapartida)}</td>
      <td class="col-actions">
        <div style="display:flex; gap:4px;">
          <button class="btn-icon btn-sm" onclick="showProposalDetail(${p.id})" title="Visualizar Detalhes">
            <span class="material-symbols-outlined" style="font-size:16px;">visibility</span>
          </button>
          <button class="btn-icon btn-sm" onclick="editProposal(${p.id})" title="Editar Cadastro">
            <span class="material-symbols-outlined" style="font-size:16px;">edit</span>
          </button>
          <button class="btn-icon btn-sm" onclick="duplicateProposal(${p.id})" title="Duplicar Proposta">
            <span class="material-symbols-outlined" style="font-size:16px;">content_copy</span>
          </button>
          <button class="btn-icon btn-sm" onclick="triggerDeleteProposal(${p.id}, '${p.nrProposta}')" title="Excluir Proposta">
            <span class="material-symbols-outlined" style="font-size:16px; color:var(--md-sys-color-error);">delete</span>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function sortTable(column) {
  if (appState.sortColumn === column) {
    appState.sortDirection = appState.sortDirection === "asc" ? "desc" : "asc";
  } else {
    appState.sortColumn = column;
    appState.sortDirection = "asc";
  }
  renderTable();
}

function prevPage() {
  if (appState.currentPage > 1) {
    appState.currentPage--;
    renderTable();
  }
}

function nextPage() {
  const total = appState.filteredProposals.length;
  const maxPage = Math.ceil(total / appState.pageSize);
  if (appState.currentPage < maxPage) {
    appState.currentPage++;
    renderTable();
  }
}

/* ==========================================================================
   7. FORMULÁRIO DE CADASTRO / EDIÇÃO
   ========================================================================== */

// Parâmetros administrativos simulados no backend para popular selects
const APP_CONFIG = {
  users: [
    { id: 1, name: "Ricardo Fonseca", email: "ricardo@gestao.gov.br", role: "Administrador", status: "Ativo" },
    { id: 2, name: "Mariana Costa", email: "mariana@gestao.gov.br", role: "Analista", status: "Ativo" },
    { id: 3, name: "Thiago Santos", email: "thiago@gestao.gov.br", role: "Gestor", status: "Ativo" }
  ],
  programs: [
    "Apoio a Projetos de Desenvolvimento Urbano",
    "Estruturação da Rede de Atenção Básica",
    "Gestão de Riscos e Prevenção de Desastres",
    "Implantação de Infraestrutura Esportiva",
    "Fortalecimento do Sistema Único de Saúde (SUS)",
    "Pró-Infância - Construção de Escolas",
    "Fomento ao Setor Agropecuário",
    "Apoio a Redes de Atenção Psicossocial"
  ],
  ministries: [
    "Cidades",
    "Saúde",
    "Educação",
    "Esporte",
    "Desenvolvimento Agrário"
  ],
  orgaos: [
    "MINISTERIO DAS CIDADES",
    "MINISTERIO DA SAUDE",
    "MINISTERIO DA EDUCACAO",
    "MINISTERIO DO ESPORTE",
    "MINISTERIO DO DESENVOLVIMENTO AGRARIO"
  ]
};

function populateDropdowns() {
  const progSelect = document.getElementById("form-programa");
  const minSelect = document.getElementById("form-ministerio");
  
  progSelect.innerHTML = `<option value="">Selecione o programa</option>`;
  minSelect.innerHTML = `<option value="">Selecione o ministério</option>`;
  
  APP_CONFIG.programs.forEach(p => {
    progSelect.innerHTML += `<option value="${p}">${p}</option>`;
  });
  
  APP_CONFIG.ministries.forEach(m => {
    minSelect.innerHTML += `<option value="${m}">${m}</option>`;
  });
}

function populateOrgaos() {
  const minSelected = document.getElementById("form-ministerio").value;
  const orgaoSelect = document.getElementById("form-orgao");
  orgaoSelect.innerHTML = `<option value="">Selecione o órgão</option>`;
  
  if (!minSelected) return;
  
  const matches = APP_CONFIG.orgaos.filter(o => o.includes(minSelected.toUpperCase()));
  if (matches.length > 0) {
    matches.forEach(m => {
      orgaoSelect.innerHTML += `<option value="${m}" selected>${m}</option>`;
    });
  } else {
    const generic = `SUPERINTENDENCIA DE RECURSOS - MINISTERIO DE ${minSelected.toUpperCase()}`;
    orgaoSelect.innerHTML += `<option value="${generic}" selected>${generic}</option>`;
  }
}

function calculateFinancials() {
  const transferencia = parseFloat(document.getElementById("form-valorTransferencia").value) || 0;
  const contrapartida = parseFloat(document.getElementById("form-valorContrapartida").value) || 0;
  const totalInput = document.getElementById("form-valorTotal");
  
  const total = transferencia + contrapartida;
  totalInput.value = formatCurrency(total);
}

// Rascunho
const formInputs = ["form-nrProposta", "form-programa", "form-objeto", "form-justificativa", "form-proponente", "form-cnpj", "form-municipio", "form-uf", "form-valorTransferencia", "form-valorContrapartida", "form-responsavel"];
formInputs.forEach(id => {
  const input = document.getElementById(id);
  if (input) {
    input.addEventListener("input", () => {
      if (document.getElementById("configAutoSave").checked) {
        saveFormDraft();
      }
    });
  }
});

function saveFormDraft() {
  const draft = {};
  formInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) draft[id] = el.value;
  });
  localStorage.setItem("transferegov_form_draft", JSON.stringify(draft));
}

function checkFormDraft() {
  const draftData = localStorage.getItem("transferegov_form_draft");
  if (draftData && document.getElementById("configAutoSave").checked) {
    const draft = JSON.parse(draftData);
    formInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el && draft[id]) el.value = draft[id];
    });
    calculateFinancials();
    showToast("Rascunho de proposta recuperado", "success");
  }
}

function clearFormDraft() {
  localStorage.removeItem("transferegov_form_draft");
}

async function saveProposalForm(event) {
  event.preventDefault();
  
  const idVal = document.getElementById("form-id").value;
  const transVal = parseFloat(document.getElementById("form-valorTransferencia").value) || 0;
  const contraVal = parseFloat(document.getElementById("form-valorContrapartida").value) || 0;
  
  const proposalData = {
    nrProposta: document.getElementById("form-nrProposta").value,
    programa: document.getElementById("form-programa").value,
    objeto: document.getElementById("form-objeto").value,
    justificativa: document.getElementById("form-justificativa").value,
    proponente: document.getElementById("form-proponente").value,
    cnpj: document.getElementById("form-cnpj").value,
    municipio: document.getElementById("form-municipio").value,
    uf: document.getElementById("form-uf").value,
    ministerio: document.getElementById("form-ministerio").value,
    orgaoConcedente: document.getElementById("form-orgao").value,
    modalidade: document.getElementById("form-modalidade").value,
    situacao: document.getElementById("form-situacao").value,
    valorTransferencia: transVal,
    valorContrapartida: contraVal,
    ano: parseInt(document.getElementById("form-ano").value) || 2026,
    responsavel: document.getElementById("form-responsavel").value,
    telefone: document.getElementById("form-telefone").value,
    email: document.getElementById("form-email").value,
    observacoes: document.getElementById("form-observacoes").value,
    dataCadastro: idVal ? appState.proposals.find(p => p.id === parseInt(idVal)).dataCadastro : new Date().toISOString().split('T')[0]
  };

  try {
    let res;
    if (idVal) {
      // Atualização (PUT)
      res = await fetch(`/api/proposals/${idVal}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposalData)
      });
    } else {
      // Inserção (POST)
      res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposalData)
      });
    }

    if (!res.ok) throw new Error('Falha ao salvar proposta no servidor.');
    
    showToast(idVal ? "Proposta editada com sucesso!" : "Proposta cadastrada!", "success");
    
    clearFormDraft();
    document.getElementById("proposalForm").reset();
    await fetchProposals();
    switchView("propostas");
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function cancelForm() {
  clearFormDraft();
  document.getElementById("proposalForm").reset();
  switchView("propostas");
}

function editProposal(id) {
  const p = appState.proposals.find(p => p.id === id);
  if (!p) return;
  
  document.getElementById("cadastro-form-title").textContent = `Editar Proposta Nº ${p.nrProposta}`;
  document.getElementById("form-id").value = p.id;
  document.getElementById("form-nrProposta").value = p.nrProposta;
  document.getElementById("form-programa").value = p.programa;
  document.getElementById("form-objeto").value = p.objeto;
  document.getElementById("form-justificativa").value = p.justificativa;
  document.getElementById("form-proponente").value = p.proponente;
  document.getElementById("form-cnpj").value = p.cnpj;
  document.getElementById("form-municipio").value = p.municipio;
  document.getElementById("form-uf").value = p.uf;
  document.getElementById("form-ministerio").value = p.ministerio;
  
  populateOrgaos();
  document.getElementById("form-orgao").value = p.orgaoConcedente;
  document.getElementById("form-modalidade").value = p.modalidade;
  document.getElementById("form-situacao").value = p.situacao;
  document.getElementById("form-valorTransferencia").value = p.valorTransferencia || 0;
  document.getElementById("form-valorContrapartida").value = p.valorContrapartida || 0;
  document.getElementById("form-ano").value = p.ano;
  document.getElementById("form-responsavel").value = p.responsavel;
  document.getElementById("form-telefone").value = p.telefone || "";
  document.getElementById("form-email").value = p.email || "";
  document.getElementById("form-observacoes").value = p.observacoes || "";
  
  calculateFinancials();
  switchView("cadastro");
}

function duplicateProposal(id) {
  const p = appState.proposals.find(p => p.id === id);
  if (!p) return;
  
  document.getElementById("cadastro-form-title").textContent = "Cadastrar Nova Proposta (Cópia)";
  document.getElementById("form-id").value = "";
  
  const parts = p.nrProposta.split('/');
  const randomNr = Math.floor(Math.random() * 10000);
  document.getElementById("form-nrProposta").value = `${randomNr}/${parts[1] || '2026'}`;
  
  document.getElementById("form-programa").value = p.programa;
  document.getElementById("form-objeto").value = p.objeto;
  document.getElementById("form-justificativa").value = p.justificativa;
  document.getElementById("form-proponente").value = p.proponente;
  document.getElementById("form-cnpj").value = p.cnpj;
  document.getElementById("form-municipio").value = p.municipio;
  document.getElementById("form-uf").value = p.uf;
  document.getElementById("form-ministerio").value = p.ministerio;
  
  populateOrgaos();
  document.getElementById("form-orgao").value = p.orgaoConcedente;
  document.getElementById("form-modalidade").value = p.modalidade;
  document.getElementById("form-situacao").value = p.situacao;
  document.getElementById("form-valorTransferencia").value = p.valorTransferencia || 0;
  document.getElementById("form-valorContrapartida").value = p.valorContrapartida || 0;
  document.getElementById("form-ano").value = p.ano;
  document.getElementById("form-responsavel").value = p.responsavel;
  document.getElementById("form-telefone").value = p.telefone || "";
  document.getElementById("form-email").value = p.email || "";
  document.getElementById("form-observacoes").value = p.observacoes || "";
  
  calculateFinancials();
  switchView("cadastro");
  showToast("Dados copiados. Defina um novo número de proposta.", "info");
}

/* ==========================================================================
   8. EXCLUSÃO COM CONFIRMAÇÃO MODAL
   ========================================================================== */

function triggerDeleteProposal(id, nr) {
  appState.activeProposalIdForDelete = id;
  document.getElementById("deleteProposalMeta").textContent = `Proposta Nº: ${nr}`;
  document.getElementById("confirmDeleteModal").classList.add("open");
}

function closeConfirmDeleteModal() {
  document.getElementById("confirmDeleteModal").classList.remove("open");
  appState.activeProposalIdForDelete = null;
}

document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
  const id = appState.activeProposalIdForDelete;
  if (!id) return;
  
  try {
    const res = await fetch(`/api/proposals/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir proposta no servidor.');
    
    showToast("Proposta permanentemente excluída.", "success");
    closeConfirmDeleteModal();
    await fetchProposals();
    renderTable();
    if (appState.currentView === "dashboard") renderDashboard();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

/* ==========================================================================
   9. DETALHAMENTO DA PROPOSTA (TABS E TIMELINE)
   ========================================================================== */

function showProposalDetail(id) {
  const p = appState.proposals.find(p => p.id === id);
  if (!p) return;
  
  appState.activeDetailProposal = p;
  
  document.getElementById("detalhe-titulo").textContent = `Detalhamento da Proposta: ${p.nrProposta}`;
  
  document.getElementById("det-nrProposta").textContent = p.nrProposta;
  document.getElementById("det-situacao").innerHTML = `<span class="status-badge ${p.situacao.toLowerCase()}">${p.situacao.replace('_', ' ')}</span>`;
  document.getElementById("det-objeto").textContent = p.objeto;
  document.getElementById("det-justificativa").textContent = p.justificativa;
  document.getElementById("det-proponente").textContent = p.proponente;
  document.getElementById("det-cnpj").textContent = p.cnpj;
  document.getElementById("det-localidade").textContent = `${p.municipio} / ${p.uf}`;
  document.getElementById("det-ministerio").textContent = p.ministerio;
  document.getElementById("det-orgao").textContent = p.orgaoConcedente;
  document.getElementById("det-modalidade").textContent = p.modalidade;
  document.getElementById("det-responsavel").textContent = p.responsavel;
  document.getElementById("det-telefone").textContent = p.telefone || "Não informado";
  document.getElementById("det-email").textContent = p.email || "Não informado";
  document.getElementById("det-dataCadastro").textContent = p.dataCadastro;
  document.getElementById("det-observacoes").textContent = p.observacoes || "Nenhuma observação cadastrada.";
  
  const pctContra = p.valorTotal > 0 ? ((p.valorContrapartida / p.valorTotal) * 100).toFixed(1) : 0;
  
  document.getElementById("det-fin-valorTotal").textContent = formatCurrency(p.valorTotal);
  document.getElementById("det-fin-contrapartida").textContent = formatCurrency(p.valorContrapartida);
  document.getElementById("det-fin-pctContrapartida").textContent = `${pctContra}%`;
  document.getElementById("det-fin-solicitado").textContent = formatCurrency(p.valorTransferencia);
  
  const finTable = document.getElementById("detalheFinanceiroTableBody");
  finTable.innerHTML = `
    <tr>
      <td>Parcela Única (União)</td>
      <td>Previsão 60 dias</td>
      <td>${formatCurrency(p.valorTransferencia)}</td>
      <td><span class="status-badge ${p.situacao === 'SELECIONADA' ? 'selecionada' : 'cadastrada'}">${p.situacao === 'SELECIONADA' ? 'Aprovada' : 'Pendente'}</span></td>
    </tr>
    <tr>
      <td>Contrapartida Proponente</td>
      <td>No ato da assinatura</td>
      <td>${formatCurrency(p.valorContrapartida)}</td>
      <td><span class="status-badge habilitada">Aprovada</span></td>
    </tr>
  `;

  const histTable = document.getElementById("detalheHistoricoTableBody");
  histTable.innerHTML = `
    <tr>
      <td>Ricardo Fonseca</td>
      <td>${p.dataCadastro} 10:24</td>
      <td>Criação</td>
      <td>Cadastro inicial da proposta no portal TransfereGov</td>
    </tr>
    <tr>
      <td>Sistema Central</td>
      <td>${p.dataCadastro} 10:25</td>
      <td>Auditoria</td>
      <td>Validação de restrições do CAUC realizada eletronicamente. Status: Habilitada.</td>
    </tr>
  `;

  updateStepperTimeline(p.situacao);
  switchDetailTab('detalhe-geral');
  switchView("detalhe");
}

function switchDetailTab(tabId) {
  document.querySelectorAll("#view-detalhe .tab-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll("#view-detalhe .tab-content").forEach(content => content.classList.remove("active"));
  
  const btn = Array.from(document.querySelectorAll("#view-detalhe .tab-btn")).find(b => b.getAttribute("onclick").includes(tabId));
  if (btn) btn.classList.add("active");
  
  const content = document.getElementById(tabId);
  if (content) content.classList.add("active");
}

function updateStepperTimeline(situacao) {
  const steps = ["CADASTRADA", "ENVIADA", "EM_ANALISE", "HABILITADA", "SELECIONADA"];
  const currentIdx = steps.indexOf(situacao);
  const progressPercent = currentIdx !== -1 ? (currentIdx / (steps.length - 1)) * 100 : 0;
  
  document.getElementById("stepperProgress").style.width = `${progressPercent}%`;
  
  steps.forEach((step, idx) => {
    const el = document.getElementById(`step-${step}`);
    if (!el) return;
    el.classList.remove("active", "completed");
    
    if (idx < currentIdx) {
      el.classList.add("completed");
    } else if (idx === currentIdx) {
      el.classList.add("active");
    }
  });
}

function setupDragAndDrop() {
  const dropzone = document.getElementById("fileDropzone");
  const fileInput = document.getElementById("fileInput");
  
  dropzone.addEventListener("click", () => fileInput.click());
  
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });
  
  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });
  
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  });
  
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      handleFiles(fileInput.files);
    }
  });
}

function handleFiles(files) {
  const fileList = document.getElementById("uploadedFileList");
  Array.from(files).forEach(f => {
    const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
    const li = document.createElement("li");
    li.className = "file-item";
    li.innerHTML = `
      <span style="display:flex; align-items:center; gap:8px;">
        <span class="material-symbols-outlined" style="color:var(--md-sys-color-primary)">draft</span>
        ${f.name} (${sizeMB} MB)
      </span>
      <button class="btn btn-outline btn-sm" onclick="downloadMockFile('${f.name}')">Download</button>
    `;
    fileList.appendChild(li);
  });
  showToast("Documento anexado com sucesso!", "success");
}

function downloadMockFile(name) {
  showToast(`Iniciando download do arquivo: ${name}`, "success");
}

/* ==========================================================================
   10. RELATÓRIOS E EXPORTAÇÕES
   ========================================================================== */

function generateReportData() {
  const repType = document.getElementById("reportType").value;
  const min = document.getElementById("reportMinisterio").value;
  
  const header = document.getElementById("reportTableHeader");
  const body = document.getElementById("reportTableBody");
  
  const filtered = appState.proposals.filter(p => !min || p.ministerio === min);
  
  body.innerHTML = "";
  
  if (repType === "analitico") {
    header.innerHTML = `
      <tr>
        <th>Nº Proposta</th>
        <th>Objeto</th>
        <th>Proponente</th>
        <th>UF</th>
        <th>Situação</th>
        <th>Valor Total</th>
      </tr>
    `;
    
    filtered.forEach(p => {
      body.innerHTML += `
        <tr>
          <td>${p.nrProposta}</td>
          <td>${p.objeto}</td>
          <td>${p.proponente}</td>
          <td>${p.uf}</td>
          <td><span class="status-badge ${p.situacao.toLowerCase()}">${p.situacao.replace('_', ' ')}</span></td>
          <td>${formatCurrency(p.valorTotal)}</td>
        </tr>
      `;
    });
  } else if (repType === "financeiro") {
    header.innerHTML = `
      <tr>
        <th>Ministério</th>
        <th>Qtd Propostas</th>
        <th>Total Transferência (R$)</th>
        <th>Total Contrapartida (R$)</th>
        <th>Total Investimento (R$)</th>
      </tr>
    `;
    
    const minMap = {};
    filtered.forEach(p => {
      if (!minMap[p.ministerio]) {
        minMap[p.ministerio] = { qtd: 0, trans: 0, contra: 0, total: 0 };
      }
      minMap[p.ministerio].qtd++;
      minMap[p.ministerio].trans += p.valorTransferencia;
      minMap[p.ministerio].contra += p.valorContrapartida;
      minMap[p.ministerio].total += p.valorTotal;
    });
    
    Object.keys(minMap).forEach(key => {
      const item = minMap[key];
      body.innerHTML += `
        <tr>
          <td><strong>${key}</strong></td>
          <td>${item.qtd}</td>
          <td>${formatCurrency(item.trans)}</td>
          <td>${formatCurrency(item.contra)}</td>
          <td>${formatCurrency(item.total)}</td>
        </tr>
      `;
    });
  } else {
    header.innerHTML = `
      <tr>
        <th>Situação da Proposta</th>
        <th>Qtd Propostas</th>
        <th>Porcentagem (%)</th>
        <th>Volume Orçamentário (R$)</th>
      </tr>
    `;
    
    const sitMap = {};
    filtered.forEach(p => {
      if (!sitMap[p.situacao]) {
        sitMap[p.situacao] = { qtd: 0, val: 0 };
      }
      sitMap[p.situacao].qtd++;
      sitMap[p.situacao].val += p.valorTotal;
    });
    
    Object.keys(sitMap).forEach(key => {
      const item = sitMap[key];
      const pct = filtered.length > 0 ? ((item.qtd / filtered.length) * 100).toFixed(1) : 0;
      body.innerHTML += `
        <tr>
          <td><span class="status-badge ${key.toLowerCase()}">${key.replace('_', ' ')}</span></td>
          <td>${item.qtd}</td>
          <td>${pct}%</td>
          <td>${formatCurrency(item.val)}</td>
        </tr>
      `;
    });
  }
}

function exportReport(format) {
  showToast(`Relatório exportado com sucesso no formato ${format.toUpperCase()}`, "success");
}

/* ==========================================================================
   11. ADMINISTRAÇÃO E IMPORTAÇÃO
   ========================================================================== */

function renderAdminUsers() {
  const tbody = document.getElementById("adminUsersTableBody");
  tbody.innerHTML = "";
  
  APP_CONFIG.users.forEach(u => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td><span class="status-badge habilitada">${u.status}</span></td>
      </tr>
    `;
  });
}

// IMPORTAR DADOS DE CSV DO BACKEND
async function importCsvData() {
  const fileInput = document.getElementById("importCsvInput");
  const file = fileInput.files[0];
  
  if (!file) {
    showToast("Por favor, selecione um arquivo CSV para importar.", "error");
    return;
  }

  const formData = new FormData();
  formData.append("csvfile", file);

  try {
    const res = await fetch("/api/proposals/import", {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Falha no servidor ao importar planilha.");
    const result = await res.json();
    
    showToast(result.message, "success");
    fileInput.value = "";
    
    // Atualizar propostas do app
    await fetchProposals();
    renderTable();
  } catch (error) {
    showToast(error.message, "error");
  }
}

function addMinistryConfig() {
  const val = document.getElementById("newMinistryInput").value.trim();
  if (!val) return;
  
  if (!APP_CONFIG.ministries.includes(val)) {
    APP_CONFIG.ministries.push(val);
    APP_CONFIG.orgaos.push(`MINISTERIO DE ${val.toUpperCase()}`);
    populateDropdowns();
    document.getElementById("newMinistryInput").value = "";
    showToast(`Ministério '${val}' adicionado!`, "success");
  }
}

function addProgramConfig() {
  const val = document.getElementById("newProgramInput").value.trim();
  if (!val) return;
  
  if (!APP_CONFIG.programs.includes(val)) {
    APP_CONFIG.programs.push(val);
    populateDropdowns();
    document.getElementById("newProgramInput").value = "";
    showToast(`Programa '${val}' adicionado!`, "success");
  }
}

function saveGeneralSettings() {
  const pageSize = parseInt(document.getElementById("configPageSize").value) || 10;
  appState.pageSize = pageSize;
  showToast("Configurações salvas!", "success");
  switchView("dashboard");
}

async function resetDatabaseToDefault() {
  try {
    const res = await fetch('/api/config/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Falha ao restaurar banco de dados no servidor.');
    
    await fetchProposals();
    showToast("Banco de dados restaurado!", "success");
    switchView("dashboard");
  } catch (error) {
    showToast(error.message, 'error');
  }
}
