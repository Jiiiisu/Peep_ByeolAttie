package com.spring.SpringToReact;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
public class DataController {

    @GetMapping("/data")
    public String getInfo() {
        String defaultDrugName = "게루삼정";  // Set a default drug name
        try {
            return com.project.SpringPeepPeep.GetInfoByName.getInfo(defaultDrugName);
        } catch (IOException e) {
            e.printStackTrace();
            return "Error fetching data";
        }
    }
}
