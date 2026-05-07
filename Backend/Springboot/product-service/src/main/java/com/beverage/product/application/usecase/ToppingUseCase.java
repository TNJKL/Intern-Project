package com.beverage.product.application.usecase;

import com.beverage.product.application.dto.request.CreateToppingRequest;
import com.beverage.product.application.dto.request.UpdateToppingRequest;
import com.beverage.product.application.dto.response.ToppingResponse;
import com.beverage.product.application.mapper.ToppingDtoMapper;
import com.beverage.product.domain.entity.Topping;
import com.beverage.product.domain.exception.ResourceNotFoundException;
import com.beverage.product.domain.repository.ToppingRepository;
import com.beverage.product.infrastructure.cache.RedisCacheService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ToppingUseCase {

    private static final String CACHE_TOPPINGS_KEY = "cache:toppings";

    private final ToppingRepository toppingRepository;
    private final ToppingDtoMapper toppingDtoMapper;
    private final RedisCacheService redisCacheService;

    public ToppingResponse createTopping(@Valid CreateToppingRequest request) {
        Topping topping = toppingDtoMapper.toDomainCreate(request);
        Topping saved = toppingRepository.save(topping);
        redisCacheService.delete(CACHE_TOPPINGS_KEY);
        redisCacheService.deleteByPattern("cache:product:*");
        return toppingDtoMapper.toResponse(saved);
    }

    public ToppingResponse updateTopping(UUID id, @Valid UpdateToppingRequest request) {
        if (toppingRepository.findById(id).isEmpty()) {
            throw new ResourceNotFoundException("Topping", "id", id);
        }

        Topping updated = toppingDtoMapper.toDomainUpdate(request);
        updated.setId(id);

        Topping saved = toppingRepository.save(updated);
        redisCacheService.delete(CACHE_TOPPINGS_KEY);
        redisCacheService.deleteByPattern("cache:product:*");
        return toppingDtoMapper.toResponse(saved);
    }

    public void deleteTopping(UUID id) {
        if (toppingRepository.findById(id).isEmpty()) {
            throw new ResourceNotFoundException("Topping", "id", id);
        }
        toppingRepository.deleteById(id);
        redisCacheService.delete(CACHE_TOPPINGS_KEY);
        redisCacheService.deleteByPattern("cache:product:*");
    }

    public ToppingResponse getToppingById(UUID id) {
        Topping topping = toppingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topping", "id", id));
        return toppingDtoMapper.toResponse(topping);
    }

    public java.util.List<ToppingResponse> listToppingsActive() {
        TypeReference<java.util.List<ToppingResponse>> typeRef = new TypeReference<>() {};
        java.util.List<ToppingResponse> cached = redisCacheService.get(CACHE_TOPPINGS_KEY, typeRef);
        if (cached != null) {
            return cached;
        }

        java.util.List<ToppingResponse> response = toppingRepository.findAllActive().stream()
                .map(toppingDtoMapper::toResponse)
                .toList();
        redisCacheService.set(CACHE_TOPPINGS_KEY, response);
        return response;
    }
}

