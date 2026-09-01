package com.cgrant10.budgetdawgs;

import android.net.Uri;

import com.google.androidbrowserhelper.trusted.LauncherActivity;

/** Opens the hosted PWA while accepting only this app's own trusted URLs. */
public class QuickLaunchActivity extends LauncherActivity {
    private static final Uri DEFAULT_URL =
            Uri.parse("https://cgrant10.github.io/budget_app/");

    @Override
    protected Uri getLaunchingUrl() {
        Uri requested = getIntent() == null ? null : getIntent().getData();
        if (requested == null
                || !"https".equals(requested.getScheme())
                || !"cgrant10.github.io".equals(requested.getHost())
                || requested.getPath() == null
                || !requested.getPath().startsWith("/budget_app/")) {
            return DEFAULT_URL;
        }
        return requested;
    }
}
