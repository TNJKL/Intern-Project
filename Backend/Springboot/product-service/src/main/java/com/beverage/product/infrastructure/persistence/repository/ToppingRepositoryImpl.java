package com.beverage.product.infrastructure.persistence.repository;

import com.beverage.product.domain.entity.Topping;
import com.beverage.product.domain.repository.ToppingRepository;
import com.beverage.product.infrastructure.persistence.mapper.ToppingMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class ToppingRepositoryImpl implements ToppingRepository {

    private final ToppingJpaRepository toppingJpaRepository;
    private final ToppingMapper toppingMapper;

    @Override
    public Topping save(Topping topping) {
        return toppingMapper.toDomain(
                toppingJpaRepository.save(toppingMapper.toEntity(topping))
        );
    }

    @Override
    public Optional<Topping> findActiveById(UUID id) {
        return toppingJpaRepository.findByIdAndDeletedAtIsNull(id).map(toppingMapper::toDomain);
    }

    @Override
    public Optional<Topping> findIncludingDeletedById(UUID id) {
        return toppingJpaRepository.findById(id).map(toppingMapper::toDomain);
    }

    @Override
    public List<Topping> findAll() {
        return toppingJpaRepository.findAll().stream()
                .map(toppingMapper::toDomain)
                .toList();
    }

    @Override
    public List<Topping> listCatalog(boolean includeDeleted) {
        if (includeDeleted) {
            return toppingJpaRepository.findAllForCatalogOrderByDisplayOrderAsc().stream()
                    .map(toppingMapper::toDomain)
                    .toList();
        }
        return toppingJpaRepository.findByIsAvailableTrueAndDeletedAtIsNullOrderByDisplayOrderAsc().stream()
                .map(toppingMapper::toDomain)
                .toList();
    }

    @Override
    public List<Topping> findActiveByIds(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return toppingJpaRepository.findActiveByIdIn(ids).stream()
                .map(toppingMapper::toDomain)
                .toList();
    }
}
