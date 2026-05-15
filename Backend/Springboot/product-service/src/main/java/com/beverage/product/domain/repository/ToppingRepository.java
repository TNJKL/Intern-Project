package com.beverage.product.domain.repository;

import com.beverage.product.domain.entity.Topping;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ToppingRepository {

    Topping save(Topping topping);

    Optional<Topping> findActiveById(UUID id);

    Optional<Topping> findIncludingDeletedById(UUID id);

    List<Topping> findAll();

    /** {@code false}: topping đang bán và chưa xóa mềm; {@code true}: mọi bản ghi. */
    List<Topping> listCatalog(boolean includeDeleted);

    List<Topping> findActiveByIds(List<UUID> ids);
}
