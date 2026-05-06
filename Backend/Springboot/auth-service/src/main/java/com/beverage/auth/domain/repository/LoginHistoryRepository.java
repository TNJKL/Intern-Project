package com.beverage.auth.domain.repository;

import com.beverage.auth.domain.entity.LoginHistory;

import java.util.List;
import java.util.UUID;

public interface LoginHistoryRepository {
    LoginHistory save(LoginHistory loginHistory);
    List<LoginHistory> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
