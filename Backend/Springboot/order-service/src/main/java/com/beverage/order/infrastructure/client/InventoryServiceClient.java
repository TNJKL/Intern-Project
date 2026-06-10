package com.beverage.order.infrastructure.client;

import com.beverage.order.domain.exception.BusinessException;
import com.beverage.order.domain.exception.ServiceUnavailableException;
import com.beverage.order.infrastructure.client.dto.InventoryItemRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class InventoryServiceClient {

    private final RestClient inventoryRestClient;
    private final ObjectMapper objectMapper;

    @CircuitBreaker(name = "inventoryService", fallbackMethod = "fallbackCheckStockAvailability")
    public void checkStockAvailability(List<InventoryItemRequest> items) {
        if (items == null || items.isEmpty()) {
            return;
        }

        try {
            inventoryRestClient.post()
                    .uri("/api/v1/inventory/check-availability")
                    .body(items)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Synchronous inventory stock check passed successfully.");
        } catch (HttpClientErrorException e) {
            String responseBody = e.getResponseBodyAsString();
            log.warn("Inventory check availability returned HTTP status={}: {}", e.getStatusCode(), responseBody);
            String message = extractMessage(responseBody);
            throw new BusinessException(message, "INVENTORY_STOCK_UNAVAILABLE");
        }
    }

    public void fallbackCheckStockAvailability(List<InventoryItemRequest> items, Throwable t) {
        if (t instanceof BusinessException) {
            throw (BusinessException) t;
        }
        log.error("Circuit breaker 'inventoryService' triggered! Fallback ném lỗi 503. Nguyên nhân: {}", t.getMessage());
        throw new ServiceUnavailableException("Hệ thống đang bảo trì, vui lòng thử lại sau ít phút");
    }

    private String extractMessage(String json) {
        if (json == null || json.isBlank()) {
            return "Không đủ nguyên liệu/topping trong kho.";
        }
        try {
            JsonNode root = objectMapper.readTree(json);
            if (root.has("message")) {
                return root.get("message").asText();
            }
        } catch (Exception e) {
            log.warn("Failed to parse error message from inventory response: {}", e.getMessage());
        }
        return "Không đủ nguyên liệu/topping trong kho.";
    }
}
