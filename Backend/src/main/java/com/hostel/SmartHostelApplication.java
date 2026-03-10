package com.hostel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SmartHostelApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmartHostelApplication.class, args);
    }
}
