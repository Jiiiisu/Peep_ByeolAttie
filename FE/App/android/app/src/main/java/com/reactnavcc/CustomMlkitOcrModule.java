package com.reactnavcc;

import android.net.Uri;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;
import com.google.mlkit.vision.text.korean.KoreanTextRecognizerOptions;
import com.google.android.gms.tasks.Task;

import java.io.File;
import java.io.IOException;
import android.util.Log;

public class CustomMlkitOcrModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private TextRecognizer latinRecognizer;
    private TextRecognizer koreanRecognizer;

    public CustomMlkitOcrModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        Log.d("CustomMlkitOcr", "Initializing OCR recognizers");
        try {
            this.latinRecognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
            this.koreanRecognizer = TextRecognition.getClient(new KoreanTextRecognizerOptions.Builder().build());
            Log.d("CustomMlkitOcr", "OCR recognizers initialized successfully");
        } catch (Exception e) {
            Log.e("CustomMlkitOcr", "Error initializing OCR recognizers", e);
        }
    }

    @NonNull
    @Override
    public String getName() {
        return "CustomMlkitOcrModule";
    }

    @ReactMethod
    public void recognizeText(String imagePath, final Promise promise) {
        Log.d("CustomMlkitOcr", "Starting OCR process for image: " + imagePath);
        try {
            File file = new File(imagePath);
            if (!file.exists()) {
                Log.e("CustomMlkitOcr", "File does not exist: " + imagePath);
                promise.reject("FILE_NOT_FOUND", "The image file does not exist");
                return;
            }
            
            InputImage image = InputImage.fromFilePath(reactContext, Uri.fromFile(file));
            Log.d("CustomMlkitOcr", "Input image created successfully");
            
            koreanRecognizer.process(image)
                .addOnSuccessListener(koreanText -> {
                    Log.d("CustomMlkitOcr", "Korean OCR successful: " + koreanText.getText());
                    latinRecognizer.process(image)
                        .addOnSuccessListener(latinText -> {
                            Log.d("CustomMlkitOcr", "Latin OCR successful: " + latinText.getText());
                            String combinedText = koreanText.getText() + " " + latinText.getText();
                            WritableMap resultMap = Arguments.createMap();
                            resultMap.putString("text", combinedText);
                            Log.d("CustomMlkitOcr", "Combined OCR result: " + combinedText);
                            promise.resolve(resultMap);
                        })
                        .addOnFailureListener(e -> {
                            Log.e("CustomMlkitOcr", "Latin OCR failed", e);
                            // 라틴 문자 인식 실패 시에도 한국어 결과만 반환
                            WritableMap resultMap = Arguments.createMap();
                            resultMap.putString("text", koreanText.getText());
                            promise.resolve(resultMap);
                        });
                })
                .addOnFailureListener(e -> {
                    Log.e("CustomMlkitOcr", "Korean OCR failed", e);
                    promise.reject("KOREAN_OCR_FAILED", e.getMessage());
                });
        } catch (IOException e) {
            Log.e("CustomMlkitOcr", "Failed to load image", e);
            promise.reject("IMAGE_LOAD_FAILED", e.getMessage());
        } catch (Exception e) {
            Log.e("CustomMlkitOcr", "Unexpected error in recognizeText", e);
            promise.reject("UNEXPECTED_ERROR", e.getMessage());
        }
    }
}