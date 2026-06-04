package com.beverage.order.infrastructure.client;

import com.beverage.order.domain.exception.BusinessException;
import com.beverage.order.infrastructure.client.dto.InventoryItemRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to perform synchronous inventory check: {}", e.getMessage(), e);
            throw new BusinessException("Dịch vụ kho hàng tạm thời không khả dụng, vui lòng thử lại sau.", "INVENTORY_SERVICE_UNAVAILABLE");
        }
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
