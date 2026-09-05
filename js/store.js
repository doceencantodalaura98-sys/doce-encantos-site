/* =========================================================================
   Doce Encantos - Lógica da loja (carrinho + checkout)
   ========================================================================= */

(function () {
  "use strict";

  var fmt = DE.util.formatBRL;
  var cart = []; // [{productId, qty}]

  document.getElementById("year").textContent = new Date().getFullYear();

  // ------------------------------------------------------------------
  // Renderização dos produtos
  // ------------------------------------------------------------------
  function renderProducts() {
    var grid = document.getElementById("productGrid");
    grid.innerHTML = "";
    var products = DE.Products.activeOnly();

    if (products.length === 0) {
      grid.innerHTML = '<p style="text-align:center;color:#7a6a4f;">Nenhum produto disponível no momento.</p>';
      return;
    }

    products.forEach(function (p) {
      var qtyInCart = getCartQty(p.id) || 1;
      var unitPrice = DE.Products.unitPriceFor(p, Math.max(qtyInCart, 1));
      var hasPromo = p.promoPrice != null && p.promoMinQty;
      var outOfStock = (Number(p.stock) || 0) <= 0;
      var lowStock = !outOfStock && Number(p.stock) <= (Number(p.minStockAlert) || 0);

      var card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML =
        '<div class="product-media">🍬</div>' +
        "<h3>" + escapeHtml(p.name) + "</h3>" +
        '<div class="desc">' + escapeHtml(p.description || "") + "</div>" +
        '<div class="price-block">' +
          (hasPromo
            ? '<div class="price-normal"><s>' + fmt(p.price) + "</s> a unidade</div>" +
              '<div class="price-promo">' + fmt(p.promoPrice) + " <small>a partir de " + p.promoMinQty + " un.</small></div>"
            : '<div class="price-promo">' + fmt(p.price) + " <small>a unidade</small></div>") +
        "</div>" +
        '<div class="stock-tag ' + (outOfStock ? "out" : lowStock ? "low" : "") + '">' +
          (outOfStock ? "Esgotado" : lowStock ? "Últimas unidades (" + p.stock + ")" : p.stock + " em estoque") +
        "</div>" +
        '<div class="qty-selector">' +
          '<button type="button" data-action="dec" data-id="' + p.id + '">-</button>' +
          '<span id="qty-' + p.id + '">1</span>' +
          '<button type="button" data-action="inc" data-id="' + p.id + '">+</button>' +
        "</div>" +
        '<button class="btn btn-primary" data-action="add" data-id="' + p.id + '" ' + (outOfStock ? "disabled" : "") + '>' +
          (outOfStock ? "Indisponível" : "Adicionar ao carrinho") +
        "</button>";
      grid.appendChild(card);
    });
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  document.getElementById("productGrid").addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-action]");
    if (!btn) return;
    var id = btn.getAttribute("data-id");
    var action = btn.getAttribute("data-action");
    var span = document.getElementById("qty-" + id);

    if (action === "inc") {
      span.textContent = String(Number(span.textContent) + 1);
    } else if (action === "dec") {
      span.textContent = String(Math.max(1, Number(span.textContent) - 1));
    } else if (action === "add") {
      var product = DE.Products.get(id);
      var qty = Number(span.textContent);
      if (!product) return;
      var currentQty = getCartQty(id);
      if (currentQty + qty > Number(product.stock)) {
        alert("Quantidade indisponível em estoque. Estoque atual: " + product.stock);
        return;
      }
      addToCart(id, qty);
      span.textContent = "1";
      renderProducts(); // atualiza preço conforme quantidade acumulada
      openCart();
    }
  });

  // ------------------------------------------------------------------
  // Carrinho
  // ------------------------------------------------------------------
  function getCartQty(productId) {
    var item = cart.find(function (i) { return i.productId === productId; });
    return item ? item.qty : 0;
  }

  function addToCart(productId, qty) {
    var item = cart.find(function (i) { return i.productId === productId; });
    if (item) {
      item.qty += qty;
    } else {
      cart.push({ productId: productId, qty: qty });
    }
    renderCart();
  }

  function updateCartQty(productId, delta) {
    var item = cart.find(function (i) { return i.productId === productId; });
    if (!item) return;
    var product = DE.Products.get(productId);
    var newQty = item.qty + delta;
    if (newQty <= 0) {
      cart = cart.filter(function (i) { return i.productId !== productId; });
    } else if (product && newQty > Number(product.stock)) {
      alert("Quantidade indisponível em estoque. Estoque atual: " + product.stock);
      return;
    } else {
      item.qty = newQty;
    }
    renderCart();
    renderProducts();
  }

  function removeFromCart(productId) {
    cart = cart.filter(function (i) { return i.productId !== productId; });
    renderCart();
    renderProducts();
  }

  function cartLines() {
    return cart.map(function (i) {
      var product = DE.Products.get(i.productId);
      if (!product) return null;
      var unitPrice = DE.Products.unitPriceFor(product, i.qty);
      return {
        productId: i.productId,
        name: product.name,
        qty: i.qty,
        unitPrice: unitPrice,
        subtotal: unitPrice * i.qty,
      };
    }).filter(Boolean);
  }

  function cartSubtotal() {
    return cartLines().reduce(function (acc, l) { return acc + l.subtotal; }, 0);
  }

  function renderCart() {
    var itemsWrap = document.getElementById("cartItems");
    var lines = cartLines();

    document.getElementById("cartCount").textContent = cart.reduce(function (a, i) { return a + i.qty; }, 0);

    itemsWrap.innerHTML = "";
    if (lines.length === 0) {
      itemsWrap.innerHTML = '<p class="empty-msg">Seu carrinho está vazio.</p>';
    } else {
      lines.forEach(function (l) {
        var row = document.createElement("div");
        row.className = "cart-item";
        row.innerHTML =
          '<div class="cart-item-icon"></div>' +
          '<div class="cart-item-info">' +
            '<div class="name">' + escapeHtml(l.name) + "</div>" +
            '<div class="unit-price">' + fmt(l.unitPrice) + " un. &times; " + l.qty + " = <strong>" + fmt(l.subtotal) + "</strong></div>" +
          "</div>" +
          '<div class="cart-item-actions">' +
            '<button data-action="dec" data-id="' + l.productId + '">-</button>' +
            '<span>' + l.qty + '</span>' +
            '<button data-action="inc" data-id="' + l.productId + '">+</button>' +
            '<button class="remove-item-btn" data-action="remove" data-id="' + l.productId + '">&times;</button>' +
          "</div>";
        itemsWrap.appendChild(row);
      });
    }

    var subtotal = cartSubtotal();
    document.getElementById("cartSubtotal").textContent = fmt(subtotal);
    document.getElementById("cartTotal").textContent = fmt(subtotal + currentDeliveryFee());
    updateDeliveryLine();
  }

  document.getElementById("cartItems").addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-action]");
    if (!btn) return;
    var id = btn.getAttribute("data-id");
    var action = btn.getAttribute("data-action");
    if (action === "inc") updateCartQty(id, 1);
    if (action === "dec") updateCartQty(id, -1);
    if (action === "remove") removeFromCart(id);
  });

  // ------------------------------------------------------------------
  // Abrir/fechar carrinho
  // ------------------------------------------------------------------
  var overlay = document.getElementById("overlay");
  var cartDrawer = document.getElementById("cartDrawer");

  function openCart() {
    cartDrawer.classList.add("open");
    overlay.classList.add("show");
  }
  function closeCart() {
    cartDrawer.classList.remove("open");
    overlay.classList.remove("show");
  }
  document.getElementById("openCartBtn").addEventListener("click", openCart);
  document.getElementById("closeCartBtn").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);

  // ------------------------------------------------------------------
  // Checkout
  // ------------------------------------------------------------------
  var checkoutOverlay = document.getElementById("checkoutOverlay");
  var successOverlay = document.getElementById("successOverlay");

  document.getElementById("goToCheckoutBtn").addEventListener("click", function () {
    if (cart.length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }
    closeCart();
    renderSummary();
    checkoutOverlay.classList.add("show");
  });
  document.getElementById("closeCheckoutBtn").addEventListener("click", function () {
    checkoutOverlay.classList.remove("show");
  });
  document.getElementById("backToCartBtn").addEventListener("click", function () {
    checkoutOverlay.classList.remove("show");
    openCart();
  });

  document.getElementById("deliveryType").addEventListener("change", function (e) {
    document.getElementById("addressWrap").style.display = e.target.value === "entrega" ? "block" : "none";
    renderSummary();
  });
  document.getElementById("addressWrap").style.display = "none";

  document.querySelectorAll('input[name="payment"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      var pixInfo = document.getElementById("pixInfo");
      var settings = DE.Settings.get();
      if (radio.value === "Pix" && radio.checked) {
        pixInfo.hidden = !settings.pixKey;
        pixInfo.textContent = settings.pixKey ? "Chave Pix: " + settings.pixKey : "";
      } else {
        pixInfo.hidden = true;
      }
    });
  });

  function currentDeliveryFee() {
    var settings = DE.Settings.get();
    var deliveryType = document.getElementById("deliveryType").value;
    return deliveryType === "entrega" ? Number(settings.deliveryFee) || 0 : 0;
  }

  function updateDeliveryLine() {
    var fee = currentDeliveryFee();
    var line = document.getElementById("deliveryLine");
    if (fee > 0) {
      line.hidden = false;
      document.getElementById("cartDelivery").textContent = fmt(fee);
    } else {
      line.hidden = true;
    }
    document.getElementById("cartTotal").textContent = fmt(cartSubtotal() + fee);
  }

  function renderSummary() {
    var wrap = document.getElementById("summaryItems");
    var lines = cartLines();
    wrap.innerHTML = lines.map(function (l) {
      return '<div class="summary-row"><span>' + l.qty + "x " + escapeHtml(l.name) + '</span><span>' + fmt(l.subtotal) + "</span></div>";
    }).join("");
    var fee = currentDeliveryFee();
    if (fee > 0) {
      wrap.innerHTML += '<div class="summary-row"><span>Entrega</span><span>' + fmt(fee) + "</span></div>";
    }
    document.getElementById("summaryTotal").textContent = fmt(cartSubtotal() + fee);
  }

  document.getElementById("confirmOrderBtn").addEventListener("click", function () {
    var name = document.getElementById("custName").value.trim();
    var phone = document.getElementById("custPhone").value.trim();
    var deliveryType = document.getElementById("deliveryType").value;
    var address = document.getElementById("custAddress").value.trim();
    var notes = document.getElementById("custNotes").value.trim();
    var payment = document.querySelector('input[name="payment"]:checked').value;

    if (!name || !phone) {
      alert("Preencha seu nome e WhatsApp para continuar.");
      return;
    }
    if (deliveryType === "entrega" && !address) {
      alert("Informe o endereço para entrega.");
      return;
    }

    var lines = cartLines();
    if (lines.length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }

    var fee = currentDeliveryFee();
    var total = cartSubtotal() + fee;

    var order = DE.Orders.create({
      customer: { name: name, phone: phone, deliveryType: deliveryType, address: address, notes: notes },
      payment: payment,
      items: lines.map(function (l) {
        return { productId: l.productId, name: l.name, qty: l.qty, unitPrice: l.unitPrice, subtotal: l.subtotal };
      }),
      deliveryFee: fee,
      total: total,
    });

    checkoutOverlay.classList.remove("show");
    showSuccess(order);

    cart = [];
    renderCart();
    renderProducts();
  });

  function showSuccess(order) {
    document.getElementById("successCode").textContent = "#" + order.code;
    document.getElementById("trackOrderLink").href = "pedido.html?codigo=" + encodeURIComponent(order.code);

    var settings = DE.Settings.get();
    var whatsappBtn = document.getElementById("whatsappBtn");
    var msgLines = order.items.map(function (i) {
      return i.qty + "x " + i.name + " - " + fmt(i.subtotal);
    });
    var message =
      "Olá! Acabei de fazer um pedido no site Doce Encantos.\n" +
      "Pedido: #" + order.code + "\n" +
      "Cliente: " + order.customer.name + "\n" +
      msgLines.join("\n") + "\n" +
      (order.deliveryFee ? "Entrega: " + fmt(order.deliveryFee) + "\n" : "") +
      "Total: " + fmt(order.total) + "\n" +
      "Pagamento: " + order.payment + "\n" +
      (order.customer.deliveryType === "entrega" ? "Entrega em: " + order.customer.address + "\n" : "Retirada no local\n") +
      (order.customer.notes ? "Obs: " + order.customer.notes + "\n" : "");

    if (settings.whatsapp) {
      var phoneDigits = settings.whatsapp.replace(/\D/g, "");
      var whatsappUrl = "https://wa.me/" + phoneDigits + "?text=" + encodeURIComponent(message);
      whatsappBtn.href = whatsappUrl;
      whatsappBtn.hidden = false;
      document.getElementById("successWhatsMsg").hidden = false;

      // Abre o WhatsApp automaticamente em uma nova aba, já com a mensagem
      // pronta. O cliente só precisa clicar em "Enviar" dentro do WhatsApp
      // (navegadores não permitem que um site envie mensagens sozinho).
      // Se o navegador bloquear a abertura automática, o botão abaixo
      // continua disponível como alternativa.
      window.open(whatsappUrl, "_blank");
    } else {
      whatsappBtn.hidden = true;
      document.getElementById("successWhatsMsg").textContent = "Guarde o número do pedido. Em breve entraremos em contato.";
    }

    successOverlay.classList.add("show");
  }

  document.getElementById("closeSuccessBtn").addEventListener("click", function () {
    successOverlay.classList.remove("show");
  });

  // ------------------------------------------------------------------
  // Init
  // ------------------------------------------------------------------
  renderProducts();
  renderCart();
})();
