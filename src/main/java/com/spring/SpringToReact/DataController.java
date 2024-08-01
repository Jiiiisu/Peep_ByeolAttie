package com.spring.SpringToReact;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
public class DataController {

    @GetMapping("/data")
    public String getInfo() {

        String outputLabel = "게보린정 300mg/PTP";
        String[] parts = outputLabel.split(" ");
        String defaultDrugName = parts[0];  // Set a default drug name
        try {
            return GetInfoByName.getInfo(defaultDrugName);
        } catch (IOException e) {
            e.printStackTrace();
            return "Error fetching data";
        }
    }
}
