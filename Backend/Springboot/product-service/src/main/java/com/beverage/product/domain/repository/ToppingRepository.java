package com.beverage.product.domain.repository;

import com.beverage.product.domain.entity.Topping;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ToppingRepository {
    Topping save(Topping topping);

    Optional<Topping> findById(UUID id);

    List<Topping> findAllActive();

    List<Topping> findAll();

    List<Topping> findByIds(List<UUID> ids);

    void deleteById(UUID id);
}

