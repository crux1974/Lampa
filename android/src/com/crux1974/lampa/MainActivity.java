package com.crux1974.lampa;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

/** Alcopac UA: Lampa з вашого сервера у WebView. Довге «Назад» або «Меню» — зміна адреси. */
public class MainActivity extends Activity {
    static final String DEFAULT_URL = "http://92-5-178-165.sslip.io";
    static final String STYLISH = "https://crux1974.github.io/Lampa/stylish2.js";
    static final String PLUGIN = "https://crux1974.github.io/Lampa/moi_id.js";
    static final String HOME_URL = "http://192.168.8.1:8095";
    static final String[] PRESETS = { DEFAULT_URL, HOME_URL, "https://92-5-178-165.sslip.io", "http://lampa.mx" };
    static final String[] PRESET_NAMES = { "Сервер (будь-де)", "Вдома через роутер (з TorrServer)", "Сервер https", "lampa.mx" };
    WebView web;
    FrameLayout root;
    View fullView;
    WebChromeClient.CustomViewCallback fullCb;
    SharedPreferences prefs;
    boolean longBack = false;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        prefs = getSharedPreferences("alco", MODE_PRIVATE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        immersive();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setAllowFileAccess(false);
        if (Build.VERSION.SDK_INT >= 21) s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        // Lampa блокує торренти в «чужих» Android-оболонках (вікно «встановіть APK»).
        // Прибираємо слово Android з User-Agent — тоді Lampa грає торренти вбудованим плеєром, як у браузері.
        s.setUserAgentString(s.getUserAgentString().replaceAll("(?i)android", "Linux") + " AlcopacUA/1.3.1");
        CookieManager.getInstance().setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= 21) CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);

        web.setWebViewClient(new WebViewClient() {
            /* Вбудований плагін «ID для сервера» (свій ID пристрою, «Мій Filmix», свої пристрої) */
            @Override public void onPageFinished(WebView v, String u) {
                v.evaluateJavascript(
                    "(function(){function has(n){var a=document.scripts;for(var i=0;i<a.length;i++)if((a[i].src||'').indexOf(n)>=0)return true;return false}" +
                    "function add(id,src){var s=document.createElement('script');s.id=id;s.src=src;document.head.appendChild(s)}" +
                    "if(!window.moi_id_plugin&&!has('moi_id.js'))add('moi_id_js','" + PLUGIN + "');" +
                    /* Стильний інтерфейс: чекаємо, поки Lampa підвантажить свої плагіни, щоб не було двох копій */
                    "setTimeout(function(){if(!window.__sui_extra&&!has('stylish2.js'))add('stylish2_js','" + STYLISH + "')},5000);})()", null);
            }
            @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r != null && r.isForMainFrame()) {
                    Toast.makeText(MainActivity.this, "Сервер не відповідає. Перевірте адресу", Toast.LENGTH_LONG).show();
                    showAddress();
                }
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onShowCustomView(View v, CustomViewCallback cb) {
                if (fullView != null) { cb.onCustomViewHidden(); return; }
                fullView = v; fullCb = cb;
                root.addView(v, new FrameLayout.LayoutParams(-1, -1));
                web.setVisibility(View.GONE);
                immersive();
            }
            @Override public void onHideCustomView() { exitFull(); }
        });
        if (b != null) web.restoreState(b); else web.loadUrl(url());
    }

    String url() { return prefs.getString("url", DEFAULT_URL); }

    void exitFull() {
        if (fullView == null) return;
        root.removeView(fullView);
        fullView = null;
        web.setVisibility(View.VISIBLE);
        if (fullCb != null) fullCb.onCustomViewHidden();
        fullCb = null;
    }

    void immersive() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }
    @Override public void onWindowFocusChanged(boolean f) { super.onWindowFocusChanged(f); if (f) immersive(); }

    void showAddress() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        int p = (int) (16 * getResources().getDisplayMetrics().density);
        box.setPadding(p, p / 2, p, 0);
        TextView hint = new TextView(this);
        hint.setText("Адреса вашої Lampa (сервера):");
        box.addView(hint);
        final EditText ed = new EditText(this);
        ed.setSingleLine(true);
        ed.setText(url());
        ed.setSelection(ed.getText().length());
        box.addView(ed, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        new AlertDialog.Builder(this)
            .setTitle("Alcopac UA — сервер")
            .setView(box)
            .setPositiveButton("Відкрити", (d, w) -> {
                String u = ed.getText().toString().trim();
                if (u.isEmpty()) u = DEFAULT_URL;
                if (!u.startsWith("http://") && !u.startsWith("https://")) u = "http://" + u;
                prefs.edit().putString("url", u).apply();
                web.loadUrl(u);
            })
            .setNeutralButton("Вибрати…", (d, w) -> new AlertDialog.Builder(this)
                .setTitle("Швидкий вибір")
                .setItems(PRESET_NAMES, (d2, i) -> { prefs.edit().putString("url", PRESETS[i]).apply(); web.loadUrl(PRESETS[i]); })
                .show())
            .setNegativeButton("Перезавантажити", (d, w) -> web.reload())
            .show();
    }

    @Override public boolean onKeyDown(int code, KeyEvent e) {
        if (code == KeyEvent.KEYCODE_BACK) { e.startTracking(); return true; }
        if (code == KeyEvent.KEYCODE_MENU) { showAddress(); return true; }
        return super.onKeyDown(code, e);
    }
    @Override public boolean onKeyLongPress(int code, KeyEvent e) {
        if (code == KeyEvent.KEYCODE_BACK) { longBack = true; showAddress(); return true; }
        return super.onKeyLongPress(code, e);
    }
    @Override public boolean onKeyUp(int code, KeyEvent e) {
        if (code == KeyEvent.KEYCODE_BACK) {
            if (longBack) { longBack = false; return true; }
            if (e.isTracking() && !e.isCanceled()) back();
            return true;
        }
        return super.onKeyUp(code, e);
    }
    @Override public void onBackPressed() { back(); }

    /** «Назад» передаємо самій Lampa (як Esc), щоб вона закривала меню й екрани по-своєму. */
    void back() {
        if (fullView != null) { exitFull(); return; }
        web.evaluateJavascript(
            "(function(){try{var e=new KeyboardEvent('keydown',{key:'Escape',code:'Escape',keyCode:27,which:27,bubbles:true});" +
            "Object.defineProperty(e,'keyCode',{get:function(){return 27}});Object.defineProperty(e,'which',{get:function(){return 27}});" +
            "document.dispatchEvent(e);return 'ok'}catch(x){return 'no'}})()",
            null);
    }

    @Override protected void onSaveInstanceState(Bundle b) { super.onSaveInstanceState(b); web.saveState(b); }
    @Override protected void onPause() { super.onPause(); web.onPause(); }
    @Override protected void onResume() { super.onResume(); web.onResume(); immersive(); }
    @Override protected void onDestroy() { if (web != null) web.destroy(); super.onDestroy(); }
}
