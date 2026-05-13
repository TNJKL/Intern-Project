package com.beverage.product.application.usecase;

import com.beverage.product.application.dto.request.CreateToppingRequest;
import com.beverage.product.application.dto.request.UpdateToppingRequest;
import com.beverage.product.application.dto.response.ToppingResponse;
import com.beverage.product.application.mapper.ToppingDtoMapper;
import com.beverage.product.domain.entity.Topping;
import com.beverage.product.domain.exception.BusinessException;
import com.beverage.product.domain.exception.ResourceNotFoundException;
import com.beverage.product.domain.repository.ToppingRepository;
import com.beverage.product.infrastructure.cache.RedisCacheService;
import com.beverage.product.infrastructure.storage.CatalogImageStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ToppingUseCase {

    private static final String CACHE_TOPPINGS_KEY = "cache:toppings";

    private final ToppingRepository toppingRepository;
    private final ToppingDtoMapper toppingDtoMapper;
    private final RedisCacheService redisCacheService;
    private final CatalogImageStorageService catalogImageStorageService;

    public ToppingResponse createTopping(@Valid CreateToppingRequest request) {
        Topping topping = toppingDtoMapper.toDomainCreate(request);
        Topping saved = toppingRepository.save(topping);
        evictCaches();
        return toppingDtoMapper.toResponse(saved);
    }

    public ToppingResponse updateTopping(UUID id, @Valid UpdateToppingRequest request) {
        Topping existing = toppingRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topping", "id", id));

        Topping updated = toppingDtoMapper.toDomainUpdate(request);
        updated.setId(id);
        updated.setDeletedAt(existing.getDeletedAt());
        updated.setCreatedAt(existing.getCreatedAt());
        if (updated.getImageUrl() == null || updated.getImageUrl().isBlank()) {
            updated.setImageUrl(existing.getImageUrl());
        }

        Topping saved = toppingRepository.save(updated);
        catalogImageStorageService.deleteIfChangedQuietly(existing.getImageUrl(), saved.getImageUrl());
        evictCaches();
        return toppingDtoMapper.toResponse(saved);
    }

    public void deleteTopping(UUID id) {
        Topping existing = toppingRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topping", "id", id));
        existing.setDeletedAt(LocalDateTime.now());
        toppingRepository.save(existing);
        evictCaches();
    }

    public void restoreTopping(UUID id) {
        Topping existing = toppingRepository.findIncludingDeletedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topping", "id", id));
        if (existing.getDeletedAt() == null) {
            throw new BusinessException("Topping chưa nằm trong thùng rác (đang hoạt động).", "NOT_SOFT_DELETED");
        }
        existing.setDeletedAt(null);
        toppingRepository.save(existing);
        evictCaches();
    }

    public ToppingResponse getToppingById(UUID id) {
        Topping topping = toppingRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topping", "id", id));
        return toppingDtoMapper.toResponse(topping);
    }

    public List<ToppingResponse> listToppings(boolean includeDeleted) {
        if (includeDeleted) {
            return toppingRepository.listCatalog(true).stream()
                    .map(toppingDtoMapper::toResponse)
                    .toList();
        }
        TypeReference<List<ToppingResponse>> typeRef = new TypeReference<>() {};
        List<ToppingResponse> cached = redisCacheService.get(CACHE_TOPPINGS_KEY, typeRef);
        if (cached != null) {
            return cached;
        }
        List<ToppingResponse> response = toppingRepository.listCatalog(false).stream()
                .map(toppingDtoMapper::toResponse)
                .toList();
        redisCacheService.set(CACHE_TOPPINGS_KEY, response);
        return response;
    }

    private void evictCaches() {
        redisCacheService.delete(CACHE_TOPPINGS_KEY);
        redisCacheService.deleteByPattern("cache:product:*");
    }
}
