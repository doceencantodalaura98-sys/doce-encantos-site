/* =========================================================================
   Doce Encantos - Camada de dados (localStorage)
   Usado pela loja (index.html) e pelo painel administrativo (admin/*.html)
   =========================================================================
   OBS: Este site é 100% front-end. Não existe servidor/banco de dados real.
   Todos os dados (produtos, pedidos, caixa, configurações) ficam guardados
   no localStorage do NAVEGADOR onde o site está aberto. Isso significa que:
     - Os dados NÃO são compartilhados entre computadores/celulares diferentes.
     - Se o usuário limpar os dados de navegação do navegador, os dados somem.
     - Para usar de verdade, sempre abra o site pelo MESMO navegador/dispositivo
       (ideal: o computador/celular que fica com quem administra a loja).
   ========================================================================= */

(function (global) {
  "use strict";

  var KEYS = {
    PRODUCTS: "de_products",
    ORDERS: "de_orders",
    CAIXA: "de_caixa",
    SETTINGS: "de_settings",
    SESSION: "de_admin_session",
  };

  var ADMIN_USER = "lalbuquerque";
  var ADMIN_PASS = "090211@ana";

  // ---------------------------------------------------------------------
  // Utilitários
  // ---------------------------------------------------------------------
  function uid(prefix) {
    return (
      (prefix || "") +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function formatBRL(value) {
    return (Number(value) || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatDate(iso) {
    var d = new Date(iso);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function readLS(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error("Erro lendo localStorage:", key, e);
      return fallback;
    }
  }

  function writeLS(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("Erro gravando localStorage:", key, e);
      return false;
    }
  }

  // ---------------------------------------------------------------------
  // Seed inicial (primeira vez que o site é aberto)
  // ---------------------------------------------------------------------
  function seedIfEmpty() {
    if (readLS(KEYS.PRODUCTS, null) === null) {
      writeLS(KEYS.PRODUCTS, [
        {
          id: uid("prod_"),
          name: "Alfajor",
          description: "Alfajor artesanal recheado com doce de leite",
          price: 7.0,
          promoPrice: 6.0,
          promoMinQty: 2,
          stock: 50,
          minStockAlert: 10,
          active: true,
          createdAt: nowISO(),
        },
      ]);
    }
    if (readLS(KEYS.ORDERS, null) === null) {
      writeLS(KEYS.ORDERS, []);
    }
    if (readLS(KEYS.CAIXA, null) === null) {
      writeLS(KEYS.CAIXA, []);
    }
    if (readLS(KEYS.SETTINGS, null) === null) {
      writeLS(KEYS.SETTINGS, {
        storeName: "Doce Encantos",
        whatsapp: "5584996279911",
        pixKey: "",
        deliveryFee: 0,
        openingBalance: 0,
        instructions:
          "Pedido feito pelo site. Confirme com o cliente o pagamento e a entrega.",
      });
    }
  }

  // ---------------------------------------------------------------------
  // Autenticação simples do painel administrativo
  // ---------------------------------------------------------------------
  var Auth = {
    login: function (user, pass) {
      if (user === ADMIN_USER && pass === ADMIN_PASS) {
        sessionStorage.setItem(
          KEYS.SESSION,
          JSON.stringify({ user: user, loginAt: nowISO() })
        );
        return true;
      }
      return false;
    },
    isLogged: function () {
      try {
        return !!sessionStorage.getItem(KEYS.SESSION);
      } catch (e) {
        return false;
      }
    },
    logout: function () {
      sessionStorage.removeItem(KEYS.SESSION);
    },
    requireLogin: function (loginPageRelPath) {
      if (!Auth.isLogged()) {
        window.location.href = loginPageRelPath || "login.html";
      }
    },
  };

  // ---------------------------------------------------------------------
  // Produtos
  // ---------------------------------------------------------------------
  var Products = {
    all: function () {
      return readLS(KEYS.PRODUCTS, []);
    },
    activeOnly: function () {
      return Products.all().filter(function (p) {
        return p.active !== false;
      });
    },
    get: function (id) {
      return Products.all().find(function (p) {
        return p.id === id;
      });
    },
    save: function (product) {
      var list = Products.all();
      if (product.id) {
        var idx = list.findIndex(function (p) {
          return p.id === product.id;
        });
        if (idx >= 0) {
          list[idx] = Object.assign({}, list[idx], product);
        } else {
          list.push(product);
        }
      } else {
        product.id = uid("prod_");
        product.createdAt = nowISO();
        list.push(product);
      }
      var ok = writeLS(KEYS.PRODUCTS, list);
      if (!ok) return null;
      return product;
    },
    remove: function (id) {
      var list = Products.all().filter(function (p) {
        return p.id !== id;
      });
      writeLS(KEYS.PRODUCTS, list);
    },
    adjustStock: function (id, delta) {
      var list = Products.all();
      var p = list.find(function (x) {
        return x.id === id;
      });
      if (p) {
        p.stock = Math.max(0, (Number(p.stock) || 0) + delta);
        writeLS(KEYS.PRODUCTS, list);
      }
      return p;
    },
    unitPriceFor: function (product, qty) {
      if (
        product.promoPrice != null &&
        product.promoMinQty &&
        qty >= product.promoMinQty
      ) {
        return Number(product.promoPrice);
      }
      return Number(product.price);
    },
    lowStock: function () {
      return Products.all().filter(function (p) {
        return (Number(p.stock) || 0) <= (Number(p.minStockAlert) || 0);
      });
    },
  };

  // ---------------------------------------------------------------------
  // Pedidos
  // ---------------------------------------------------------------------
  var STATUS = {
    PENDENTE: "Pendente",
    PAGO: "Pago",
    ENTREGUE: "Entregue",
    CANCELADO: "Cancelado",
  };

  var Orders = {
    STATUS: STATUS,
    all: function () {
      return readLS(KEYS.ORDERS, []);
    },
    get: function (id) {
      return Orders.all().find(function (o) {
        return o.id === id;
      });
    },
    create: function (order) {
      var list = Orders.all();
      order.id = uid("ped_");
      order.code = "DE" + Date.now().toString().slice(-6);
      order.createdAt = nowISO();
      order.status = STATUS.PENDENTE;
      order.statusHistory = [{ status: STATUS.PENDENTE, at: order.createdAt }];
      list.unshift(order);
      writeLS(KEYS.ORDERS, list);

      // Baixa de estoque no momento do pedido
      order.items.forEach(function (item) {
        Products.adjustStock(item.productId, -item.qty);
      });

      return order;
    },
    updateStatus: function (id, status) {
      var list = Orders.all();
      var order = list.find(function (o) {
        return o.id === id;
      });
      if (!order) return null;

      var wasPago = order.status === STATUS.PAGO;
      order.status = status;
      if (!order.statusHistory) order.statusHistory = [];
      order.statusHistory.push({ status: status, at: nowISO() });

      if (status === STATUS.CANCELADO && !wasPago) {
        // devolve estoque se cancelado antes de pago
        order.items.forEach(function (item) {
          Products.adjustStock(item.productId, item.qty);
        });
      }

      writeLS(KEYS.ORDERS, list);

      if (status === STATUS.PAGO && !wasPago) {
        Caixa.addEntry({
          type: "entrada",
          description: "Venda " + order.code + " - " + order.customer.name,
          value: order.total,
          orderId: order.id,
          auto: true,
        });
      }
      return order;
    },
    remove: function (id) {
      var list = Orders.all().filter(function (o) {
        return o.id !== id;
      });
      writeLS(KEYS.ORDERS, list);
    },
    // Busca um pedido pelo código informado pelo cliente + telefone (validação simples).
    // Aceita o código com ou sem o prefixo "DE" e ignora maiúsculas/minúsculas.
    findByCode: function (code, phone) {
      if (!code) return null;
      var normalizedCode = String(code).trim().toUpperCase().replace(/^DE/, "");
      var phoneDigits = phone ? String(phone).replace(/\D/g, "") : "";
      return Orders.all().find(function (o) {
        var orderCode = o.code.toUpperCase().replace(/^DE/, "");
        var codeMatches = orderCode === normalizedCode;
        if (!codeMatches) return false;
        if (!phoneDigits) return true;
        var orderPhoneDigits = (o.customer.phone || "").replace(/\D/g, "");
        // compara os últimos dígitos para tolerar diferenças de DDI/DDD na digitação
        return (
          orderPhoneDigits.slice(-8) === phoneDigits.slice(-8) ||
          orderPhoneDigits === phoneDigits
        );
      }) || null;
    },
    todaysOrders: function () {
      var today = new Date().toDateString();
      return Orders.all().filter(function (o) {
        return new Date(o.createdAt).toDateString() === today;
      });
    },
    totalsByStatus: function () {
      var totals = { Pendente: 0, Pago: 0, Entregue: 0, Cancelado: 0 };
      Orders.all().forEach(function (o) {
        totals[o.status] = (totals[o.status] || 0) + o.total;
      });
      return totals;
    },
  };

  // ---------------------------------------------------------------------
  // Caixa
  // ---------------------------------------------------------------------
  var Caixa = {
    all: function () {
      return readLS(KEYS.CAIXA, []);
    },
    addEntry: function (entry) {
      var list = Caixa.all();
      entry.id = uid("cx_");
      entry.date = nowISO();
      list.unshift(entry);
      writeLS(KEYS.CAIXA, list);
      return entry;
    },
    remove: function (id) {
      var list = Caixa.all().filter(function (e) {
        return e.id !== id;
      });
      writeLS(KEYS.CAIXA, list);
    },
    saldo: function () {
      var settings = Settings.get();
      var abertura = Number(settings.openingBalance) || 0;
      var mov = Caixa.all().reduce(function (acc, e) {
        return acc + (e.type === "entrada" ? e.value : -e.value);
      }, 0);
      return abertura + mov;
    },
    totalEntradas: function () {
      return Caixa.all()
        .filter(function (e) {
          return e.type === "entrada";
        })
        .reduce(function (a, e) {
          return a + e.value;
        }, 0);
    },
    totalSaidas: function () {
      return Caixa.all()
        .filter(function (e) {
          return e.type === "saida";
        })
        .reduce(function (a, e) {
          return a + e.value;
        }, 0);
    },
  };

  // ---------------------------------------------------------------------
  // Configurações
  // ---------------------------------------------------------------------
  var Settings = {
    get: function () {
      return readLS(KEYS.SETTINGS, {});
    },
    save: function (settings) {
      var current = Settings.get();
      var merged = Object.assign({}, current, settings);
      writeLS(KEYS.SETTINGS, merged);
      return merged;
    },
  };

  // ---------------------------------------------------------------------
  // Exporta
  // ---------------------------------------------------------------------
  seedIfEmpty();

  global.DE = {
    KEYS: KEYS,
    util: {
      uid: uid,
      nowISO: nowISO,
      formatBRL: formatBRL,
      formatDate: formatDate,
    },
    Auth: Auth,
    Products: Products,
    Orders: Orders,
    Caixa: Caixa,
    Settings: Settings,
  };
})(window);
