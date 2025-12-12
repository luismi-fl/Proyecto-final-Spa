

(() => {
  // ----- Helpers-----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const showView = (id) => {
    $$('.view').forEach(v => v.classList.add('hidden'));
    $(`#view-${id}`).classList.remove('hidden');
  };

  // Secciones
  const STORAGE = {
    SESSION: 'spa_session',
    DUEÑOS: 'spa_duenos',
    MASCOTAS: 'spa_mascotas',
    AGENDA: 'spa_agenda',
    CART: 'spa_cart'
  };

  // ----- Login -----
  const AUTH = { user: 'admin', pass: '123' };

  function setSession(on) {
    localStorage.setItem(STORAGE.SESSION, on ? '1' : '');
    updateNav();
  }
  function isLogged() {
    return localStorage.getItem(STORAGE.SESSION) === '1';
  }

  function updateNav() {
    const nav = $('#main-nav');
    if (isLogged()) {
      nav.classList.remove('hidden');
      showView('registro');
      renderAll();
    } else {
      nav.classList.add('hidden');
      showView('login');
    }
  }

  // ----- Utilities -----
  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // ----- Dueños -----
  function addDueno(obj) {
    const list = read(STORAGE.DUEÑOS);
    obj.id = Date.now() + Math.random().toString(36).slice(2,7);
    list.push(obj);
    write(STORAGE.DUEÑOS, list);
  }

  // ----- Mascotas -----
  function addMascota(obj) {
    const list = read(STORAGE.MASCOTAS);
    obj.id = Date.now() + Math.random().toString(36).slice(2,7);
    list.push(obj);
    write(STORAGE.MASCOTAS, list);
  }

  function renderDuenosSelect() {
    const sel = $('#select-duenos');
    sel.innerHTML = '<option value="">-- Seleccione dueño --</option>';

    read(STORAGE.DUEÑOS).forEach(d => {
      const o = document.createElement('option');
      o.value = d.id;
      o.textContent = `${d.nombre} (${d.telefono || d.correo || 'sin contacto'})`;
      sel.appendChild(o);
    });
  }

  function renderMascotasSelect() {
    const sel = $('#select-mascotas');
    sel.innerHTML = '<option value="">-- Seleccione mascota --</option>';

    read(STORAGE.MASCOTAS).forEach(m => {
      const o = document.createElement('option');
      o.value = m.id;
      o.textContent = `${m.nombre} — ${m.especie} / ${m.raza}`;
      sel.appendChild(o);
    });
  }

  function renderListados() {
    const container = $('#lista-duenos-mascotas');
    const duenos = read(STORAGE.DUEÑOS);
    const mascotas = read(STORAGE.MASCOTAS);

    if (!duenos.length && !mascotas.length) {
      container.innerHTML = '<p class="small">No hay dueños o mascotas registrados.</p>';
      return;
    }

    let html = '';
    duenos.forEach(d => {
      const susMasc = mascotas.filter(m => m.duenoId === d.id);
      html += `
        <div class="card">
          <strong>${d.nombre}</strong> — ${d.telefono || ''} ${d.correo ? ' | ' + d.correo : ''}
          <div class="small">Mascotas: ${susMasc.length ? susMasc.map(s => s.nombre).join(', ') : '—'}</div>
        </div>`;
    });

    container.innerHTML = html;
  }

  // ----- Agenda -----
  function addAgenda(item) {
    const list = read(STORAGE.AGENDA);
    list.push({
      ...item,
      id: Date.now() + Math.random().toString(36).slice(2,5)
    });
    write(STORAGE.AGENDA, list);
  }

  function renderAgenda() {
    const list = read(STORAGE.AGENDA);
    const mascotas = read(STORAGE.MASCOTAS);
    const container = $('#lista-agenda');

    if (!list.length) {
      container.innerHTML = '<p class="small">No hay citas agendadas.</p>';
      return;
    }

    container.innerHTML = list.map(a => {
      const m = mascotas.find(x => x.id === a.mascotaId) || { nombre: '(no encontrada)' };
      return `
        <div class="item-row">
          <div>
            <strong>${a.servicio}</strong>
            <div class="small">${a.fecha} ${a.hora} — ${m.nombre}</div>
          </div>
          <div class="small">ID:${a.id}</div>
        </div>`;
    }).join('');
  }

  // ----- Catálogo-----
  const CATALOG = [
    { id: 'p-bano',   title: 'Baño básico',        price: 15.00, type: 'servicio' },
    { id: 'p-corte',  title: 'Corte de pelo',      price: 25.00, type: 'servicio' },
    { id: 'p-juguete',title: 'Juguete para mascota', price: 8.50, type: 'producto' },
    { id: 'p-comida', title: 'Lata de comida 400g', price: 3.75, type: 'producto' }
  ];

  function renderCatalogo() {
    const cont = $('#catalogo-items');
    cont.innerHTML = '';

    CATALOG.forEach(item => {
      const node = document.createElement('div');
      node.className = 'catalog-item';

      node.innerHTML = `
        <div style="font-weight:600">${item.title}</div>
        <div class="small">(${item.type})</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:5px">
          <span>$${item.price.toFixed(2)}</span>
          <button class="btn-add" data-id="${item.id}">Comprar</button>
        </div>
      `;

      cont.appendChild(node);
    });

    $$('.btn-add').forEach(b => b.addEventListener('click', e => {
      addToCart(e.target.dataset.id);
      renderCart();
    }));
  }

  // ----- Carrito -----
  function getCart() { return read(STORAGE.CART); }
  function saveCart(c) { write(STORAGE.CART, c); }

  function addToCart(id) {
    const product = CATALOG.find(p => p.id === id);
    if (!product) return;

    const cart = getCart();
    const existing = cart.find(i => i.id === id);

    if (existing) existing.qty++;
    else cart.push({ id, title: product.title, price: product.price, qty: 1 });

    saveCart(cart);
  }

  function removeFromCart(id) {
    saveCart(getCart().filter(i => i.id !== id));
    renderCart();
  }

  function clearCart() {
    saveCart([]);
    renderCart();
  }

  function renderCart() {
    const container = $('#cart-list');
    const cart = getCart();

    if (!cart.length) {
      container.innerHTML = '<p class="small">Carrito vacío.</p>';
      updateCartSummary(0);
      return;
    }

    container.innerHTML = cart.map(i => `
      <div class="item-row">
        <div>
          <strong>${i.title}</strong>
          <div class="small">Cantidad: 
            <input type="number" min="1" class="cart-qty" data-id="${i.id}" value="${i.qty}" style="width:60px">
          </div>
        </div>
        <div>
          <div class="small">$${(i.price * i.qty).toFixed(2)}</div>
          <button class="btn-remove" data-id="${i.id}">Quitar</button>
        </div>
      </div>
    `).join('');

    // Eventos
    $$('.btn-remove').forEach(b =>
      b.addEventListener('click', e => removeFromCart(e.target.dataset.id))
    );

    $$('.cart-qty').forEach(inp =>
      inp.addEventListener('change', e => {
        const id = e.target.dataset.id;
        const v = Math.max(1, parseInt(e.target.value) || 1);

        const cart = getCart();
        const item = cart.find(x => x.id === id);
        if (item) item.qty = v;

        saveCart(cart);
        renderCart();
      })
    );

    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    updateCartSummary(subtotal);
  }

  function updateCartSummary(sub) {
    $('#cart-subtotal').textContent = sub.toFixed(2);
    $('#cart-total').textContent = sub.toFixed(2);
  }

  // ----- Eventos -----
  document.addEventListener('DOMContentLoaded', () => {
    // Login
    $('#login-form').addEventListener('submit', e => {
      e.preventDefault();
      if ($('#login-user').value === AUTH.user && $('#login-pass').value === AUTH.pass) {
        setSession(true);
        renderAll();
      } else {
        alert('Credenciales incorrectas');
      }
    });

    $('#btn-logout').addEventListener('click', () => {
      setSession(false);
      renderAll();
    });

    // Nav
    $$('.nav-btn').forEach(b =>
      b.addEventListener('click', e => showView(e.target.dataset.view))
    );

    // Dueños
    $('#form-dueño').addEventListener('submit', e => {
      e.preventDefault();
      addDueno(Object.fromEntries(new FormData(e.target).entries()));
      e.target.reset();
      renderAll();
      alert('Dueño guardado');
    });

    // Mascota
    $('#form-mascota').addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      if (!data.duenoId) return alert('Seleccione un dueño');
      addMascota(data);
      e.target.reset();
      renderAll();
      alert('Mascota guardada');
    });

    // Agenda
    $('#form-agenda').addEventListener('submit', e => {
      e.preventDefault();
      addAgenda(Object.fromEntries(new FormData(e.target).entries()));
      e.target.reset();
      renderAgenda();
      alert('Cita guardada');
    });

    // Carrito
    $('#btn-clear-cart').addEventListener('click', () => {
      if (confirm('Vaciar carrito?')) clearCart();
    });

    updateNav();
  });

  function renderAll() {
    renderDuenosSelect();
    renderMascotasSelect();
    renderListados();
    renderAgenda();
    renderCatalogo();
    renderCart();
  }

  if (isLogged()) renderAll();

})();
