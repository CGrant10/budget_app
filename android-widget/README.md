# Budget DAWGs Android widget

This companion app provides a real Android home-screen widget for the hosted
Budget DAWGs PWA. The widget's Expense and Income buttons open the PWA's existing
fast-add sheet, so transaction validation and browser-local data stay in one place.

## Run it

1. Open `android-widget` in Android Studio.
2. Let Gradle sync and install the `app` configuration on an Android 8+ phone.
3. Long-press the phone's home screen, choose **Widgets**, find **Budget DAWGs**,
   and drag **Quick Transaction** onto the home screen.

Until Digital Asset Links are configured, the PWA opens in a Custom Tab. The
widget is fully functional in that mode and uses the same web origin/storage.

## Enable full-screen Trusted Web Activity mode

1. Create the release signing key and obtain its SHA-256 certificate fingerprint.
2. Copy `assetlinks.example.json` to `docs/.well-known/assetlinks.json` and
   replace `REPLACE_WITH_RELEASE_SHA256` with that fingerprint.
3. Publish the updated `docs` folder and verify
   `https://cgrant10.github.io/budget_app/.well-known/assetlinks.json`.
4. Build/install an APK signed with that same certificate.

Never commit the signing key or its passwords.
