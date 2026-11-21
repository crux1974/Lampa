/* Alcopac UA — мінімальна заміна webOSTV.js (бібліотеки LG), щоб Lampa
   розпізнала телевізор LG так само, як в офіційному застосунку.
   Працює через вбудований у webOS PalmServiceBridge. */
(function () {
  if (typeof window.webOS !== 'undefined') return;
  if (typeof window.PalmServiceBridge === 'undefined' && !window.PalmSystem) return;

  function request(uri, params) {
    params = params || {};
    var url = uri;
    if (params.method) url = uri.replace(/\/+$/, '') + '/' + params.method;
    var parameters = params.parameters || {};
    if (params.subscribe) parameters.subscribe = true;
    var bridge = null;
    try { bridge = new window.PalmServiceBridge(); } catch (e) {}
    if (!bridge) {
      if (params.onFailure) params.onFailure({ returnValue: false, errorText: 'no PalmServiceBridge' });
      return { cancel: function () {} };
    }
    bridge.onservicecallback = function (msg) {
      var r;
      try { r = JSON.parse(msg); } catch (e) { r = { returnValue: false, errorText: 'bad response' }; }
      if (r.errorCode || r.returnValue === false) { if (params.onFailure) params.onFailure(r); }
      else if (params.onSuccess) params.onSuccess(r);
      if (params.onComplete) params.onComplete(r);
    };
    try { bridge.call(url, JSON.stringify(parameters)); } catch (e) {}
    return { uri: uri, params: params, cancel: function () { try { bridge.cancel(); } catch (e) {} } };
  }

  var info = null;
  window.webOS = {
    libVersion: '1.2.4-alcopac',
    platform: { tv: true },
    service: { request: request },
    fetchAppId: function () {
      try { return window.PalmSystem.identifier.split(' ')[0]; } catch (e) { return 'com.crux1974.lampa'; }
    },
    fetchAppRootPath: function () { return (window.ALCO_START || '').replace(/[^\/]*$/, ''); },
    platformBack: function () { try { window.PalmSystem.platformBack(); } catch (e) {} },
    keyboard: { isShowing: function () { try { return !!window.PalmSystem.isKeyboardVisible; } catch (e) { return false; } } },
    deviceInfo: function (cb) {
      if (info) return cb(info);
      request('luna://com.webos.service.tv.systemproperty', {
        method: 'getSystemInfo',
        parameters: { keys: ['modelName', 'firmwareVersion', 'UHD', 'sdkVersion'] },
        onSuccess: function (r) {
          info = { modelName: r.modelName, version: r.firmwareVersion, sdkVersion: r.sdkVersion || '25.0', uhd: r.UHD === 'true' };
          var v = (info.version || '').split('.');
          info.versionMajor = +v[0] || 0; info.versionMinor = +v[1] || 0; info.versionDot = +v[2] || 0;
          cb(info);
        },
        onFailure: function () { info = { modelName: 'webOS TV', sdkVersion: '25.0' }; cb(info); }
      });
    }
  };
})();
