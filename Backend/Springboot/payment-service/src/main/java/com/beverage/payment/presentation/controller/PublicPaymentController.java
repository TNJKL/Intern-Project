package com.beverage.payment.presentation.controller;

import com.beverage.payment.application.usecase.PaymentUseCase;
import com.beverage.payment.infrastructure.config.VNPayConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
public class PublicPaymentController {

    private final PaymentUseCase paymentUseCase;
    
    @Value("${app.frontend.payment-result-url:http://localhost:3000/payment-result}")
    private String frontendPaymentResultUrl;

    @GetMapping("/vnpay/callback")
    public ResponseEntity<Void> vnpayCallback(@RequestParam Map<String, String> params) {
        log.info("Received VNPay callback redirect");
        paymentUseCase.handleVNPayCallback(params);

        // Redirect customer back to Frontend result page with query params
        String queryString = params.entrySet().stream()
                .map(entry -> entry.getKey() + "=" + URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));

        String redirectUrl = frontendPaymentResultUrl + "?" + queryString;
        log.info("Redirecting customer browser to: {}", redirectUrl);

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(redirectUrl))
                .build();
    }

    @PostMapping("/vnpay/ipn")
    public ResponseEntity<Map<String, String>> vnpayIpn(@RequestParam Map<String, String> params) {
        log.info("Received VNPay IPN call");
        Map<String, String> response = paymentUseCase.processVNPayIPN(params);
        return ResponseEntity.ok(response);
    }
}
