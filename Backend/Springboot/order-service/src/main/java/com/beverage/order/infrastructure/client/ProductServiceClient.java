package com.beverage.order.infrastructure.client;

import com.beverage.order.domain.exception.BusinessException;
import com.beverage.order.domain.exception.ResourceNotFoundException;
import com.beverage.order.infrastructure.client.dto.ProductCatalogDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProductServiceClient {

    private final RestClient productRestClient;

    public ProductCatalogDto.ProductData getProduct(UUID productId) {
        try {
            ProductCatalogDto response = productRestClient.get()
                    .uri("/api/v1/products/{id}", productId)
                    .retrieve()
                    .body(ProductCatalogDto.class);

            if (response == null || response.getData() == null) {
                throw new ResourceNotFoundException("Sản phẩm", "id", productId);
            }
            return response.getData();
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResourceNotFoundException("Sản phẩm", "id", productId);
        } catch (HttpClientErrorException e) {
            log.warn("Product service HTTP {} for product {}", e.getStatusCode(), productId);
            throw new BusinessException("Không thể lấy thông tin sản phẩm từ catalog", "PRODUCT_CLIENT_ERROR");
        } catch (RestClientException e) {
            log.error("Product service unavailable for {}: {}", productId, e.getMessage());
            throw new BusinessException("Dịch vụ sản phẩm tạm thời không khả dụng", "PRODUCT_SERVICE_UNAVAILABLE");
        }
    }
}
