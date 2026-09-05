/* =========================================================================
   Doce Encantos - Painel administrativo - funções compartilhadas
   ========================================================================= */

(function (global) {
  "use strict";

  function guard() {
    DE.Auth.requireLogin("login.html");
  }

  function wireShell() {
    var logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        DE.Auth.logout();
        window.location.href = "login.html";
      });
    }
  }

  // Gera um gráfico de barras simples em HTML/CSS a partir de [{label, value}]
  function buildBarChart(data) {
    var max = Math.max.apply(null, data.map(function (d) { return d.value; }).concat([1]));
    return data.map(function (d) {
      var pct = max > 0 ? Math.round((d.value / max) * 100) : 0;
      return (
        '<div class="bar-wrap">' +
          '<div class="bar-value">' + DE.util.formatBRL(d.value) + '</div>' +
          '<div class="bar" style="height:' + Math.max(pct, 2) + '%"></div>' +
          '<div class="bar-label">' + d.label + '</div>' +
        '</div>'
      );
    }).join("");
  }

  function statusBadge(status) {
    var cls = "badge-neutral";
    if (status === "Pago") cls = "badge-success";
    else if (status === "Pendente") cls = "badge-warning";
    else if (status === "Entregue") cls = "badge-info";
    else if (status === "Cancelado") cls = "badge-danger";
    return '<span class="badge ' + cls + '">' + status + "</span>";
  }

  function last7Days() {
    var days = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  }

  function sameDay(iso, date) {
    return new Date(iso).toDateString() === date.toDateString();
  }

  global.ADMIN = {
    guard: guard,
    wireShell: wireShell,
    buildBarChart: buildBarChart,
    statusBadge: statusBadge,
    last7Days: last7Days,
    sameDay: sameDay,
  };
})(window);
