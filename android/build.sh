#!/bin/sh
# Збірка APK без Android Studio: потрібні build-tools 34, platform android-34, r8.jar і JDK.
# BT=шлях/до/build-tools  AJ=шлях/до/android.jar  R8=шлях/до/r8.jar  KS=ключ.jks
set -e
rm -rf build && mkdir -p build/res build/gen build/classes
$BT/aapt2 compile --dir res -o build/res/res.zip
$BT/aapt2 link -o build/base.apk -I $AJ --manifest AndroidManifest.xml --java build/gen build/res/res.zip --min-sdk-version 21 --target-sdk-version 34
javac -encoding UTF-8 -source 8 -target 8 -bootclasspath $AJ:$BT/core-lambda-stubs.jar -d build/classes $(find src build/gen -name "*.java")
(cd build/classes && jar cf ../classes.jar .)
java -cp $R8 com.android.tools.r8.D8 --min-api 21 --lib $AJ --output build build/classes.jar
cp build/base.apk build/unsigned.apk && (cd build && zip -q -j unsigned.apk classes.dex)
$BT/zipalign -f -p 4 build/unsigned.apk build/aligned.apk
$BT/apksigner sign --ks $KS --out Alcopac_UA.apk build/aligned.apk
