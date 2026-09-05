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

  // Lê um arquivo de imagem escolhido pelo usuário, redimensiona (mantendo
  // proporção) para no máximo maxDim px no maior lado e recomprime como
  // JPEG na qualidade informada. Isso mantém as fotos pequenas o bastante
  // para caber com folga no localStorage do navegador (que tem espaço
  // limitado, tipicamente alguns MB por site).
  function compressImage(file, maxDim, quality) {
    return new Promise(function (resolve, reject) {
      if (!file || file.type.indexOf("image/") !== 0) {
        reject(new Error("Arquivo não é uma imagem"));
        return;
      }
      var reader = new FileReader();
      reader.onerror = function () { reject(reader.error || new Error("Falha ao ler arquivo")); };
      reader.onload = function (e) {
        var img = new Image();
        img.onerror = function () { reject(new Error("Falha ao carregar imagem")); };
        img.onload = function () {
          var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          var canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          try {
            resolve(canvas.toDataURL("image/jpeg", quality || 0.72));
          } catch (err) {
            reject(err);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  global.ADMIN = {
    guard: guard,
    wireShell: wireShell,
    buildBarChart: buildBarChart,
    statusBadge: statusBadge,
    last7Days: last7Days,
    sameDay: sameDay,
    compressImage: compressImage,
  };
})(window);
