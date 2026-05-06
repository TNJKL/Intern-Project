package com.beverage.auth.domain.repository;

import com.beverage.auth.domain.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository Interface - Domain Layer
 * Không phụ thuộc Spring Data JPA
 */
public interface UserRepository {

    User save(User user);

    Optional<User> findById(UUID id);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Page<User> findAll(Pageable pageable);

    Page<User> findByRole(String role, Pageable pageable);

    Page<User> findByIsActive(Boolean isActive, Pageable pageable);

    void deleteById(UUID id);
}
