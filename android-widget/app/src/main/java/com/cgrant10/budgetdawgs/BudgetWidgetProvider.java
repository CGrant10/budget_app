package com.cgrant10.budgetdawgs;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

public class BudgetWidgetProvider extends AppWidgetProvider {
    private static final String BASE_URL = "https://cgrant10.github.io/budget_app/";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] widgetIds) {
        for (int widgetId : widgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.budget_widget);
            views.setOnClickPendingIntent(
                    R.id.add_expense,
                    quickLaunch(context, "expense", widgetId * 2));
            views.setOnClickPendingIntent(
                    R.id.add_income,
                    quickLaunch(context, "income", widgetId * 2 + 1));
            views.setOnClickPendingIntent(
                    R.id.widget_title,
                    openApp(context, widgetId));
            manager.updateAppWidget(widgetId, views);
        }
    }

    private PendingIntent quickLaunch(Context context, String type, int requestCode) {
        Intent intent = new Intent(context, QuickLaunchActivity.class)
                .setAction(Intent.ACTION_VIEW)
                .setData(Uri.parse(BASE_URL + "?quick=" + type))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(
                context, requestCode, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private PendingIntent openApp(Context context, int requestCode) {
        Intent intent = new Intent(context, QuickLaunchActivity.class)
                .setAction(Intent.ACTION_VIEW)
                .setData(Uri.parse(BASE_URL))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(
                context, requestCode, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
