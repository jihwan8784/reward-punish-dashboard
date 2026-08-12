package com.example.grade;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class HomeController {
    
    @GetMapping("/")
    public String home() {

        return "home";

    }

    @GetMapping("/student")
    public String findStudent(@RequestParam String code, Model model) {
        
        model.addAttribute("code", code);
        return "student";

    }

}