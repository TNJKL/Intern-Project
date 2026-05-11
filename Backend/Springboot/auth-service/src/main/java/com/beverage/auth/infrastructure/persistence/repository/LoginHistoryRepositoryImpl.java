package com.beverage.auth.infrastructure.persistence.repository;

import com.beverage.auth.domain.entity.LoginHistory;
import com.beverage.auth.domain.repository.LoginHistoryRepository;
import com.beverage.auth.infrastructure.persistence.mapper.LoginHistoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class LoginHistoryRepositoryImpl implements LoginHistoryRepository {

    private final LoginHistoryJpaRepository loginHistoryJpaRepository;
    private final LoginHistoryMapper loginHistoryMapper;

    @Override
    public LoginHistory save(LoginHistory loginHistory) {
        return loginHistoryMapper.toDomain(loginHistoryJpaRepository.save(loginHistoryMapper.toEntity(loginHistory)));
    }

    @Override
    public List<LoginHistory> findByUserIdOrderByCreatedAtDesc(UUID userId) {
        return loginHistoryJpaRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(loginHistoryMapper::toDomain)
                .toList();
    }
}
