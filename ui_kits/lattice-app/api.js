/* Lattice product-app API client. Same-origin; the httpOnly session cookie rides along. */
window.api = (function () {
  async function req(method, path, body) {
    const res = await fetch(path, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch (e) { /* no body */ }
    if (!res.ok) {
      const err = new Error((data && data.error) || ('Request failed (' + res.status + ')'));
      err.status = res.status;
      throw err;
    }
    return data;
  }
  return {
    // auth (GitHub OAuth — sign-in is a full-page redirect to /api/auth/github, not fetch)
    me: () => req('GET', '/api/auth/me'),
    logout: () => req('POST', '/api/auth/logout', {}),
    // plans / subscription / invoices (view-only)
    plans: () => req('GET', '/api/plans'),
    subscription: () => req('GET', '/api/subscription'),
    invoices: () => req('GET', '/api/invoices'),
    // projects
    projects: () => req('GET', '/api/projects'),
    project: (id) => req('GET', '/api/projects/' + id),
    createProject: (b) => req('POST', '/api/projects', b),
    updateProject: (id, b) => req('PUT', '/api/projects/' + id, b),
    deleteProject: (id) => req('DELETE', '/api/projects/' + id),
    // marketplace: static catalog + per-account library
    market: () => fetch('default_market.json', { credentials: 'same-origin' }).then(r => r.json()),
    library: () => req('GET', '/api/library'),
    installItem: (b) => req('POST', '/api/library', b),
    updateItem: (id, b) => req('PUT', '/api/library/' + id, b),
    deleteItem: (id) => req('DELETE', '/api/library/' + id),
    // team
    team: () => req('GET', '/api/team'),
    invite: (b) => req('POST', '/api/team', b),
    removeMember: (id) => req('DELETE', '/api/team/' + id),
    // account
    updateAccount: (b) => req('PUT', '/api/account', b),
    // admin
    adminStats: () => req('GET', '/api/admin/stats'),
    adminUsers: () => req('GET', '/api/admin/users'),
    adminSetPlan: (id, plan_id) => req('PUT', '/api/admin/users/' + id + '/plan', { plan_id }),
    adminDeleteUser: (id) => req('DELETE', '/api/admin/users/' + id),
  };
})();
