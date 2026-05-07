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
    public Optional<Topping> findById(UUID id) {
        return toppingJpaRepository.findById(id).map(toppingMapper::toDomain);
    }

    @Override
    public List<Topping> findAllActive() {
        return toppingJpaRepository.findByIsAvailableTrue().stream()
                .map(toppingMapper::toDomain)
                .toList();
    }

    @Override
    public List<Topping> findAll() {
        return toppingJpaRepository.findAll().stream()
                .map(toppingMapper::toDomain)
                .toList();
    }

    @Override
    public List<Topping> findByIds(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        return toppingJpaRepository.findByIdIn(ids).stream()
                .map(toppingMapper::toDomain)
                .toList();
    }

    @Override
    public void deleteById(UUID id) {
        toppingJpaRepository.deleteById(id);
    }
}

