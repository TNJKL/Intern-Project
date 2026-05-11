package com.beverage.auth.infrastructure.persistence.repository;

import com.beverage.auth.domain.entity.User;
import com.beverage.auth.domain.repository.UserRepository;
import com.beverage.auth.infrastructure.persistence.entity.UserEntity;
import com.beverage.auth.infrastructure.persistence.mapper.UserEntityMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Implementation của UserRepository (Domain Interface)
 * Nằm trong Infrastructure Layer
 */
@Repository
@RequiredArgsConstructor
public class UserRepositoryImpl implements UserRepository {

    private final UserJpaRepository jpaRepository;
    private final UserEntityMapper mapper;

    @Override
    public User save(User user) {
        UserEntity entity = mapper.toEntity(user);
        UserEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<User> findById(UUID id) {
        return jpaRepository.findById(id)
                .map(mapper::toDomain);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return jpaRepository.findByEmail(email)
                .map(mapper::toDomain);
    }

    @Override
    public boolean existsByEmail(String email) {
        return jpaRepository.existsByEmail(email);
    }

    @Override
    public Page<User> findAll(Pageable pageable) {
        return jpaRepository.findAll(pageable)
                .map(mapper::toDomain);
    }

    @Override
    public Page<User> findByRole(String role, Pageable pageable) {
        return jpaRepository.findByRole(role, pageable)
                .map(mapper::toDomain);
    }

    @Override
    public Page<User> findByIsActive(Boolean isActive, Pageable pageable) {
        return jpaRepository.findByIsActive(isActive, pageable)
                .map(mapper::toDomain);
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }
}
