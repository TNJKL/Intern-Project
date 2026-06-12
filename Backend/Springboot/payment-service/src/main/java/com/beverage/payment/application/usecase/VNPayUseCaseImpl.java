package com.beverage.payment.application.usecase;

import com.beverage.payment.common.HashUtils;
import com.beverage.payment.infrastructure.config.VNPayConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class VNPayUseCaseImpl implements VNPayUseCase {

    private final VNPayConfig vnpayConfig;

    private static final String VNP_VERSION = "2.1.0";
    private static final String VNP_COMMAND = "pay";
    private static final String VNP_ORDER_TYPE = "other";
    private static final String VNP_LOCALE = "vn";
    private static final String VNP_CURR_CODE = "VND";

    @Override
    public String generatePaymentUrl(String orderCode, BigDecimal amount, String ipAddress) {
        log.info("Generating VNPay URL for orderCode={} amount={} ip={}", orderCode, amount, ipAddress);

        // VNPay amount is multiplied by 100
        BigDecimal vnpAmount = amount.multiply(BigDecimal.valueOf(100)).setScale(0);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        ZonedDateTime nowGmt7 = ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        String createDate = nowGmt7.format(formatter);
        String expireDate = nowGmt7.plusMinutes(15).format(formatter); // Link expires in 15 mins

        Map<String, String> vnpParams = new TreeMap<>();
        vnpParams.put("vnp_Version", VNP_VERSION);
        vnpParams.put("vnp_Command", VNP_COMMAND);
        vnpParams.put("vnp_TmnCode", vnpayConfig.getTmnCode());
        vnpParams.put("vnp_Amount", vnpAmount.toString());
        vnpParams.put("vnp_CurrCode", VNP_CURR_CODE);
        vnpParams.put("vnp_TxnRef", orderCode);
        vnpParams.put("vnp_OrderInfo", "Thanh toan don hang " + orderCode);
        vnpParams.put("vnp_OrderType", VNP_ORDER_TYPE);
        vnpParams.put("vnp_Locale", VNP_LOCALE);
        vnpParams.put("vnp_ReturnUrl", vnpayConfig.getReturnUrl());
        vnpParams.put("vnp_IpAddr", ipAddress != null ? ipAddress : "127.0.0.1");
        vnpParams.put("vnp_CreateDate", createDate);
        vnpParams.put("vnp_ExpireDate", expireDate);

        // Build query string
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<Map.Entry<String, String>> itr = vnpParams.entrySet().iterator();

        while (itr.hasNext()) {
            Map.Entry<String, String> entry = itr.next();
            String fieldName = entry.getKey();
            String fieldValue = entry.getValue();

            if (fieldValue != null && !fieldValue.isEmpty()) {
                // Hash data uses URL encoded values
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                // Query string uses URL encoded values
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String queryUrl = query.toString();
        String secureHash = HashUtils.hmacSha512(vnpayConfig.getHashSecret(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + secureHash;

        String paymentUrl = vnpayConfig.getUrl() + "?" + queryUrl;
        log.info("Generated VNPay paymentUrl success");
        return paymentUrl;
    }

    @Override
    public boolean verifySignature(Map<String, String> fields) {
        String secureHash = fields.get("vnp_SecureHash");
        if (secureHash == null) {
            log.warn("VNPay signature verification failed: vnp_SecureHash is missing");
            return false;
        }

        // Remove signature keys to calculate check hash
        Map<String, String> hashFields = new TreeMap<>(fields);
        hashFields.remove("vnp_SecureHash");
        hashFields.remove("vnp_SecureHashType");

        StringBuilder hashData = new StringBuilder();
        Iterator<Map.Entry<String, String>> itr = hashFields.entrySet().iterator();
        while (itr.hasNext()) {
            Map.Entry<String, String> entry = itr.next();
            String fieldName = entry.getKey();
            String fieldValue = entry.getValue();
            if (fieldValue != null && !fieldValue.isEmpty()) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }
        }

        String calculatedHash = HashUtils.hmacSha512(vnpayConfig.getHashSecret(), hashData.toString());
        boolean isValid = calculatedHash.equalsIgnoreCase(secureHash);
        if (!isValid) {
            log.warn("VNPay signature mismatch! Calculated: {} Received: {}", calculatedHash, secureHash);
        }
        return isValid;
    }
}
