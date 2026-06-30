package com.beverage.auth.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAddress {
    private UUID id;
    private String label;
    private String detailAddress;
    private Boolean isDefault;
}
