package com.beverage.product.infrastructure.storage;

import com.beverage.product.domain.entity.Category;
import com.beverage.product.domain.entity.Product;
import com.beverage.product.domain.entity.Topping;
import com.beverage.product.domain.repository.CategoryRepository;
import com.beverage.product.domain.repository.ProductRepository;
import com.beverage.product.domain.repository.ToppingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StorageConsistencyService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ToppingRepository toppingRepository;
    private final CatalogImageStorageService catalogImageStorageService;

    public Map<String, Object> checkCatalogImageConsistency() {
        List<Map<String, Object>> missingOnS3 = new ArrayList<>();

        for (Product product : productRepository.findAll()) {
            collectIfMissing("product", product.getId(), product.getImageUrl(), missingOnS3);
        }
        for (Category category : categoryRepository.findAll()) {
            collectIfMissing("category", category.getId(), category.getImageUrl(), missingOnS3);
        }
        for (Topping topping : toppingRepository.findAll()) {
            collectIfMissing("topping", topping.getId(), topping.getImageUrl(), missingOnS3);
        }

        return Map.of(
                "ok", missingOnS3.isEmpty(),
                "missingCount", missingOnS3.size(),
                "missingOnS3", missingOnS3
        );
    }

    private void collectIfMissing(String entityType, UUID entityId, String imageUrl, List<Map<String, Object>> out) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }
        boolean exists = catalogImageStorageService.existsOnStorage(imageUrl);
        if (!exists) {
            out.add(Map.of(
                    "entityType", entityType,
                    "entityId", entityId.toString(),
                    "imageUrl", imageUrl
            ));
        }
    }
}
