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

import android.graphics.*;
import java.io.*;
import java.util.*;
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

    private String processText(String text) {
        // 단어 빈도수 계산
        Map<String, Integer> wordFrequency = new HashMap<>();
        String[] words = text.split("\\s+");
        for (String word : words) {
            wordFrequency.put(word, wordFrequency.getOrDefault(word, 0) + 1);
        }
    
        // 빈도수 기준으로 정렬
        List<Map.Entry<String, Integer>> sortedWords = new ArrayList<>(wordFrequency.entrySet());
        sortedWords.sort((a, b) -> b.getValue().compareTo(a.getValue()));
    
        // 상위 5개 단어만 선택 (또는 원하는 개수로 조정)
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < Math.min(5, sortedWords.size()); i++) {
            result.append(sortedWords.get(i).getKey()).append(" ");
        }

        return result.toString().trim();
    } 
    
    private Bitmap preprocessImage(Bitmap original) {
        Bitmap bmpGrayscale = Bitmap.createBitmap(original.getWidth(), original.getHeight(), Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bmpGrayscale);
        Paint paint = new Paint();
        ColorMatrix cm = new ColorMatrix();
        cm.setSaturation(0);
        ColorMatrixColorFilter f = new ColorMatrixColorFilter(cm);
        paint.setColorFilter(f);
        c.drawBitmap(original, 0, 0, paint);
    
        // 대비 증가
        for (int x = 0; x < bmpGrayscale.getWidth(); x++) {
            for (int y = 0; y < bmpGrayscale.getHeight(); y++) {
                int pixel = bmpGrayscale.getPixel(x, y);
                int gray = Color.red(pixel);  // 그레이스케일에서는 R, G, B 값이 동일
                gray = (int)(255 * Math.pow((gray / 255.0), 0.5));  // 감마 보정
                bmpGrayscale.setPixel(x, y, Color.rgb(gray, gray, gray));
            }
        }
    
        return bmpGrayscale;
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
            
            //손글씨 인식률 개선하는 코드. 속도가 느려짐
            // Bitmap originalBitmap = BitmapFactory.decodeFile(imagePath);
            // Bitmap preprocessedBitmap = preprocessImage(originalBitmap);
            // InputImage image = InputImage.fromBitmap(preprocessedBitmap, 0);
            InputImage image = InputImage.fromFilePath(reactContext, Uri.fromFile(file));
            Log.d("CustomMlkitOcr", "Preprocessed image created successfully");
            
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
        } catch (Exception e) {
            Log.e("CustomMlkitOcr", "Unexpected error in recognizeText", e);
            promise.reject("UNEXPECTED_ERROR", e.getMessage());
        }
    }
}