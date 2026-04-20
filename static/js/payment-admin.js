(function () {
  const adminSessionKey = 'noveo_admin_session';
  const requestsGrid = document.getElementById('requestsGrid');
  const emptyState = document.getElementById('emptyState');
  const loginCard = document.getElementById('loginCard');
  const contentWrap = document.getElementById('contentWrap');
  const loginError = document.getElementById('loginError');
  const cardInfo = document.getElementById('cardInfo');
  const loginButton = document.getElementById('loginButton');
  const adminPassword = document.getElementById('adminPassword');

  function getSession() {
    return localStorage.getItem(adminSessionKey) || '';
  }

  function setSession(token) {
    if (token) localStorage.setItem(adminSessionKey, token);
    else localStorage.removeItem(adminSessionKey);
  }

  async function fetchJson(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    const session = getSession();
    if (session) headers['X-Admin-Session'] = session;
    const response = await fetch(path, { ...options, headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.error) throw new Error(payload.error || 'Request failed');
    return payload;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char;
    });
  }

  function renderAvatar(request) {
    if (request.avatarUrl) return '<img src="' + escapeHtml(request.avatarUrl) + '" alt="">';
    return escapeHtml((request.username || '?').slice(0, 1));
  }

  function renderRequests(requests) {
    requestsGrid.innerHTML = requests.map(function (request) {
      const tierLabel = request.requestedTier === 'premium_upgrade'
        ? 'Premium Upgrade'
        : (request.requestedTier === 'premium' ? 'Premium' : 'Silver');
      const actions = request.status === 'open'
        ? '<button class="success" data-action="accept" data-request-id="' + escapeHtml(request.requestId) + '">تأیید</button>' +
          '<button class="danger" data-action="reject" data-request-id="' + escapeHtml(request.requestId) + '">رد</button>'
        : '';
      return (
        '<article class="request-card">' +
          '<a class="receipt-wrap" href="' + escapeHtml(request.receiptUrl) + '" target="_blank" rel="noreferrer">' +
            '<img src="' + escapeHtml(request.receiptUrl) + '" alt="receipt">' +
          '</a>' +
          '<div class="content">' +
            '<div class="row">' +
              '<div class="avatar">' + renderAvatar(request) + '</div>' +
              '<div>' +
                '<div class="name">' + escapeHtml(request.username || request.userId) + '</div>' +
                '<div class="sub">' + escapeHtml(request.userId) + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="badge">' + tierLabel + ' • ' + new Intl.NumberFormat('fa-IR').format(request.amountTomans) + ' تومان</div>' +
            '<div class="sub">وضعیت: <strong class="status-' + escapeHtml(request.status) + '">' + escapeHtml(request.status) + '</strong></div>' +
            '<div class="footer">' + actions + '</div>' +
          '</div>' +
        '</article>'
      );
    }).join('');
    emptyState.classList.toggle('hidden', requests.length > 0);
  }

  async function loadRequests() {
    const payload = await fetchJson('/payment/data');
    cardInfo.textContent = payload.cardNumber + ' • ' + payload.cardholderName;
    loginCard.classList.add('hidden');
    contentWrap.classList.remove('hidden');
    renderRequests(Array.isArray(payload.requests) ? payload.requests : []);
  }

  async function login() {
    loginError.classList.add('hidden');
    try {
      const payload = await fetchJson('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword.value || '' })
      });
      setSession(payload.sessionToken || '');
      await loadRequests();
    } catch (error) {
      loginError.textContent = error.message || 'ورود ناموفق بود.';
      loginError.classList.remove('hidden');
    }
  }

  loginButton.addEventListener('click', login);
  adminPassword.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') login();
  });
  requestsGrid.addEventListener('click', async function (event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    button.disabled = true;
    try {
      await fetchJson('/payment/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: button.dataset.action,
          requestId: button.dataset.requestId
        })
      });
      await loadRequests();
    } catch (error) {
      alert(error.message || 'Action failed');
    } finally {
      button.disabled = false;
    }
  });

  (async function () {
    if (!getSession()) return;
    try {
      await loadRequests();
    } catch (_) {
      setSession('');
    }
  })();
})();
