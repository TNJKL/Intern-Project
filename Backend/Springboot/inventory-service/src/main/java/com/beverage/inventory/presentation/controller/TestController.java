package com.beverage.inventory.presentation.controller;

import com.beverage.inventory.common.ApiResponse;
import com.beverage.shared.jwt.JwtUserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/inventory/test")
public class TestController {

    @GetMapping("/public")
    public ApiResponse<String> testPublic() {
        return ApiResponse.success("Public endpoint works fine!");
    }

    @GetMapping("/private")
    public ApiResponse<Map<String, Object>> testPrivate(@AuthenticationPrincipal JwtUserPrincipal principal) {
        Map<String, Object> details = new HashMap<>();
        details.put("userId", principal.getUserId());
        details.put("email", principal.getEmail());
        details.put("role", principal.getRole());
        details.put("fullName", principal.getFullName());
        return ApiResponse.success(details, "Authenticated private endpoint works fine!");
    }

    @GetMapping("/admin")
    public ApiResponse<Map<String, Object>> testAdmin(@AuthenticationPrincipal JwtUserPrincipal principal) {
        Map<String, Object> details = new HashMap<>();
        details.put("userId", principal.getUserId());
        details.put("email", principal.getEmail());
        details.put("role", principal.getRole());
        details.put("fullName", principal.getFullName());
        return ApiResponse.success(details, "Admin-only private endpoint works fine!");
    }
}
