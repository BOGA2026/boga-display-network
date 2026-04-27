package com.visualia.firetv

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Lanza la app automáticamente cuando el Fire TV arranca. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val launch = Intent(context, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(launch)
    }
}
