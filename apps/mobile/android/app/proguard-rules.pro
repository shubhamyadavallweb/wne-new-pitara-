# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# Razorpay
-keep class com.razorpay.** { *; }
-keepattributes Signature
-keepattributes Annotation
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-dontwarn com.razorpay.**
-keep class proguard.annotation.Keep
-keep class proguard.annotation.KeepClassMembers

# ProGuard annotations - ignore missing classes
-dontwarn proguard.annotation.Keep
-dontwarn proguard.annotation.KeepClassMembers

# Other common React Native rules
-keep public class com.horcrux.svg.** {*;}
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# React Native
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation @interface com.facebook.common.internal.DoNotStrip
-keep,allowobfuscation @interface com.facebook.jni.annotations.DoNotStrip

# Do not strip any method/class that is annotated with @DoNotStrip
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.common.internal.DoNotStrip class *
-keep @com.facebook.jni.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.common.internal.DoNotStrip *;
    @com.facebook.jni.annotations.DoNotStrip *;
}

# Keep getters and setters
-keepclassmembers class * {
  @com.facebook.proguard.annotations.KeepGettersAndSetters *;
}

# Keep native methods
-keepclassmembers class * {
    native <methods>;
}
