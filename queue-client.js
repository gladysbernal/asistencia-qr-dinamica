/* Laboratorio: endpoint fijo de prueba, ninguna clave docente incorporada. */
window.QueueClient = (() => {
  const endpoint = window.AttendanceConfig && window.AttendanceConfig.apiUrl;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function request(params, retries = 0) {
    for (let attempt = 0; ; attempt++) {
      try {
        if (!endpoint) throw new Error('Configura la URL de la API candidata en config.js.');
        const url = new URL(endpoint);
        if (url.origin !== 'https://script.google.com' || !new RegExp('^/macros/s/[^/]+/exec$').test(url.pathname)
          || url.pathname.includes('AKfycbwC_u-NtgAxL74DRrmT5GHKPhPa8olgyas0zSdGV0_A_q2vPeru-YQagsX1dQNPg2dl')) {
          throw new Error('La candidata requiere un endpoint separado, no la API oficial.');
        }
        Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
        const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw Object.assign(new Error('Error temporal del servidor.'), {retryable:true});
        let result;
        try { result = await response.json(); }
        catch (_) { throw Object.assign(new Error('Respuesta temporal inesperada.'), {retryable:true}); }
        if (!result.ok) throw Object.assign(new Error(result.message || 'Error del servidor.'), {
          retryable: result.retryable || /simultáneas|candado|ocupado|Lote en proceso/i.test(result.message || '')
        });
        return result;
      } catch (error) {
        const transient = error.retryable || ['TypeError','TimeoutError','AbortError'].includes(error.name);
        if (!transient || attempt >= retries) throw error;
        await sleep(800 + Math.random() * Math.min(6000, 1000 * 2 ** attempt));
      }
    }
  }
  return { request, sleep };
})();
