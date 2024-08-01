package com.spring.SpringToReact;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@RestController
@RequestMapping("/api")
public class ImageController {

    private final String uploadDirectory = "uploads/";
    private static final Logger log = LoggerFactory.getLogger(ImageController.class);

    @CrossOrigin
    @PostMapping("/upload")
    public ResponseEntity<String> uploadImage(@RequestParam("image") MultipartFile file, @RequestParam("fileName") String fileName) {
        try {
            // 업로드 디렉터리가 없으면 생성
            Files.createDirectories(Paths.get(uploadDirectory));

            // 파일 저장 경로 설정
            String savedFileName = "pill_1.jpg";
            Path filePath = Paths.get(uploadDirectory, savedFileName);

            // 파일 저장
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // 이미지 URL 생성 (클라이언트에 반환)
            String imageUrl = "http://localhost:8080/images/" + savedFileName;
            return ResponseEntity.ok(imageUrl);
        } catch (IOException e) {
            log.error("이미지 업로드 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("이미지 업로드 실패");
        }
    }

    private String runMLModel(String imagePath) {
        try {
            ProcessBuilder processBuilder = new ProcessBuilder("python", "/ML/main/main.py", imagePath);
            Process process = processBuilder.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                return output.toString();
            } else {
                log.error("ML 모델 실행 실패. Exit code: " + exitCode);
                return "ML 모델 실행 실패";
            }
        } catch (IOException | InterruptedException e) {
            log.error("ML 모델 실행 중 오류 발생", e);
            return "ML 모델 실행 중 오류 발생";
        }
    }
}
